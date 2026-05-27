const { sequelize } = require("../models");

async function addInputUnitColumn() {
  try {
    console.log("Adding 'input_unit' column to 'delivery_orders' table...");
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'delivery_orders' 
      AND COLUMN_NAME = 'input_unit'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE delivery_orders 
        ADD COLUMN input_unit VARCHAR(20) NULL AFTER rate_unit
      `);
      console.log("Column 'input_unit' added successfully.");
    } else {
      console.log("Column already exists.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    process.exit();
  }
}

addInputUnitColumn();
