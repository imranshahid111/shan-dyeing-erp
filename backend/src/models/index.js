const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = require("./user")(sequelize, DataTypes);
const Customer = require("./customer")(sequelize, DataTypes);
const DeliveryOrder = require("./deliveryOrder")(sequelize, DataTypes);
const Payment = require("./payment")(sequelize, DataTypes);
const GrayLot = require("./grayLot")(sequelize, DataTypes);
const Organization = require("./organization")(sequelize, DataTypes);

Customer.hasMany(DeliveryOrder, { foreignKey: "customer_id" });
DeliveryOrder.belongsTo(Customer, { foreignKey: "customer_id" });

DeliveryOrder.hasMany(Payment, { foreignKey: "delivery_order_id" });
Payment.belongsTo(DeliveryOrder, { foreignKey: "delivery_order_id" });

GrayLot.hasMany(DeliveryOrder, { foreignKey: "gray_lot_id" });
DeliveryOrder.belongsTo(GrayLot, { foreignKey: "gray_lot_id" });

module.exports = {
  sequelize,
  User,
  Customer,
  DeliveryOrder,
  Payment,
  GrayLot,
  Organization,
};
