module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "gray_lots",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      entry_date: { type: DataTypes.DATEONLY, allowNull: false },
      party_name: { type: DataTypes.STRING(160), allowNull: false },
      process_type: { type: DataTypes.STRING(40), allowNull: false },
      bill_no: { type: DataTypes.STRING(60), allowNull: true },
      lot_no: { type: DataTypes.STRING(60), allowNull: false, unique: true },
      quality_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      measurement: { type: DataTypes.STRING(20), allowNull: false },
      than: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      gazana: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      indexes: [
        { name: "idx_gray_lot_no", unique: true, fields: ["lot_no"] },
        { name: "idx_gray_party_date", fields: ["party_name", "entry_date"] },
        { name: "idx_gray_process_date", fields: ["process_type", "entry_date"] },
      ],
    }
  );
