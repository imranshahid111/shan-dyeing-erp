module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "customer_ledgers",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      customer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      transaction_type: { type: DataTypes.ENUM("Credit", "Debit"), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      reference_type: { type: DataTypes.STRING(50), allowNull: false }, // 'Advance Payment', 'Invoice Payment', 'Refund', 'Adjustment'
      reference_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // ID of DO or Payment
      description: { type: DataTypes.STRING(255), allowNull: true },
      date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      indexes: [
        { name: "idx_customer_ledger_customer", fields: ["customer_id"] },
        { name: "idx_customer_ledger_date", fields: ["date"] },
        { name: "idx_customer_ledger_ref", fields: ["reference_type", "reference_id"] },
      ],
    }
  );
