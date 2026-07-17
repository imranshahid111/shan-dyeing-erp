module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "payments",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      delivery_order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      customer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      payment_date: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      mode: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "cash" },
      bank_name: { type: DataTypes.STRING(100), allowNull: true },
      reference_no: { type: DataTypes.STRING(80), allowNull: true }, // Transaction ID
      notes: { type: DataTypes.TEXT, allowNull: true },
      attachment: { type: DataTypes.TEXT("long"), allowNull: true },
      attachment_name: { type: DataTypes.STRING(255), allowNull: true },
      is_advance: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      indexes: [
        { name: "idx_payment_order_date", fields: ["delivery_order_id", "payment_date"] },
        { name: "idx_payment_mode_date", fields: ["mode", "payment_date"] },
      ],
    }
  );
