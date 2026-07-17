const { Op } = require("sequelize");
const { Customer, DeliveryOrder, Payment, CustomerLedger, GatePassItem, ReturnLot, GrayLot, sequelize } = require("../models");
const { getNextSequence } = require("../utils/numberGenerator");
const { logActivity } = require("../utils/logger");

exports.getCustomers = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
    const search = String(req.query.search || "").trim();

    const where = search
      ? {
          [Op.or]: [
            { customer_code: { [Op.like]: `${search}%` } },
            { name: { [Op.like]: `${search}%` } },
            { phone: { [Op.like]: `${search}%` } },
          ],
        }
      : undefined;

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      attributes: ["id", "customer_code", "name", "phone", "city", "outstanding_amount", "advance_balance"],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return res.json({ page, pageSize, total: count, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const payload = {
      customer_code: req.body.customerCode ? String(req.body.customerCode).trim() : await getNextSequence(Customer, 'customer_code', 'CUST-'),
      name: String(req.body.name || "").trim(),
      phone: String(req.body.mobile || "").trim(),
      city: String(req.body.address || "").trim() || null,
      credit_limit: Number(req.body.creditLimit || 0),
      outstanding_amount: Number(req.body.outstanding || 0),
    };

    if (!payload.customer_code || !payload.name || !payload.phone) {
      return res.status(400).json({ message: "customerCode, name, mobile are required" });
    }

    const created = await Customer.create(payload);
    await logActivity("Customers", `Created Customer: ${payload.name}`, `Code: ${payload.customer_code}`, req);
    return res.status(201).json(created);
  } catch (error) {
    res.status(500).json({error})
    console.log(error)
    return next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [
        {
          model: DeliveryOrder,
          include: [Payment]
        },
        {
          model: Payment,
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const deliveryOrders = customer.delivery_orders || customer.DeliveryOrders || [];
    const directPayments = customer.payments || customer.Payments || [];

    const totalBilled = deliveryOrders
      .filter(doItem => doItem.status === 'billed')
      .reduce((sum, doItem) => sum + Number(doItem.total_amount || 0), 0);
    
    let totalPaid = 0;
    const ledger = [];

    deliveryOrders.forEach(doItem => {
      // Add bills to ledger
      if (doItem.status === 'billed') {
        ledger.push({
          id: `bill-${doItem.id}`,
          date: doItem.order_date,
          type: 'Invoice',
          reference: doItem.order_no,
          debit: Number(doItem.total_amount),
          credit: 0
        });
      }

      // Add payments to ledger
      (doItem.payments || doItem.Payments || []).forEach(p => {
        const amt = Number(p.amount);
        totalPaid += amt;
        ledger.push({
          id: `pay-${p.id}`,
          date: p.payment_date,
          type: 'Payment',
          reference: p.reference_no || `Ref DO:${doItem.order_no}`,
          debit: 0,
          credit: amt
        });
      });
    });

    // Add direct payments (advances) to ledger
    directPayments.forEach(p => {
      // Avoid double counting if a payment is linked to both a DO and the Customer
      if (p.delivery_order_id) return;
      
      const amt = Number(p.amount);
      totalPaid += amt;
      ledger.push({
        id: `pay-adv-${p.id}`,
        date: p.payment_date,
        type: 'Payment',
        reference: p.reference_no || `Payment`,
        debit: 0,
        credit: amt
      });
    });

    // Sort ledger by date
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let currentBalance = 0;
    const ledgerWithBalance = ledger.map(entry => {
      currentBalance += (entry.debit - entry.credit);
      return { ...entry, balance: currentBalance };
    });

    return res.json({
      ...customer.toJSON(),
      totalBilled,
      totalPaid,
      ledger: ledgerWithBalance.reverse() // Newest first for UI table
    });
  } catch (error) {
    return next(error);
  }
};

exports.addBulkPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const customerId = req.params.id;
    const { amount, paymentDate, method, reference, notes } = req.body;
    
    if (!amount || Number(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid amount" });
    }

    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: "Customer not found" });
    }

    const paymentAmount = Number(amount);

    const p = await Payment.create({
      customer_id: customerId,
      payment_date: paymentDate || new Date().toISOString().slice(0, 10),
      amount: paymentAmount,
      mode: method || "cash",
      reference_no: reference,
      notes: notes,
      is_advance: true,
      attachment: req.body.attachment || null,
      attachment_name: req.body.attachmentName || null,
    }, { transaction: t });
    
    await customer.increment("advance_balance", { by: paymentAmount, transaction: t });
    
    const CustomerLedger = sequelize.models.customer_ledgers;
    await CustomerLedger.create({
      customer_id: customerId,
      transaction_type: "Credit",
      amount: paymentAmount,
      reference_type: "Payment Received",
      reference_id: p.id,
      description: `Payment Received (${method || 'cash'})`,
      date: p.payment_date,
    }, { transaction: t });

    // Update Customer Ledger outstanding (Decrement by full amount received)
    await customer.decrement("outstanding_amount", {
      by: paymentAmount,
      transaction: t,
    });

    await t.commit();
    return res.json({ 
      success: true, 
      message: "Payment processed successfully", 
      data: p
    });
  } catch (error) {
    console.log(error)
    await t.rollback();
    return next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const payload = {
      name: String(req.body.name || "").trim(),
      phone: String(req.body.mobile || "").trim(),
      city: String(req.body.address || "").trim() || null,
      credit_limit: Number(req.body.creditLimit || 0),
    };

    if (!payload.name || !payload.phone) {
      return res.status(400).json({ message: "name and mobile are required" });
    }

    await customer.update(payload);
    await logActivity("Customers", `Updated Customer: ${payload.name}`, `ID: ${id}`, req);
    return res.json(customer);
  } catch (error) {
    return next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id, { transaction: t });
    
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: "Customer not found" });
    }

    // 1. Find all Delivery Orders for this customer
    const orders = await DeliveryOrder.findAll({
      where: { customer_id: id },
      attributes: ["id"],
      transaction: t
    });
    const doIds = orders.map(o => o.id);

    if (doIds.length > 0) {
      // Delete Payments associated with these DOs
      await Payment.destroy({
        where: { delivery_order_id: { [Op.in]: doIds } },
        transaction: t
      });

      // Delete Gate Pass Items associated with these DOs
      await GatePassItem.destroy({
        where: { delivery_order_id: { [Op.in]: doIds } },
        transaction: t
      });

      // Delete Delivery Orders
      await DeliveryOrder.destroy({
        where: { id: { [Op.in]: doIds } },
        transaction: t
      });
    }

    // 2. Find all Gray Lots for this customer by party_name
    const lots = await GrayLot.findAll({
      where: { party_name: customer.name },
      attributes: ["id"],
      transaction: t
    });
    const lotIds = lots.map(l => l.id);

    if (lotIds.length > 0) {
      // Delete Return Lots associated with these Gray Lots
      await ReturnLot.destroy({
        where: { gray_lot_id: { [Op.in]: lotIds } },
        transaction: t
      });

      // Delete Gray Lots
      await GrayLot.destroy({
        where: { id: { [Op.in]: lotIds } },
        transaction: t
      });
    }

    // 3. Delete Customer Ledger entries
    await CustomerLedger.destroy({
      where: { customer_id: id },
      transaction: t
    });

    // 4. Delete the Customer
    await customer.destroy({ transaction: t });

    await t.commit();
    await logActivity("Customers", `Deleted Customer: ${customer.name}`, `ID: ${id}`, req);

    return res.json({ success: true, message: "Customer and all associated records deleted successfully." });
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};
