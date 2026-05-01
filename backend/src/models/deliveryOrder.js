module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "delivery_orders",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_no: { type: DataTypes.STRING(60), allowNull: false, unique: true },
      customer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      gray_lot_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      order_date: { type: DataTypes.DATEONLY, allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "pending" },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      paid_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_ready_gazana: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      grid_data: { type: DataTypes.JSON, allowNull: true },
    },
    {
      indexes: [
        { name: "idx_delivery_order_no", unique: true, fields: ["order_no"] },
        { name: "idx_delivery_customer_date", fields: ["customer_id", "order_date"] },
        { name: "idx_delivery_status_date", fields: ["status", "order_date"] },
        { name: "idx_delivery_due_date", fields: ["due_date"] },
      ],
    }
  );
