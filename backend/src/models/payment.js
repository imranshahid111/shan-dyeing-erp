module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "payments",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      delivery_order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      payment_date: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      mode: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "cash" },
      reference_no: { type: DataTypes.STRING(80), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      indexes: [
        { name: "idx_payment_order_date", fields: ["delivery_order_id", "payment_date"] },
        { name: "idx_payment_mode_date", fields: ["mode", "payment_date"] },
      ],
    }
  );
