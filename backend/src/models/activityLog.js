const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define("ActivityLog", {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_name: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    }
  }, {
    underscored: true,
    freezeTableName: true,
    timestamps: true,
  });

  return ActivityLog;
};
