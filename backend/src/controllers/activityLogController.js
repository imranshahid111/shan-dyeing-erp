const { ActivityLog } = require("../models");

exports.getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 50), 1), 200);

    const { count, rows } = await ActivityLog.findAndCountAll({
      order: [["created_at", "DESC"]],
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
