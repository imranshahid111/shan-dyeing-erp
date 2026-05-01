const { Op } = require("sequelize");
const { Customer, DeliveryOrder, Payment } = require("../models");

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
      attributes: ["id", "customer_code", "name", "phone", "city", "outstanding_amount"],
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
      customer_code: String(req.body.customerCode || "").trim(),
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
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const deliveryOrders = customer.delivery_orders || [];
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
      (doItem.payments || []).forEach(p => {
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
