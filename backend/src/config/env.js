const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5001),
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: Number(process.env.DB_PORT || 3306),
  dbName: process.env.DB_NAME || "shan_dyeing_db",
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbPoolMax: Number(process.env.DB_POOL_MAX || 20),
  dbPoolMin: Number(process.env.DB_POOL_MIN || 2),
  dbPoolAcquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
  dbPoolIdle: Number(process.env.DB_POOL_IDLE || 10000),
  logSql: process.env.LOG_SQL === "true",
};

module.exports = env;
