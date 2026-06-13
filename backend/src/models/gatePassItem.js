module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "gate_pass_items",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      gate_pass_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      delivery_order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      bundles: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
      gazana_total: { type: DataTypes.DECIMAL(12, 2), allowNull: true, defaultValue: 0 },
    },
    {
      indexes: [
        { name: "idx_gpi_gate_pass", fields: ["gate_pass_id"] },
        { name: "idx_gpi_delivery_order", fields: ["delivery_order_id"] },
      ],
    }
  );
