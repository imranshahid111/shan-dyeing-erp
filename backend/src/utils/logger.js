const { ActivityLog } = require("../models");

/**
 * Log an activity to the database
 * @param {string} module - The module name (e.g., 'Invoices', 'Gray Lots')
 * @param {string} action - The action performed (e.g., 'Created Invoice #INV-001')
 * @param {string} details - Additional details or JSON string
 * @param {object} req - Express request object (optional, for IP tracking)
 */
const logActivity = async (module, action, details = "", req = null) => {
  try {
    await ActivityLog.create({
      module,
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      user_name: req?.user?.full_name || "System",
      ip_address: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null
    });
  } catch (error) {
    console.error("Failed to record activity log:", error.message);
  }
};

module.exports = { logActivity };
