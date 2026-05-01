const { DeliveryOrder, Customer, GrayLot, Payment, sequelize } = require("../models");

exports.getDeliveryOrders = async (req, res, next) => {
  try {
    const status = String(req.query.status || "");
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);

    const where = status ? { status } : undefined;

    const { count, rows } = await DeliveryOrder.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name", "customer_code"] },
        { model: GrayLot, attributes: ["lot_no"] }
      ],
      order: [["order_date", "DESC"], ["id", "DESC"]],
      attributes: ["id", "order_no", "customer_id", "gray_lot_id", "order_date", "status", "total_amount", "paid_amount", "total_ready_gazana"],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return res.json({ page, pageSize, total: count, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.createDeliveryOrder = async (req, res, next) => {
  try {
    const { gray_lot_id, total_ready_gazana, grid_data } = req.body;
    
    const lot = await GrayLot.findByPk(gray_lot_id);
    if (!lot) return res.status(404).json({ message: "Gray lot not found" });

    const orders = await DeliveryOrder.findAll({ where: { gray_lot_id } });
    const delivered = orders.reduce((sum, o) => sum + Number(o.total_ready_gazana || 0), 0);
    const balance = Number(lot.gazana || 0) - delivered;
    const readyQty = Number(total_ready_gazana || 0);

    if (readyQty > balance) {
      return res.status(400).json({ message: `Qty (${readyQty}) exceeds remaining gazana (${balance})` });
    }

    let customer = await Customer.findOne({ where: { name: lot.party_name } });
    
    const newDo = await DeliveryOrder.create({
      order_no: `DO-${Date.now().toString().slice(-6)}`,
      customer_id: customer ? customer.id : 1,
      gray_lot_id,
      order_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      total_ready_gazana: readyQty,
      grid_data: grid_data || {},
      status: "completed"
    });

    return res.status(201).json(newDo);
  } catch (err) {
    return next(err);
  }
};

exports.generateInvoice = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const doId = req.params.id;
    const { netAmount } = req.body;

    const deliveryOrder = await DeliveryOrder.findByPk(doId, { transaction: t });
    if (!deliveryOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Delivery Order not found" });
    }

    if (deliveryOrder.status === "billed") {
      await t.rollback();
      return res.status(400).json({ message: "Delivery order is already billed" });
    }

    await Customer.increment("outstanding_amount", {
      by: Number(netAmount || 0),
      where: { id: deliveryOrder.customer_id },
      transaction: t,
    });

    await deliveryOrder.update({
      total_amount: Number(netAmount || 0),
      status: "billed",
    }, { transaction: t });

    await t.commit();
    return res.json(deliveryOrder);
  } catch (err) {
    await t.rollback();
    return next(err);
  }
};

exports.addPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const doId = req.params.id;
    const { amount, paymentDate, method, reference, notes } = req.body;

    const deliveryOrder = await DeliveryOrder.findByPk(doId, { transaction: t });
    if (!deliveryOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Delivery Order not found" });
    }

    const payAmount = Number(amount || 0);

    // 1. Create Payment Log
    await Payment.create({
      delivery_order_id: doId,
      payment_date: paymentDate,
      amount: payAmount,
      mode: method || "cash",
      reference_no: reference,
      notes: notes,
    }, { transaction: t });

    // 2. Update Delivery Order (billed status doesn't change, just paid_amount)
    await deliveryOrder.increment("paid_amount", {
      by: payAmount,
      transaction: t,
    });

    // 3. Update Customer Ledger
    await Customer.decrement("outstanding_amount", {
      by: payAmount,
      where: { id: deliveryOrder.customer_id },
      transaction: t,
    });

    await t.commit();
    return res.json({ success: true, message: "Payment added successfully" });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
};
