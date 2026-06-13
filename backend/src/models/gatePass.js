module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "gate_passes",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      gate_pass_no: { type: DataTypes.STRING(60), allowNull: false, unique: true },
      gate_pass_date: { type: DataTypes.DATEONLY, allowNull: false },
      vehicle_no: { type: DataTypes.STRING(60), allowNull: true },
      driver_name: { type: DataTypes.STRING(120), allowNull: true },
      driver_mobile: { type: DataTypes.STRING(30), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      indexes: [
        { name: "idx_gate_pass_no", unique: true, fields: ["gate_pass_no"] },
      ],
    }
  );

