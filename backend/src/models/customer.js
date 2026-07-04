module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "customers",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      customer_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(160), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      city: { type: DataTypes.STRING(80), allowNull: true },
      credit_limit: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      outstanding_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      advance_balance: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    },
    {
      indexes: [
        { name: "idx_customers_code", unique: true, fields: ["customer_code"] },
        { name: "idx_customers_name", fields: ["name"] },
        { name: "idx_customers_city", fields: ["city"] },
      ],
    }
  );
