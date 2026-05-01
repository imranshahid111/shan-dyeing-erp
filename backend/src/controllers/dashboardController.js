const { Customer, DeliveryOrder, Payment } = require("../models");

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [totalCustomers, pendingOrders, totalReceivables, todayPayments] = await Promise.all([
      Customer.count(),
      DeliveryOrder.count({ where: { status: "completed" } }),
      Customer.sum("outstanding_amount"),
      Payment.sum("amount", { where: { payment_date: new Date().toISOString().slice(0, 10) } }),
    ]);

    return res.json({
      totalCustomers,
      pendingOrders,
      totalReceivables: Number(totalReceivables || 0),
      todayPayments: Number(todayPayments || 0),
    });
  } catch (error) {
    return next(error);
  }
};
