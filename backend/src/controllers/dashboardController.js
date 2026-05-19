const { Customer, DeliveryOrder, Payment, GrayLot, ActivityLog, Quality, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [totalCustomers, pendingOrders, totalReceivables, todayPayments] = await Promise.all([
      Customer.count(),
      DeliveryOrder.count({ where: { status: "pending" } }),
      Customer.sum("outstanding_amount"),
      Payment.sum("amount", { where: { payment_date: new Date().toISOString().slice(0, 10) } }),
    ]);

    return res.json({
      totalCustomers: totalCustomers || 0,
      pendingOrders: pendingOrders || 0,
      totalReceivables: Number(totalReceivables || 0),
      todayPayments: Number(todayPayments || 0),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getChartsData = async (req, res, next) => {
  try {
    // 1. Monthly Production (Last 4 Months)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 3);
    fourMonthsAgo.setDate(1);

    const grayLots = await GrayLot.findAll({
      attributes: [
        [sequelize.fn("DATE_FORMAT", sequelize.col("entry_date"), "%b"), "month"],
        [sequelize.fn("SUM", sequelize.col("gazana")), "gray"],
      ],
      where: { entry_date: { [Op.gte]: fourMonthsAgo } },
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("entry_date"), "%b")],
      order: [[sequelize.fn("MIN", sequelize.col("entry_date")), "ASC"]],
    });

    const readyFabric = await DeliveryOrder.findAll({
      attributes: [
        [sequelize.fn("DATE_FORMAT", sequelize.col("order_date"), "%b"), "month"],
        [sequelize.fn("SUM", sequelize.col("total_ready_gazana")), "ready"],
      ],
      where: { order_date: { [Op.gte]: fourMonthsAgo } },
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("order_date"), "%b")],
      order: [[sequelize.fn("MIN", sequelize.col("order_date")), "ASC"]],
    });

    // Merge data
    const monthMap = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize last 4 months
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (3 - i));
      const m = monthNames[d.getMonth()];
      monthMap[m] = { month: m, gray: 0, ready: 0 };
    }

    grayLots.forEach(item => {
      const m = item.getDataValue("month");
      if (monthMap[m]) monthMap[m].gray = Number(item.getDataValue("gray") || 0);
    });

    readyFabric.forEach(item => {
      const m = item.getDataValue("month");
      if (monthMap[m]) monthMap[m].ready = Number(item.getDataValue("ready") || 0);
    });

    const monthlyData = Object.values(monthMap);

    // 2. Customer Distribution (Top 5)
    const distribution = await DeliveryOrder.findAll({
      attributes: [
        [sequelize.col("Customer.name"), "name"],
        [sequelize.fn("SUM", sequelize.col("total_amount")), "value"],
      ],
      include: [{ model: Customer, attributes: [] }],
      group: ["Customer.id"],
      order: [[sequelize.fn("SUM", sequelize.col("total_amount")), "DESC"]],
      limit: 5,
    });

    const totalValue = distribution.reduce((sum, item) => sum + Number(item.getDataValue("value")), 0);
    const customerData = distribution.map(item => ({
      name: item.getDataValue("name"),
      value: totalValue > 0 ? Math.round((Number(item.getDataValue("value")) / totalValue) * 100) : 0,
    }));

    return res.json({ monthlyData, customerData });
  } catch (error) {
    return next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const logs = await ActivityLog.findAll({
      limit: 10,
      order: [["created_at", "DESC"]],
    });

    const activityData = logs.map(log => {
      let color = "#3b82f6";
      if (log.module === "Gray Lots") color = "#3b82f6";
      if (log.module === "Delivery Orders") color = "#10b981";
      if (log.module === "Payments") color = "#8b5cf6";
      if (log.module === "Customers") color = "#f59e0b";

      return {
        action: log.action,
        detail: log.details,
        time: formatTimeAgo(log.created_at),
        color,
      };
    });

    return res.json(activityData);
  } catch (error) {
    return next(error);
  }
};

exports.getLedgerReport = async (req, res, next) => {
  try {
    const { customerId, fromDate, toDate } = req.query;
    if (!customerId) return res.status(400).json({ message: "Customer ID is required" });

    const where = {};
    if (fromDate && toDate) {
      where.order_date = { [Op.between]: [fromDate, toDate] };
    }

    const [orders, payments] = await Promise.all([
      DeliveryOrder.findAll({
        where: { customer_id: customerId, ...where },
        order: [["order_date", "ASC"]],
      }),
      Payment.findAll({
        include: [{ 
          model: DeliveryOrder, 
          where: { customer_id: customerId },
          attributes: [] 
        }],
        where: fromDate && toDate ? { payment_date: { [Op.between]: [fromDate, toDate] } } : {},
        order: [["payment_date", "ASC"]],
      }),
    ]);

    let ledger = [];
    orders.forEach(o => {
      ledger.push({
        date: o.order_date,
        description: `Invoice ${o.invoice_no || o.order_no}`,
        debit: Number(o.total_amount),
        credit: 0,
        type: 'debit'
      });
    });

    payments.forEach(p => {
      ledger.push({
        date: p.payment_date,
        description: `Payment Received (${p.mode}) ${p.reference_no || ""}`,
        debit: 0,
        credit: Number(p.amount),
        type: 'credit'
      });
    });

    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    ledger = ledger.map(item => {
      runningBalance += (item.debit - item.credit);
      return { ...item, balance: runningBalance };
    });

    return res.json(ledger);
  } catch (error) {
    return next(error);
  }
};

exports.getOutstandingReport = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      attributes: [
        "id",
        "name",
        "outstanding_amount",
        [sequelize.fn("SUM", sequelize.col("delivery_orders.total_amount")), "totalBilled"],
        [sequelize.fn("SUM", sequelize.col("delivery_orders.paid_amount")), "totalPaid"],
      ],
      include: [{
        model: DeliveryOrder,
        attributes: [],
      }],
      group: ["customers.id", "customers.name", "customers.outstanding_amount"],
      having: {
        outstanding_amount: { [Op.gt]: 0 }
      }
    });

    const data = customers.map(c => ({
      customer: c.name,
      totalBilled: Number(c.getDataValue("totalBilled") || 0),
      totalPaid: Number(c.getDataValue("totalPaid") || 0),
      outstanding: Number(c.outstanding_amount || 0),
    }));

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

exports.getStockReport = async (req, res, next) => {
  try {
    const lots = await GrayLot.findAll({
      include: [
        {
          model: DeliveryOrder,
          attributes: ["total_gray_gazana", "total_ready_gazana"],
        },
        {
          model: Quality,
          attributes: ["name"],
        }
      ],
      order: [["entry_date", "DESC"]],
    });

    const GAZ_TO_METER = 0.9144;

    const stockData = lots.map(lot => {
      const totalGrayDispatched = lot.delivery_orders.reduce((sum, do_item) => sum + Number(do_item.total_gray_gazana), 0);
      const totalReadyProduced = lot.delivery_orders.reduce((sum, do_item) => sum + Number(do_item.total_ready_gazana), 0);

      const grayStockGaz = Math.max(0, Number(lot.gazana) - totalGrayDispatched);
      const readyStockGaz = totalReadyProduced;
      const pendingGaz = Math.max(0, Number(lot.gazana) - totalReadyProduced);

      return {
        lotNo: lot.lot_no,
        quality: lot.quality ? lot.quality.name : 'Unknown',
        measurement: lot.measurement,
        // Gaz values
        grayStock: grayStockGaz,
        readyStock: readyStockGaz,
        pending: pendingGaz,
        totalGazana: Number(lot.gazana),
        // Meter values (1 Gaz = 0.9144 Meter)
        grayStockMeters: parseFloat((grayStockGaz * GAZ_TO_METER).toFixed(2)),
        readyStockMeters: parseFloat((readyStockGaz * GAZ_TO_METER).toFixed(2)),
        pendingMeters: parseFloat((pendingGaz * GAZ_TO_METER).toFixed(2)),
        totalMeters: parseFloat((Number(lot.gazana) * GAZ_TO_METER).toFixed(2)),
      };
    });

    return res.json(stockData);
  } catch (error) {
    return next(error);
  }
};

exports.getQualityStockReport = async (req, res, next) => {
  try {
    const lots = await GrayLot.findAll({
      include: [
        {
          model: DeliveryOrder,
          attributes: ["total_gray_gazana", "total_ready_gazana"],
        },
        {
          model: Quality,
          attributes: ["name"],
        }
      ],
    });

    const GAZ_TO_METER = 0.9144;

    // Group by quality name
    const qualityMap = {};
    lots.forEach(lot => {
      const q = lot.quality ? lot.quality.name : 'Unknown';
      if (!qualityMap[q]) {
        qualityMap[q] = { quality: q, totalGaz: 0, readyGaz: 0, pendingGaz: 0, lotCount: 0 };
      }
      const totalReadyProduced = lot.delivery_orders.reduce((sum, d) => sum + Number(d.total_ready_gazana), 0);
      const pendingGaz = Math.max(0, Number(lot.gazana) - totalReadyProduced);

      qualityMap[q].totalGaz += Number(lot.gazana);
      qualityMap[q].readyGaz += totalReadyProduced;
      qualityMap[q].pendingGaz += pendingGaz;
      qualityMap[q].lotCount += 1;
    });

    const result = Object.values(qualityMap).map(q => ({
      ...q,
      totalMeters: parseFloat((q.totalGaz * GAZ_TO_METER).toFixed(2)),
      readyMeters: parseFloat((q.readyGaz * GAZ_TO_METER).toFixed(2)),
      pendingMeters: parseFloat((q.pendingGaz * GAZ_TO_METER).toFixed(2)),
    }));

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

