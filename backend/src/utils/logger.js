const fs = require("fs");
const path = require("path");
const util = require("util");

// Ensure logs directory exists or just write to backend root
const logDir = path.join(__dirname, "../../");
const logFile = path.join(logDir, "server.log");

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

function formatMessage(level, args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${util.format(...args)}\n`;
}

console.log = function (...args) {
  logStream.write(formatMessage('INFO', args));
  originalLog.apply(console, args);
};

console.info = function (...args) {
  logStream.write(formatMessage('INFO', args));
  originalInfo.apply(console, args);
};

console.warn = function (...args) {
  logStream.write(formatMessage('WARN', args));
  originalWarn.apply(console, args);
};

console.error = function (...args) {
  logStream.write(formatMessage('ERROR', args));
  originalError.apply(console, args);
};

module.exports = {
  logStream,
  logActivity: async function(moduleName, action, details, req) {
    try {
      const { ActivityLog } = require("../models");
      let user_name = "System";
      let ip_address = null;

      if (req) {
        if (req.user) {
          user_name = req.user.full_name || req.user.email || req.user.name || "System";
        }
        ip_address = req.ip || req.connection?.remoteAddress || null;
      }

      await ActivityLog.create({
        module: moduleName,
        action: action,
        details: details,
        user_name: user_name,
        ip_address: ip_address
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }
};
