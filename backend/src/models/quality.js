module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "qualities",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    },
    {
      timestamps: true,
    }
  );
