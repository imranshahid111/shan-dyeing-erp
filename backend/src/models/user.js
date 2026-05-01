module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "users",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      full_name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "manager" },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      indexes: [
        { name: "idx_users_email", unique: true, fields: ["email"] },
        { name: "idx_users_role_active", fields: ["role", "is_active"] },
      ],
    }
  );
