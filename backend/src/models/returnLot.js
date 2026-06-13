module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "return_lots",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      gray_lot_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      returned_quantity: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      return_date: { type: DataTypes.DATEONLY, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      indexes: [
        { name: "idx_return_lot_gray_lot", fields: ["gray_lot_id"] },
        { name: "idx_return_lot_date", fields: ["return_date"] },
      ],
    }
  );
