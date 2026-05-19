module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "privileges",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
      can_view_dashboard: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      can_view_gray_lots: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_delivery_orders: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_billing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_payments: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_customers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_qualities: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_gate_pass: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_staff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_activity_logs: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_view_reports: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      can_delete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      indexes: [
        { name: "idx_privileges_user_id", unique: true, fields: ["user_id"] },
      ],
    }
  );
