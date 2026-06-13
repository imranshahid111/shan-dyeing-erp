const { GatePass, GatePassItem, DeliveryOrder, Customer, GrayLot, sequelize } = require("../models");
const { getNextSequence } = require("../utils/numberGenerator");
const { logActivity } = require("../utils/logger");

exports.getGatePasses = async (req, res, next) => {
  try {
    const gatePasses = await GatePass.findAll({
      order: [["id", "DESC"]],
      include: [
        {
          model: GatePassItem,
          as: "items",
          include: [
            {
              model: DeliveryOrder,
              as: "delivery_order",
              attributes: ["id", "order_no", "total_gray_gazana", "total_ready_gazana"],
              include: [
                { model: Customer, attributes: ["id", "name", "customer_code"] },
                { model: GrayLot, attributes: ["id", "lot_no", "party_name"] },
              ],
            },
          ],
        },
      ],
    });
    return res.json(gatePasses);
  } catch (error) {
    return next(error);
  }
};

exports.getNextGatePassNumber = async (req, res, next) => {
  try {
    const nextNumber = await getNextSequence(GatePass, "gate_pass_no", "GP-");
    return res.json({ nextNumber });
  } catch (error) {
    return next(error);
  }
};

exports.createGatePass = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { gate_pass_date, vehicle_no, driver_name, driver_mobile, notes, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "At least one Delivery Order item is required" });
    }

    const nextGatePassNo = await getNextSequence(GatePass, "gate_pass_no", "GP-");

    const gatePass = await GatePass.create({
      gate_pass_no: nextGatePassNo,
      gate_pass_date: gate_pass_date || new Date().toISOString().split("T")[0],
      vehicle_no,
      driver_name,
      driver_mobile,
      notes,
    }, { transaction: t });

    // Create all items
    const itemRecords = items.map((item) => ({
      gate_pass_id: gatePass.id,
      delivery_order_id: item.delivery_order_id,
      description: item.description || null,
      bundles: item.bundles || 0,
      gazana_total: item.gazana_total || 0,
    }));

    await GatePassItem.bulkCreate(itemRecords, { transaction: t });

    await t.commit();

    const orderNos = items.map(i => i.order_no || i.delivery_order_id).join(", ");
    await logActivity("Gate Passes", `Created Gate Pass #${nextGatePassNo}`, `For DOs: ${orderNos}`, req);

    // Return with items included
    const full = await GatePass.findByPk(gatePass.id, {
      include: [
        {
          model: GatePassItem,
          as: "items",
          include: [
            {
              model: DeliveryOrder,
              as: "delivery_order",
              attributes: ["id", "order_no", "total_gray_gazana"],
              include: [
                { model: Customer, attributes: ["id", "name", "customer_code"] },
                { model: GrayLot, attributes: ["id", "lot_no", "party_name"] },
              ],
            },
          ],
        },
      ],
    });

    return res.status(201).json(full);
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};

exports.deleteGatePass = async (req, res, next) => {
  try {
    const gatePass = await GatePass.findByPk(req.params.id);
    if (!gatePass) {
      return res.status(404).json({ message: "Gate Pass not found" });
    }

    const gatePassNo = gatePass.gate_pass_no;
    // Items cascade delete automatically via FK
    await gatePass.destroy();

    await logActivity("Gate Passes", `Deleted Gate Pass #${gatePassNo}`, `Deleted record ID ${req.params.id}`, req);

    return res.json({ success: true, message: "Gate Pass deleted successfully" });
  } catch (error) {
    return next(error);
  }
};
