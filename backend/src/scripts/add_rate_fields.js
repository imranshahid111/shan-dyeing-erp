const { sequelize } = require("../models");

async function addRateColumns() {
  try {
    console.log("Adding 'rate' and 'rate_unit' columns to 'delivery_orders' table...");
    
    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'delivery_orders' 
      AND COLUMN_NAME IN ('rate', 'rate_unit')
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (results.length < 2) {
      await sequelize.query(`
        ALTER TABLE delivery_orders 
        ADD COLUMN rate DECIMAL(12, 2) NULL AFTER total_ready_gazana,
        ADD COLUMN rate_unit VARCHAR(20) NULL AFTER rate
      `);
      console.log("Columns 'rate' and 'rate_unit' added successfully.");
    } else {
      console.log("Columns already exist.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    process.exit();
  }
}

addRateColumns();
