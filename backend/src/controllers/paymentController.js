const { Payment, DeliveryOrder, Customer } = require("../models");
const { Op, sequelize } = require("sequelize");

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
