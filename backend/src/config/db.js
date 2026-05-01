const { Sequelize } = require("sequelize");
const env = require("./env");

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: "mysql",
  logging: env.logSql ? console.log : false,
  pool: {
    max: env.dbPoolMax,
    min: env.dbPoolMin,
    acquire: env.dbPoolAcquire,
    idle: env.dbPoolIdle,
  },
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

module.exports = sequelize;
