const { Op } = require("sequelize");
const { GrayLot, DeliveryOrder } = require("../models");

exports.createGrayLot = async (req, res, next) => {
  try {
    const payload = {
      entry_date: String(req.body.entryDate || "").trim(),
      party_name: String(req.body.partyName || "").trim(),
      process_type: String(req.body.processType || "").trim(),
      bill_no: String(req.body.billNo || "").trim() || null,
      lot_no: String(req.body.lotNo || "").trim(),
      quality: String(req.body.quality || "").trim(),
      measurement: String(req.body.measurement || "").trim(),
      than: Number(req.body.than || 0),
      gazana: Number(req.body.gazana || 0),
      notes: String(req.body.notes || "").trim() || null,
    };

    if (!payload.entry_date || !payload.party_name || !payload.process_type || !payload.lot_no || !payload.quality) {
      return res.status(400).json({ message: "entryDate, partyName, processType, lotNo, quality are required" });
    }

    const created = await GrayLot.create(payload);
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
          attributes: ['total_ready_gazana'],
        }
      ],
      order: [["id", "DESC"]]
    });

    const results = lots.map((lot) => {
      const delivered = lot.delivery_orders ? lot.delivery_orders.reduce((sum, order) => sum + Number(order.total_ready_gazana || 0), 0) : 0;
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
