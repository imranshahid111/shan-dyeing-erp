const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = require("./user")(sequelize, DataTypes);
const Customer = require("./customer")(sequelize, DataTypes);
const DeliveryOrder = require("./deliveryOrder")(sequelize, DataTypes);
const Payment = require("./payment")(sequelize, DataTypes);
const GrayLot = require("./grayLot")(sequelize, DataTypes);
const Organization = require("./organization")(sequelize, DataTypes);
const Quality = require("./quality")(sequelize, DataTypes);
const ActivityLog = require("./activityLog")(sequelize, DataTypes);
const GatePass = require("./gatePass")(sequelize, DataTypes);
const Privilege = require("./privilege")(sequelize, DataTypes);

Customer.hasMany(DeliveryOrder, { foreignKey: "customer_id" });
DeliveryOrder.belongsTo(Customer, { foreignKey: "customer_id" });

DeliveryOrder.hasMany(Payment, { foreignKey: "delivery_order_id" });
Payment.belongsTo(DeliveryOrder, { foreignKey: "delivery_order_id" });

GrayLot.hasMany(DeliveryOrder, { foreignKey: "gray_lot_id" });
DeliveryOrder.belongsTo(GrayLot, { foreignKey: "gray_lot_id" });

Quality.hasMany(GrayLot, { foreignKey: "quality_id" });
GrayLot.belongsTo(Quality, { foreignKey: "quality_id" });

DeliveryOrder.hasOne(GatePass, { foreignKey: "delivery_order_id" });
GatePass.belongsTo(DeliveryOrder, { foreignKey: "delivery_order_id" });

User.hasOne(Privilege, { foreignKey: "user_id", onDelete: "CASCADE" });
Privilege.belongsTo(User, { foreignKey: "user_id" });

module.exports = {
  sequelize,
  User,
  Customer,
  DeliveryOrder,
  Payment,
  GrayLot,
  Organization,
  ActivityLog,
  Quality,
  GatePass,
  Privilege,
};

