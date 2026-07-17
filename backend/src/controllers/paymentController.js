const { Payment, DeliveryOrder, Customer, CustomerLedger, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getAllPayments = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 50), 1), 100);
    const search = String(req.query.search || "").trim();

    const where = {};
    if (search) {
      where[Op.or] = [
        { reference_no: { [Op.like]: `%${search}%` } },
        { '$DeliveryOrder.order_no$': { [Op.like]: `%${search}%` } },
        { '$DeliveryOrder.Customer.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: DeliveryOrder,
          attributes: ["id", "order_no"],
          include: [{ model: Customer, attributes: ["id", "name"] }]
        },
        {
          model: Customer,
          attributes: ["id", "name"]
        }
      ],
      order: [["payment_date", "DESC"], ["id", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return res.json({
      page,
      pageSize,
      total: count,
      data: rows
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPaymentStats = async (req, res, next) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [monthlyCollection, pendingInvoices, totalOutstanding] = await Promise.all([
      Payment.sum("amount", { 
        where: { 
          payment_date: { [Op.gte]: firstDayOfMonth } 
        } 
      }),
      DeliveryOrder.count({ where: { status: "billed" } }),
      Customer.sum("outstanding_amount")
    ]);

    return res.json({
      monthlyCollection: Number(monthlyCollection || 0),
      pendingInvoices,
      totalOutstanding: Number(totalOutstanding || 0)
    });
  } catch (error) {
    return next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { logActivity } = require("../utils/logger");

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: DeliveryOrder,
          include: [Customer]
        },
        {
          model: Customer
        }
      ],
      transaction: t
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({ message: "Payment record not found" });
    }

    const payAmount = Number(payment.amount || 0);
    const doItem = payment.delivery_order || payment.DeliveryOrder || payment.deliveryOrder;

    // Determine the customer ID
    let customerId = payment.customer_id;
    if (!customerId && doItem) {
      const customerItem = doItem.customer || doItem.Customer;
      customerId = doItem.customer_id || (customerItem && customerItem.id);
    }

    // 1. Decrement paid_amount on DeliveryOrder
    if (doItem) {
      await doItem.decrement("paid_amount", {
        by: payAmount,
        transaction: t
      });
    }

    // 2. Update Customer Balances and Ledger
    if (customerId) {
      // Revert outstanding amount (increment it back)
      await Customer.increment("outstanding_amount", {
        by: payAmount,
        where: { id: customerId },
        transaction: t
      });

      // Revert advance_balance for standalone payments
      if (payment.is_advance || !doItem) {
        await Customer.decrement("advance_balance", {
          by: payAmount,
          where: { id: customerId },
          transaction: t
        });
      }

      // Delete the associated Ledger Entry
      const CustomerLedger = sequelize.models.customer_ledgers;
      if (CustomerLedger) {
        await CustomerLedger.destroy({
          where: {
            reference_id: payment.id,
            reference_type: "Payment Received"
          },
          transaction: t
        });
      }
    }

    // 3. Destroy Payment record
    await payment.destroy({ transaction: t });

    await t.commit();

    const doNo = doItem ? doItem.order_no : "Direct Credit";
    await logActivity("Payments", `Deleted Payment for ${doNo}`, `Amount: ${payAmount}`, req);

    return res.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { amount, paymentDate, method, reference, notes } = req.body;
    const { logActivity } = require("../utils/logger");

    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: DeliveryOrder,
          include: [Customer]
        }
      ],
      transaction: t
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({ message: "Payment record not found" });
    }

    const oldAmount = Number(payment.amount || 0);
    const newAmount = Number(amount);
    const diff = newAmount - oldAmount;

    // 1. Update Payment log fields
    payment.payment_date = paymentDate || payment.payment_date;
    payment.amount = newAmount;
    payment.mode = method || payment.mode;
    payment.reference_no = reference !== undefined ? reference : payment.reference_no;
    payment.notes = notes !== undefined ? notes : payment.notes;
    if (req.body.attachment !== undefined) payment.attachment = req.body.attachment;
    if (req.body.attachmentName !== undefined) payment.attachment_name = req.body.attachmentName;
    await payment.save({ transaction: t });

    const doItem = payment.delivery_order || payment.DeliveryOrder || payment.deliveryOrder;
    let customerId = payment.customer_id;
    if (!customerId && doItem) {
      const customerItem = doItem.customer || doItem.Customer;
      customerId = doItem.customer_id || (customerItem && customerItem.id);
    }

    if (diff !== 0) {
      if (doItem) {
        // Legacy payment linked to a DO
        await doItem.increment("paid_amount", {
          by: diff,
          transaction: t
        });
      }

      if (customerId) {
        // All payments decrease outstanding amount (so when we update, we decrement by diff)
        await Customer.decrement("outstanding_amount", {
          by: diff,
          where: { id: customerId },
          transaction: t
        });

        // Standalone payments (or advance) also increase advance_balance
        if (payment.is_advance || !doItem) {
          await Customer.increment("advance_balance", {
            by: diff,
            where: { id: customerId },
            transaction: t
          });
        }
        
        // Update associated ledger entry
        const CustomerLedger = sequelize.models.customer_ledgers;
        if (CustomerLedger) {
          await CustomerLedger.update(
            {
              amount: newAmount,
              date: payment.payment_date,
              description: `Payment Received (${payment.mode || 'cash'})`
            },
            {
              where: {
                reference_id: payment.id,
                reference_type: "Payment Received"
              },
              transaction: t
            }
          );
        }
      }
    }

    await t.commit();

    const doNo = doItem ? doItem.order_no : "N/A";
    await logActivity("Payments", `Updated Payment for DO #${doNo}`, `Adjusted by: ${diff}, New Amount: ${newAmount}`, req);

    return res.json({ success: true, message: "Payment updated successfully", data: payment });
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};

exports.addAdvancePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { customerId, amount, paymentDate, method, bankName, reference, notes, attachment, attachmentName } = req.body;
    const { logActivity } = require("../utils/logger");

    if (!customerId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Valid Customer ID and Amount are required" });
    }

    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: "Customer not found" });
    }

    const payment = await Payment.create({
      payment_date: paymentDate || new Date().toISOString().slice(0, 10),
      amount: amount,
      mode: method || "cash",
      bank_name: method === 'bank transfer' ? bankName : null,
      reference_no: reference,
      notes: notes,
      attachment: attachment,
      attachment_name: attachmentName,
      is_advance: true,
    }, { transaction: t });

    const CustomerLedger = sequelize.models.customer_ledgers;
    await CustomerLedger.create({
      customer_id: customerId,
      transaction_type: "Credit",
      amount: amount,
      reference_type: "Payment",
      reference_id: payment.id,
      description: `Payment Received (${method})`,
      date: payment.payment_date,
    }, { transaction: t });

    await customer.increment("advance_balance", { by: amount, transaction: t });

    await t.commit();
    await logActivity("Payments", `Received Payment`, `Amount: ${amount} for Customer ID ${customerId}`, req);

    return res.status(201).json({ success: true, message: "Payment recorded successfully", data: payment });
  } catch (error) {
    await t.rollback();
    return next(error);
  }
};

