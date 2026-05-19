const { GatePass, DeliveryOrder, Customer, sequelize } = require("../models");
const { getNextSequence } = require("../utils/numberGenerator");
const { logActivity } = require("../utils/logger");

exports.getGatePasses = async (req, res, next) => {
  try {
    const gatePasses = await GatePass.findAll({
      order: [["id", "DESC"]],
      include: [
        {
          model: DeliveryOrder,
          include: [
            { model: Customer, attributes: ["id", "name", "customer_code"] }
          ]
        }
      ]
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
    const { delivery_order_id, gate_pass_date, vehicle_no, driver_name, driver_mobile, notes } = req.body;
    
    if (!delivery_order_id) {
      await t.rollback();
      return res.status(400).json({ message: "Delivery Order Reference is required" });
    }
    
    // Check if DO exists
    const deliveryOrder = await DeliveryOrder.findByPk(delivery_order_id, { transaction: t });
    if (!deliveryOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Delivery Order not found" });
    }
    
    // Check if DO already has a Gate Pass
    const exists = await GatePass.findOne({ where: { delivery_order_id }, transaction: t });
    if (exists) {
      await t.rollback();
      return res.status(400).json({ message: "Gate Pass already issued for this Delivery Order" });
    }
    
    const nextGatePassNo = await getNextSequence(GatePass, "gate_pass_no", "GP-");
    
    const gatePass = await GatePass.create({
      gate_pass_no: nextGatePassNo,
      delivery_order_id,
      gate_pass_date: gate_pass_date || new Date().toISOString().split('T')[0],
      vehicle_no,
      driver_name,
      driver_mobile,
      notes
    }, { transaction: t });
    
    await t.commit();
    
    // Log activity
    await logActivity("Gate Passes", `Created Gate Pass #${nextGatePassNo}`, `For DO #${deliveryOrder.order_no}`, req);
    
    return res.status(201).json(gatePass);
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
    await gatePass.destroy();

    // Log activity
    await logActivity("Gate Passes", `Deleted Gate Pass #${gatePassNo}`, `Deleted record ID ${req.params.id}`, req);

    return res.json({ success: true, message: "Gate Pass deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

