const { Op } = require("sequelize");
const { GrayLot, DeliveryOrder, Quality } = require("../models");
const { getNextSequence } = require("../utils/numberGenerator");
const { logActivity } = require("../utils/logger");

exports.createGrayLot = async (req, res, next) => {
  try {
    const payload = {
      entry_date: String(req.body.entryDate || "").trim(),
      party_name: String(req.body.partyName || "").trim(),
      process_type: String(req.body.processType || "").trim(),
      bill_no: String(req.body.billNo || "").trim() || null,
      lot_no: req.body.lotNo ? String(req.body.lotNo).trim() : await getNextSequence(GrayLot, 'lot_no', 'LOT-'),
      quality_id: Number(req.body.qualityId),
      measurement: String(req.body.measurement || "").trim(),
      than: Number(req.body.than || 0),
      gazana: Number(req.body.gazana || 0),
      notes: String(req.body.notes || "").trim() || null,
    };

    if (!payload.entry_date || !payload.party_name || !payload.process_type || !payload.lot_no || !payload.quality_id) {
      return res.status(400).json({ message: "entryDate, partyName, processType, lotNo, qualityId are required" });
    }

    const created = await GrayLot.create(payload);
    await logActivity("Gray Lots", `Created Lot #${payload.lot_no}`, `Party: ${payload.party_name}, Quality ID: ${payload.quality_id}`, req);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

exports.getGrayLots = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
    const search = String(req.query.search || "").trim();

    const where = search
      ? {
          [Op.or]: [
            { lot_no: { [Op.like]: `${search}%` } },
            { party_name: { [Op.like]: `${search}%` } },
            { bill_no: { [Op.like]: `${search}%` } },
          ],
        }
      : undefined;

    const { count, rows } = await GrayLot.findAndCountAll({
      where,
      include: [{ model: Quality, attributes: ['id', 'name'] }],
      order: [["id", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return res.json({ page, pageSize, total: count, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.getLotsWithBalance = async (req, res, next) => {
  try {
    const lots = await GrayLot.findAll({
      include: [
        {
          model: DeliveryOrder,
          attributes: ['total_gray_gazana'],
        }
      ],
      order: [["id", "DESC"]]
    });

    const results = lots.map((lot) => {
      const delivered = lot.delivery_orders ? lot.delivery_orders.reduce((sum, order) => sum + Number(order.total_gray_gazana || 0), 0) : 0;
      const gazana = Number(lot.gazana || 0);
      return {
        id: lot.id,
        lotNo: lot.lot_no,
        partyName: lot.party_name,
        process: lot.process_type,
        totalGray: gazana,
        remaining: Math.max(gazana - delivered, 0)
      };
    });

    return res.json(results);
  } catch (error) {
    return next(error);
  }
};

exports.deleteGrayLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if any DOs exist for this lot
    const linkedOrders = await DeliveryOrder.count({ where: { gray_lot_id: id } });
    if (linkedOrders > 0) {
      return res.status(400).json({ 
        message: "Cannot delete Lot because it has linked Delivery Orders. Delete those first." 
      });
    }

    const deleted = await GrayLot.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: "Lot not found" });
    }

    await logActivity("Gray Lots", `Deleted Lot ID #${id}`, `Gray Lot removed from system`, req);
    return res.json({ success: true, message: "Gray Lot deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

exports.getNextLotNumber = async (req, res, next) => {
  try {
    const nextNo = await getNextSequence(GrayLot, 'lot_no', 'LOT-');
    return res.json({ nextLotNo: nextNo });
  } catch (error) {
    return next(error);
  }
};

exports.getGrayLotById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lot = await GrayLot.findByPk(id, {
      include: [{ model: Quality, attributes: ['id', 'name'] }]
    });
    if (!lot) {
      return res.status(404).json({ message: "Gray Lot not found" });
    }
    return res.json(lot);
  } catch (error) {
    return next(error);
  }
};

exports.updateGrayLot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lot = await GrayLot.findByPk(id);
    if (!lot) {
      return res.status(404).json({ message: "Gray Lot not found" });
    }

    const payload = {
      entry_date: String(req.body.entryDate || "").trim(),
      party_name: String(req.body.partyName || "").trim(),
      process_type: String(req.body.processType || "").trim(),
      bill_no: String(req.body.billNo || "").trim() || null,
      quality_id: Number(req.body.qualityId),
      measurement: String(req.body.measurement || "").trim(),
      than: Number(req.body.than || 0),
      gazana: Number(req.body.gazana || 0),
      notes: String(req.body.notes || "").trim() || null,
    };

    if (!payload.entry_date || !payload.party_name || !payload.process_type || !payload.quality_id) {
      return res.status(400).json({ message: "entryDate, partyName, processType, qualityId are required" });
    }

    await lot.update(payload);
    await logActivity("Gray Lots", `Updated Lot #${lot.lot_no}`, `Party: ${payload.party_name}, Quality ID: ${payload.quality_id}`, req);
    return res.json(lot);
  } catch (error) {
    return next(error);
  }
};
