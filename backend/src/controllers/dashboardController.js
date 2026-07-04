const { Customer, DeliveryOrder, Payment, GrayLot, ActivityLog, Quality, sequelize, ReturnLot } = require("../models");
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

function mapPaymentType(mode) {
  const m = String(mode || "").toLowerCase();
  if (m.includes("cash")) return "RBOK";
  if (m.includes("journal")) return "JOURNAL";
  return "PAYMENT";
}

function mapReferenceType(type) {
  const map = {
    OPENING: "Opening Balance",
    BILL: "Sales Invoice",
    RBOK: "Cash Receipt",
    PAYMENT: "Payment Voucher",
    JOURNAL: "Journal Entry",
  };
  return map[type] || type;
}

function countBundleQuantity(order) {
  const lot = order.gray_lot || order.GrayLot;
  if (lot?.than) return Number(lot.than) || 0;

  let gridData = order.grid_data;
  if (typeof gridData === "string") {
    try { gridData = JSON.parse(gridData); } catch { gridData = null; }
  }
  if (!gridData?.rows?.length) return 0;

  const colors = gridData.colors || [];
  let count = 0;
  gridData.rows.forEach((row) => {
    const hasData = colors.some((c) => {
      const ready = row.values?.[c.id]?.ready;
      return ready !== null && ready !== undefined && Number(ready) > 0;
    });
    if (hasData) count++;
  });
  return count;
}

exports.getSubLedgerReport = async (req, res, next) => {
  try {
    const { customerId, fromDate, toDate } = req.query;
    if (!customerId) return res.status(400).json({ message: "Customer ID is required" });
    if (!fromDate || !toDate) return res.status(400).json({ message: "From Date and To Date are required" });

    const customer = await Customer.findByPk(customerId, {
      attributes: ["id", "name", "customer_code", "phone", "city"],
    });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const orderInclude = [
      {
        model: GrayLot,
        attributes: ["lot_no", "than", "measurement"],
        include: [{ model: Quality, attributes: ["name"] }],
      },
    ];

    const [priorOrders, periodOrders, priorPayments, periodPayments] = await Promise.all([
      DeliveryOrder.findAll({
        where: {
          customer_id: customerId,
          status: "billed",
          order_date: { [Op.lt]: fromDate },
        },
        include: orderInclude,
        order: [["order_date", "ASC"]],
      }),
      DeliveryOrder.findAll({
        where: {
          customer_id: customerId,
          status: "billed",
          order_date: { [Op.between]: [fromDate, toDate] },
        },
        include: orderInclude,
        order: [["order_date", "ASC"], ["id", "ASC"]],
      }),
      Payment.findAll({
        include: [{
          model: DeliveryOrder,
          where: { customer_id: customerId },
          attributes: ["id", "order_no"],
        }],
        where: { payment_date: { [Op.lt]: fromDate } },
        order: [["payment_date", "ASC"]],
      }),
      Payment.findAll({
        include: [{
          model: DeliveryOrder,
          where: { customer_id: customerId },
          attributes: ["id", "order_no", "invoice_no"],
        }],
        where: { payment_date: { [Op.between]: [fromDate, toDate] } },
        order: [["payment_date", "ASC"], ["id", "ASC"]],
      }),
    ]);

    let openingBalance = 0;
    priorOrders.forEach((o) => { openingBalance += Number(o.total_amount || 0); });
    priorPayments.forEach((p) => { openingBalance -= Number(p.amount || 0); });

    const periodEntries = [];

    periodOrders.forEach((o) => {
      const lot = o.gray_lot || o.GrayLot || {};
      const quality = lot.quality?.name || lot.Quality?.name || "Fabric";
      periodEntries.push({
        date: o.order_date,
        type: "BILL",
        referenceNo: o.invoice_no || o.order_no,
        description: quality,
        debit: Number(o.total_amount || 0),
        credit: 0,
        rate: Number(o.rate || 0),
        lotNo: lot.lot_no || "—",
        bundleQty: countBundleQuantity(o),
        meterQty: Number(o.total_ready_gazana || 0),
        sortOrder: 1,
      });
    });

    periodPayments.forEach((p) => {
      const payType = mapPaymentType(p.mode);
      const doItem = p.delivery_order || p.DeliveryOrder || {};
      periodEntries.push({
        date: p.payment_date,
        type: payType,
        referenceNo: p.reference_no || doItem.invoice_no || doItem.order_no || "—",
        description: payType === "RBOK" ? "Cash Receipt" : payType === "JOURNAL" ? "Journal Entry" : "Payment Voucher",
        debit: 0,
        credit: Number(p.amount || 0),
        rate: 0,
        lotNo: "—",
        bundleQty: 0,
        meterQty: 0,
        sortOrder: payType === "RBOK" ? 2 : 3,
      });
    });

    periodEntries.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.sortOrder - b.sortOrder;
    });

    let runningBalance = openingBalance;
    const transactions = [];

    transactions.push({
      date: fromDate,
      type: "OPENING",
      referenceType: mapReferenceType("OPENING"),
      referenceNo: "—",
      description: "Opening Balance B/F",
      debit: openingBalance > 0 ? parseFloat(openingBalance.toFixed(2)) : 0,
      credit: openingBalance < 0 ? parseFloat(Math.abs(openingBalance).toFixed(2)) : 0,
      balance: parseFloat(openingBalance.toFixed(2)),
      rate: 0,
      lotNo: "—",
      bundleQty: 0,
      meterQty: 0,
    });

    periodEntries.forEach((entry) => {
      runningBalance += entry.debit - entry.credit;
      transactions.push({
        date: entry.date,
        type: entry.type,
        referenceType: mapReferenceType(entry.type),
        referenceNo: entry.referenceNo,
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        balance: parseFloat(runningBalance.toFixed(2)),
        rate: entry.rate,
        lotNo: entry.lotNo,
        bundleQty: entry.bundleQty,
        meterQty: entry.meterQty,
      });
    });

    const totalDebit = transactions.reduce((sum, t) => sum + Number(t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + Number(t.credit || 0), 0);
    const closingBalance = transactions.length
      ? transactions[transactions.length - 1].balance
      : openingBalance;

    return res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        code: customer.customer_code,
        phone: customer.phone,
        address: customer.city,
      },
      fromDate,
      toDate,
      openingBalance: parseFloat(openingBalance.toFixed(2)),
      transactions,
      summary: {
        totalDebit: parseFloat(totalDebit.toFixed(2)),
        totalCredit: parseFloat(totalCredit.toFixed(2)),
        closingBalance: parseFloat(closingBalance.toFixed(2)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const GAZ_TO_METER = 0.9144;

function toMeters(value, measurement) {
  const v = Number(value || 0);
  if (String(measurement || "").toLowerCase() === "yard") {
    return parseFloat((v * GAZ_TO_METER).toFixed(2));
  }
  return parseFloat(v.toFixed(2));
}

function dbValueToMeters(value) {
  return parseFloat((Number(value || 0) * GAZ_TO_METER).toFixed(2));
}

function getProductionYear(dateStr) {
  const year = new Date(dateStr).getFullYear();
  return year % 100;
}

exports.getCompletedLotsReport = async (req, res, next) => {
  try {
    const {
      fromDate,
      toDate,
      partyName,
      customerId,
      qualityId,
      lotNo,
      search,
      sortBy = "date",
      sortOrder = "asc",
    } = req.query;

    const lotWhere = {};

    if (partyName) {
      lotWhere.party_name = { [Op.like]: `%${partyName}%` };
    }

    if (customerId) {
      const customer = await Customer.findByPk(customerId, { attributes: ["name"] });
      if (customer) {
        lotWhere.party_name = { [Op.like]: `%${customer.name}%` };
      }
    }

    if (qualityId) {
      lotWhere.quality_id = qualityId;
    }

    if (lotNo) {
      lotWhere.lot_no = { [Op.like]: `%${lotNo}%` };
    }

    if (search) {
      const qualityMatches = await Quality.findAll({
        where: { name: { [Op.like]: `%${search}%` } },
        attributes: ["id"],
      });
      const qualityIds = qualityMatches.map((q) => q.id);
      const orConditions = [
        { lot_no: { [Op.like]: `%${search}%` } },
        { bill_no: { [Op.like]: `%${search}%` } },
        { party_name: { [Op.like]: `%${search}%` } },
      ];
      if (qualityIds.length) {
        orConditions.push({ quality_id: { [Op.in]: qualityIds } });
      }
      lotWhere[Op.or] = orConditions;
    }

    const lots = await GrayLot.findAll({
      where: lotWhere,
      include: [
        { model: Quality, attributes: ["id", "name"] },
        {
          model: DeliveryOrder,
          attributes: ["order_date", "total_gray_gazana", "total_ready_gazana", "order_no"],
        },
        {
          model: ReturnLot,
          attributes: ["returned_quantity", "return_date", "reason"],
        },
      ],
      order: [["entry_date", "ASC"]],
    });

    let completedLots = lots
      .map((lot) => {
        const orders = lot.delivery_orders || [];
        const returns = lot.return_lots || [];
        const measurement = lot.measurement || "Meter";

        const grayDispatched = orders.reduce((s, o) => s + Number(o.total_gray_gazana || 0), 0);
        const readyProduced = orders.reduce((s, o) => s + Number(o.total_ready_gazana || 0), 0);
        const kWapsiRaw = returns.reduce((s, r) => s + Number(r.returned_quantity || 0), 0);
        const gazana = Number(lot.gazana || 0);
        const isMeter = String(lot.measurement || "").toLowerCase() === "meter";
        const remainingRaw = isMeter
          ? Math.max(gazana - (grayDispatched + kWapsiRaw) * 0.9144, 0)
          : Math.max(gazana - grayDispatched - kWapsiRaw, 0);

        const isComplete = gazana > 0 && remainingRaw <= 0.01;
        if (!isComplete) return null;

        const orderDates = orders.map((o) => o.order_date).filter(Boolean);
        const returnDates = returns.map((r) => r.return_date).filter(Boolean);
        const allDates = [...orderDates, ...returnDates, lot.entry_date];
        const completionDate = allDates.reduce((max, d) =>
          new Date(d) > new Date(max) ? d : max, allDates[0]);

        const metersIn = toMeters(gazana, measurement);
        const metersOut = dbValueToMeters(grayDispatched);
        const totalMeters = dbValueToMeters(readyProduced);
        const doQty = dbValueToMeters(readyProduced);
        const kWapsi = dbValueToMeters(kWapsiRaw);
        const balance = toMeters(remainingRaw, measurement);
        const percentage = metersIn > 0
          ? parseFloat((((totalMeters - metersIn) / metersIn) * 100).toFixed(2))
          : 0;

        const remarks = lot.notes
          || returns.map((r) => r.reason).filter(Boolean).join("; ")
          || "";

        return {
          year: getProductionYear(completionDate),
          lotNo: lot.lot_no,
          biltyNo: lot.bill_no || "—",
          date: completionDate,
          quality: lot.quality?.name || "Unknown",
          than: Number(lot.than || 0),
          metersIn,
          metersOut,
          totalMeters,
          doQty,
          kWapsi,
          balance,
          percentage,
          remarks,
          partyName: lot.party_name,
        };
      })
      .filter(Boolean);

    if (fromDate && toDate) {
      completedLots = completedLots.filter((lot) => {
        const d = new Date(lot.date);
        return d >= new Date(fromDate) && d <= new Date(toDate);
      });
    }

    const sortFieldMap = {
      date: "date",
      lotNo: "lotNo",
      totalMeters: "totalMeters",
      quality: "quality",
    };
    const field = sortFieldMap[sortBy] || "date";
    const dir = sortOrder === "desc" ? -1 : 1;

    completedLots.sort((a, b) => {
      if (field === "date") {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
      if (field === "totalMeters") {
        return (a.totalMeters - b.totalMeters) * dir;
      }
      return String(a[field]).localeCompare(String(b[field])) * dir;
    });

    const summary = completedLots.reduce(
      (acc, lot) => {
        acc.totalLots += 1;
        acc.totalBundles += lot.than;
        acc.totalMetersIn += lot.metersIn;
        acc.totalMetersOut += lot.metersOut;
        acc.totalMeters += lot.totalMeters;
        return acc;
      },
      {
        totalLots: 0,
        totalBundles: 0,
        totalMetersIn: 0,
        totalMetersOut: 0,
        totalMeters: 0,
        productionDifference: 0,
      }
    );

    summary.totalMetersIn = parseFloat(summary.totalMetersIn.toFixed(2));
    summary.totalMetersOut = parseFloat(summary.totalMetersOut.toFixed(2));
    summary.totalMeters = parseFloat(summary.totalMeters.toFixed(2));
    summary.productionDifference = parseFloat((summary.totalMeters - summary.totalMetersIn).toFixed(2));

    const party = partyName
      ? { id: null, name: partyName }
      : customerId
        ? await Customer.findByPk(customerId, { attributes: ["id", "name"] })
        : { id: null, name: "All Parties" };

    return res.json({
      party: party
        ? { id: party.id, name: party.name }
        : { id: null, name: "All Parties" },
      fromDate: fromDate || null,
      toDate: toDate || null,
      lots: completedLots,
      summary,
    });
  } catch (error) {
    console.log(error)
    return next(error);
  }
};

function getFabricType(lot) {
  const returns = lot.return_lots || [];
  if (returns.some((r) => Number(r.returned_quantity || 0) > 0)) return "Return";
  const processType = String(lot.process_type || "").toLowerCase();
  if (processType.includes("reprocess") || processType.includes("re-process")) return "Reprocess";
  return "Fresh";
}

function getLotRemaining(lot) {
  const orders = lot.delivery_orders || [];
  const returns = lot.return_lots || [];
  const dispatched = orders.reduce((s, o) => s + Number(o.total_gray_gazana || 0), 0);
  const returned = returns.reduce((s, r) => s + Number(r.returned_quantity || 0), 0);
  const isMeter = String(lot.measurement || "").toLowerCase() === "meter";
  if (isMeter) {
    return Math.max(Number(lot.gazana || 0) - (dispatched + returned) * 0.9144, 0);
  }
  return Math.max(Number(lot.gazana || 0) - dispatched - returned, 0);
}

function getDeliveryRowStatus(doItem, lot) {
  const remaining = getLotRemaining(lot);
  if (Number(lot.gazana || 0) > 0 && remaining <= 0.01) return "Lot Complete";
  const delivered = Number(doItem.total_ready_gazana || 0);
  if (delivered > 0) return "Delivered";
  return "Pending";
}

exports.getPartyWiseLotDeliveryReport = async (req, res, next) => {
  try {
    const {
      fromDate,
      toDate,
      partyName,
      customerId,
      qualityId,
      lotNo,
      challanNo,
      search,
      status = "all",
      groupBy = "party",
      sortOrder = "asc",
    } = req.query;

    const doWhere = {};
    if (fromDate && toDate) {
      doWhere.order_date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      doWhere.order_date = { [Op.gte]: fromDate };
    } else if (toDate) {
      doWhere.order_date = { [Op.lte]: toDate };
    }

    if (customerId) {
      doWhere.customer_id = customerId;
    }

    if (challanNo) {
      doWhere.order_no = { [Op.like]: `%${challanNo}%` };
    }

    const grayLotWhere = {};
    if (qualityId) {
      grayLotWhere.quality_id = qualityId;
    }
    if (lotNo) {
      grayLotWhere.lot_no = { [Op.like]: `%${lotNo}%` };
    }
    if (partyName) {
      grayLotWhere.party_name = { [Op.like]: `%${partyName}%` };
    }

    const orders = await DeliveryOrder.findAll({
      where: doWhere,
      include: [
        { model: Customer, attributes: ["id", "name", "customer_code"] },
        {
          model: GrayLot,
          where: Object.keys(grayLotWhere).length ? grayLotWhere : undefined,
          required: true,
          include: [
            { model: Quality, attributes: ["id", "name"] },
            { model: ReturnLot, attributes: ["returned_quantity"] },
            {
              model: DeliveryOrder,
              attributes: ["id", "total_gray_gazana", "total_ready_gazana", "status", "order_no"],
            },
          ],
        },
      ],
      order: [["order_date", "ASC"], ["id", "ASC"]],
    });

    let rows = orders.map((order) => {
      const lot = order.gray_lot || order.GrayLot;
      if (!lot) return null;

      const customer = order.customer || order.Customer || {};
      const measurement = lot.measurement || "Meter";
      const partyLabel = lot.party_name || customer.name || "Unknown";
      const metersSent = dbValueToMeters(order.total_gray_gazana);
      const metersDelivered = dbValueToMeters(order.total_ready_gazana);

      return {
        lotNo: lot.lot_no,
        partyLotNo: lot.bill_no || lot.lot_no,
        deliveryDate: order.order_date,
        fabricType: getFabricType(lot),
        partyName: partyLabel,
        quality: lot.quality?.name || lot.Quality?.name || "Unknown",
        metersSent,
        metersDelivered,
        difference: parseFloat((metersSent - metersDelivered).toFixed(2)),
        doNo: order.order_no,
        doDate: order.order_date,
        challanNo: order.order_no,
        challanDate: order.order_date,
        status: getDeliveryRowStatus(order, lot),
      };
    }).filter(Boolean);

    if (search) {
      const term = String(search).toLowerCase();
      rows = rows.filter((row) =>
        String(row.lotNo).toLowerCase().includes(term)
        || String(row.partyLotNo).toLowerCase().includes(term)
        || String(row.challanNo).toLowerCase().includes(term)
        || String(row.doNo).toLowerCase().includes(term)
        || String(row.quality).toLowerCase().includes(term)
        || String(row.partyName).toLowerCase().includes(term)
      );
    }

    if (status && status !== "all") {
      const statusMap = {
        delivered: "Delivered",
        pending: "Pending",
        lotcomplete: "Lot Complete",
        "lot complete": "Lot Complete",
      };
      const targetStatus = statusMap[String(status).toLowerCase()] || status;
      rows = rows.filter((row) => row.status === targetStatus);
    }

    const groupFieldMap = {
      party: "partyName",
      quality: "quality",
      fabricType: "fabricType",
      deliveryDate: "deliveryDate",
    };
    const groupField = groupFieldMap[groupBy] || "partyName";
    const dir = sortOrder === "desc" ? -1 : 1;

    rows.sort((a, b) => {
      let cmp = 0;
      if (groupField === "deliveryDate") {
        cmp = new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
      } else {
        cmp = String(a[groupField]).localeCompare(String(b[groupField]));
      }
      if (cmp !== 0) return cmp * dir;
      cmp = String(a.partyName).localeCompare(String(b.partyName));
      if (cmp !== 0) return cmp;
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
    });

    rows = rows.map((row, index) => ({ srNo: index + 1, ...row }));

    const totalMetersSent = rows.reduce((s, r) => s + r.metersSent, 0);
    const totalMetersDelivered = rows.reduce((s, r) => s + r.metersDelivered, 0);
    const totalDifference = parseFloat((totalMetersSent - totalMetersDelivered).toFixed(2));
    const deliveryEfficiency = totalMetersSent > 0
      ? parseFloat(((totalMetersDelivered / totalMetersSent) * 100).toFixed(2))
      : 0;

    const summary = {
      totalLots: rows.length,
      uniqueLots: new Set(rows.map((r) => r.lotNo)).size,
      totalMetersSent: parseFloat(totalMetersSent.toFixed(2)),
      totalMetersDelivered: parseFloat(totalMetersDelivered.toFixed(2)),
      totalDifference,
      deliveryEfficiency,
    };

    let party = { id: null, name: "All Parties" };
    if (customerId) {
      const customer = await Customer.findByPk(customerId, { attributes: ["id", "name"] });
      if (customer) party = { id: customer.id, name: customer.name };
    } else if (partyName) {
      party = { id: null, name: partyName };
    } else if (rows.length > 0) {
      party = { id: null, name: rows[0].partyName };
    }

    return res.json({
      party,
      fromDate: fromDate || null,
      toDate: toDate || null,
      groupBy: groupBy || "party",
      lots: rows,
      summary,
    });
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

exports.getPaymentsReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const where = {};
    if (fromDate && toDate) {
      where.payment_date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.payment_date = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.payment_date = { [Op.lte]: toDate };
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: DeliveryOrder,
          attributes: ["order_no", "invoice_no"],
          include: [{ model: Customer, attributes: ["name"] }]
        }
      ],
      order: [["payment_date", "ASC"]],
    });

    const data = payments.map(p => {
      const doItem = p.delivery_order || p.DeliveryOrder || {};
      const customer = doItem.customer || doItem.Customer || {};
      return {
        date: p.payment_date,
        customer: customer.name || "Unknown",
        invoiceNo: doItem.invoice_no || doItem.order_no || "-",
        method: p.mode,
        reference: p.reference_no || "-",
        amount: Number(p.amount)
      };
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

exports.getInvoicesReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const where = { status: "billed" };
    if (fromDate && toDate) {
      where.order_date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.order_date = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.order_date = { [Op.lte]: toDate };
    }

    const orders = await DeliveryOrder.findAll({
      where,
      include: [
        { model: Customer, attributes: ["name"] },
        { model: GrayLot, attributes: ["lot_no", "measurement"] }
      ],
      order: [["order_date", "ASC"]],
    });

    const data = orders.map(o => {
      const customer = o.customer || o.Customer || {};
      const lot = o.gray_lot || o.GrayLot || {};
      return {
        date: o.order_date,
        invoiceNo: o.invoice_no || o.order_no,
        customer: customer.name || "Unknown",
        lotNo: lot.lot_no || "-",
        readyStock: Number(o.total_ready_gazana),
        unit: lot.measurement || "Meter",
        rate: Number(o.rate),
        rateUnit: o.rate_unit || 'meter',
        amount: Number(o.total_amount)
      };
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

exports.getDateWiseSalesReport = async (req, res, next) => {
  try {
    const { fromDate, toDate, customerId, qualityId } = req.query;

    const where = { status: { [Op.in]: ["billed", "paid"] } };
    if (fromDate && toDate) {
      where.order_date = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.order_date = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.order_date = { [Op.lte]: toDate };
    }
    if (customerId) {
      where.customer_id = Number(customerId);
    }

    const parsedQualityId = qualityId ? Number(qualityId) : null;
    const grayLotInclude = {
      model: GrayLot,
      attributes: ["lot_no", "quality_id"],
      include: [{ model: Quality, attributes: ["id", "name"] }],
    };
    if (parsedQualityId) {
      grayLotInclude.where = { quality_id: parsedQualityId };
      grayLotInclude.required = true;
    }

    const orders = await DeliveryOrder.findAll({
      where,
      include: [
        { model: Customer, attributes: ["id", "name"] },
        grayLotInclude,
      ],
      order: [["order_date", "ASC"], ["id", "ASC"]],
    });

    const data = orders.map((o) => {
      const customer = o.customer || o.Customer || {};
      const lot = o.gray_lot || o.GrayLot || {};
      const quality = lot.quality || lot.Quality || {};
      return {
        date: o.order_date,
        billNo: o.invoice_no || o.order_no,
        challanNo: o.order_no,
        partyName: customer.name || "Unknown",
        qualityName: quality.name || "Unknown",
        quantity: Number(o.total_ready_gazana || 0),
        rate: Number(o.rate || 0),
        amount: Number(o.total_amount || 0),
      };
    });

    const totals = data.reduce(
      (acc, row) => {
        acc.quantity += row.quantity;
        acc.amount += row.amount;
        return acc;
      },
      { quantity: 0, amount: 0 }
    );

    totals.quantity = parseFloat(totals.quantity.toFixed(2));
    totals.amount = parseFloat(totals.amount.toFixed(2));

    const qualityMap = {};
    data.forEach((row) => {
      const key = row.qualityName || "Unknown";
      if (!qualityMap[key]) {
        qualityMap[key] = {
          qualityName: key,
          quantity: 0,
          amount: 0,
          billCount: 0,
        };
      }
      qualityMap[key].quantity += row.quantity;
      qualityMap[key].amount += row.amount;
      qualityMap[key].billCount += 1;
    });

    const qualitySummary = Object.values(qualityMap)
      .map((q) => ({
        ...q,
        quantity: parseFloat(q.quantity.toFixed(2)),
        amount: parseFloat(q.amount.toFixed(2)),
      }))
      .sort((a, b) => a.qualityName.localeCompare(b.qualityName));

    let selectedQuality = null;
    if (parsedQualityId) {
      const q = await Quality.findByPk(parsedQualityId, { attributes: ["id", "name"] });
      if (q) selectedQuality = { id: q.id, name: q.name };
    }

    return res.json({
      fromDate: fromDate || null,
      toDate: toDate || null,
      selectedQuality,
      data,
      totals,
      qualitySummary,
    });
  } catch (error) {
    return next(error);
  }
};

