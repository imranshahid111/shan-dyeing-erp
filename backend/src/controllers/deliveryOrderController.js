const { DeliveryOrder, Customer, GrayLot, Payment, ReturnLot, sequelize } = require("../models");
const { Op } = require("sequelize");
const { getNextSequence } = require("../utils/numberGenerator");
const { logActivity } = require("../utils/logger");

exports.getDeliveryOrders = async (req, res, next) => {
  try {
    const status = String(req.query.status || "");
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
    const { customer_id, startDate, endDate, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (customer_id) where.customer_id = customer_id;
    if (startDate && endDate) {
      where.order_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.order_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.order_date = { [Op.lte]: endDate };
    }
    
    if (search) {
      where[Op.or] = [
        { order_no: { [Op.like]: `%${search}%` } },
        { '$Customer.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await DeliveryOrder.findAndCountAll({
      where,
      subQuery: false,
      include: [
        { model: Customer, attributes: ["id", "name", "customer_code"] },
        { model: GrayLot, attributes: ["lot_no"] },
      ],
      order: [["order_date", "DESC"], ["id", "DESC"]],
      attributes: ["id", "order_no", "invoice_no", "customer_id", "gray_lot_id", "order_date", "status", "total_amount", "paid_amount", "total_gray_gazana", "total_ready_gazana", "rate", "rate_unit", "input_unit", "kinar_cut_amount", "packing_amount", "grid_data"],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return res.json({ page, pageSize, total: count, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.getDeliveryOrderById = async (req, res, next) => {
  try {
    const { Quality } = require("../models");
    const order = await DeliveryOrder.findByPk(req.params.id, {
      include: [
        { model: Customer, attributes: ["id", "name", "customer_code", "phone", "city"] },
        { 
          model: GrayLot, 
          attributes: ["id", "lot_no", "party_name", "measurement"],
          include: [{ model: Quality, attributes: ["name"] }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: "Delivery Order not found" });
    }

    const orderData = order.toJSON();
    if (orderData.gray_lot && orderData.gray_lot.quality) {
      orderData.gray_lot.quality = orderData.gray_lot.quality.name;
    } else if (orderData.GrayLot && orderData.GrayLot.Quality) {
      orderData.GrayLot.quality = orderData.GrayLot.Quality.name;
    }

    return res.json(orderData);
  } catch (error) {
    return next(error);
  }
};

exports.createDeliveryOrder = async (req, res, next) => {
  try {
    console.log("Creating DO with body:", JSON.stringify(req.body, null, 2));
    const { gray_lot_id, total_gray_gazana, total_ready_gazana, grid_data, input_unit } = req.body;
    
    const lot = await GrayLot.findByPk(gray_lot_id);
    if (!lot) return res.status(404).json({ message: "Gray lot not found" });

    const orders = await DeliveryOrder.findAll({ where: { gray_lot_id } });
    const returns = await ReturnLot.findAll({ where: { gray_lot_id } });
    const delivered = orders.reduce((sum, o) => sum + Number(o.total_gray_gazana || 0), 0);
    const returnedQty = returns.reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);
    const balance = Number(lot.gazana || 0) - delivered - returnedQty;
    const grayQty = Number(total_gray_gazana || 0);

    if (grayQty > balance) {
      return res.status(400).json({ message: `Qty (${grayQty}) exceeds remaining gazana (${balance})` });
    }

    let customer = await Customer.findOne({ where: { name: lot.party_name } });
    
    const nextOrderNo = await getNextSequence(DeliveryOrder, 'order_no', 'DO-');
    
    const newDo = await DeliveryOrder.create({
      order_no: nextOrderNo,
      customer_id: customer ? customer.id : 1,
      gray_lot_id,
      order_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      total_gray_gazana: grayQty,
      total_ready_gazana: Number(total_ready_gazana || 0),
      input_unit: input_unit || 'meter',
      grid_data: grid_data || {},
      status: "completed"
    });

    return res.status(201).json(newDo);
  } catch (err) {
    return next(err);
  }
};

exports.updateDeliveryOrder = async (req, res, next) => {
  try {
    const doId = req.params.id;
    const { gray_lot_id, total_gray_gazana, total_ready_gazana, grid_data, input_unit } = req.body;
    
    const deliveryOrder = await DeliveryOrder.findByPk(doId);
    if (!deliveryOrder) return res.status(404).json({ message: "Delivery Order not found" });

    if (deliveryOrder.status === 'billed' || deliveryOrder.status === 'paid') {
       return res.status(400).json({ message: "Cannot edit a billed delivery order. Please delete the invoice first." });
    }

    const lot = await GrayLot.findByPk(gray_lot_id);
    if (!lot) return res.status(404).json({ message: "Gray lot not found" });

    // Check balance
    let orders = await DeliveryOrder.findAll({ where: { gray_lot_id } });
    let returns = await ReturnLot.findAll({ where: { gray_lot_id } });
    let delivered = orders.reduce((sum, o) => {
      // Exclude current DO from the delivered sum
      if (o.id === Number(doId)) return sum;
      return sum + Number(o.total_gray_gazana || 0);
    }, 0);
    let returnedQty = returns.reduce((sum, r) => sum + Number(r.returned_quantity || 0), 0);
    
    const balance = Number(lot.gazana || 0) - delivered - returnedQty;
    const grayQty = Number(total_gray_gazana || 0);

    if (grayQty > balance) {
      return res.status(400).json({ message: `Qty (${grayQty}) exceeds remaining gazana (${balance})` });
    }

    let customer = await Customer.findOne({ where: { name: lot.party_name } });

    await deliveryOrder.update({
      customer_id: customer ? customer.id : deliveryOrder.customer_id,
      gray_lot_id,
      total_gray_gazana: grayQty,
      total_ready_gazana: Number(total_ready_gazana || 0),
      input_unit: input_unit || deliveryOrder.input_unit,
      grid_data: grid_data || {},
    });

    await logActivity("Delivery Orders", `Updated Order #${deliveryOrder.order_no}`, `Updated quantities and grid data`, req);

    return res.json(deliveryOrder);
  } catch (err) {
    return next(err);
  }
};

exports.generateInvoice = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const doId = req.params.id;
    const { netAmount, rate, rateUnit, kinarCutAmount, packingAmount, kinarCutQty, packingQty } = req.body;

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

    const nextInvNo = await getNextSequence(DeliveryOrder, 'invoice_no', 'INV-');

    await deliveryOrder.update({
      total_amount: Number(netAmount || 0),
      status: "billed",
      invoice_no: nextInvNo,
      rate: Number(rate || 0),
      rate_unit: rateUnit || 'meter',
      kinar_cut_amount: Number(kinarCutAmount || 0),
      packing_amount: Number(packingAmount || 0),
      kinar_cut_qty: kinarCutQty != null ? Number(kinarCutQty) : null,
      packing_qty: packingQty != null ? Number(packingQty) : null
    }, { transaction: t });

    await t.commit();
    await logActivity("Invoices", `Generated Invoice #${nextInvNo}`, `Total Amount: ${netAmount}`, req);
    return res.json(deliveryOrder);
  } catch (err) {
    await t.rollback();
    return next(err);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const doId = req.params.id;
    const deliveryOrder = await DeliveryOrder.findByPk(doId, { transaction: t });

    if (!deliveryOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Delivery Order not found" });
    }

    if (deliveryOrder.status !== "billed" && deliveryOrder.status !== "paid") {
      await t.rollback();
      return res.status(400).json({ message: "Order is not billed" });
    }

    const netAmount = Number(deliveryOrder.total_amount || 0);
    const paidAmount = Number(deliveryOrder.paid_amount || 0);

    // 1. Adjust customer balance: subtract total bill, add back payments
    await Customer.decrement("outstanding_amount", {
      by: netAmount - paidAmount,
      where: { id: deliveryOrder.customer_id },
      transaction: t,
    });

    // 2. Delete associated payments
    await Payment.destroy({ where: { delivery_order_id: doId }, transaction: t });

    // 3. Reset Delivery Order
    await deliveryOrder.update({
      total_amount: 0,
      paid_amount: 0,
      status: "completed",
      invoice_no: null,
      rate: null,
      rate_unit: null,
      kinar_cut_amount: 0,
      packing_amount: 0
    }, { transaction: t });

    await t.commit();
    await logActivity("Invoices", `Deleted Invoice #${deliveryOrder.invoice_no}`, `Reverted order ${deliveryOrder.order_no} to completed`, req);
    return res.json({ success: true, message: "Invoice deleted successfully" });
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
      attachment: req.body.attachment || null,
      attachment_name: req.body.attachmentName || null,
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
    await logActivity("Payments", `Received Payment for DO #${deliveryOrder.order_no}`, `Amount: ${payAmount}, Method: ${method}`, req);
    return res.json({ success: true, message: "Payment added successfully" });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const deliveryOrder = await DeliveryOrder.findByPk(id, { transaction: t });

    if (!deliveryOrder) {
      await t.rollback();
      return res.status(404).json({ message: "Delivery Order not found" });
    }

    // If billed, we might need to adjust customer outstanding balance
    if (deliveryOrder.status === 'billed' || deliveryOrder.status === 'paid') {
      const netAmount = Number(deliveryOrder.total_amount || 0);
      const paidAmount = Number(deliveryOrder.paid_amount || 0);
      const balanceToAdjust = netAmount - paidAmount;

      if (balanceToAdjust > 0) {
        await Customer.decrement("outstanding_amount", {
          by: balanceToAdjust,
          where: { id: deliveryOrder.customer_id },
          transaction: t,
        });
      } else if (balanceToAdjust < 0) {
        // This case shouldn't normally happen but just in case
        await Customer.increment("outstanding_amount", {
          by: Math.abs(balanceToAdjust),
          where: { id: deliveryOrder.customer_id },
          transaction: t,
        });
      }
    }

    // Delete associated payments first
    await Payment.destroy({ where: { delivery_order_id: id }, transaction: t });
    
    // Delete the order
    await deliveryOrder.destroy({ transaction: t });

    await t.commit();
    await logActivity("Delivery Orders", `Deleted Order #${deliveryOrder.order_no}`, `Order removed from system`, req);
    return res.json({ success: true, message: "Delivery Order deleted successfully" });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
};
