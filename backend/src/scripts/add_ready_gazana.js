const { sequelize } = require("../models");

async function addReadyGazanaColumn() {
  try {
    console.log("Adding 'total_ready_gazana' column to 'delivery_orders' table...");
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'delivery_orders' 
      AND COLUMN_NAME = 'total_ready_gazana'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE delivery_orders 
        ADD COLUMN total_ready_gazana DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER total_gray_gazana
      `);
      console.log("Column 'total_ready_gazana' added successfully.");
    } else {
      console.log("Column 'total_ready_gazana' already exists.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    process.exit();
  }
}

addReadyGazanaColumn();
