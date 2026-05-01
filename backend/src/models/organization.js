module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "organizations",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      email: { type: DataTypes.STRING(120), allowNull: true },
      logo_url: { type: DataTypes.STRING(255), allowNull: true },
      currency: { type: DataTypes.STRING(10), defaultValue: "Rs" },
      terms: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      timestamps: true,
    }
  );
