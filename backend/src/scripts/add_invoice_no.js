const { sequelize } = require("../models");

async function addInvoiceNoColumn() {
  try {
    console.log("Adding 'invoice_no' column to 'delivery_orders' table...");
    
    // Check if column already exists to avoid errors
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'delivery_orders' 
      AND COLUMN_NAME = 'invoice_no'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE delivery_orders 
        ADD COLUMN invoice_no VARCHAR(60) NULL UNIQUE AFTER order_no
      `);
      console.log("Column 'invoice_no' added successfully.");
    } else {
      console.log("Column 'invoice_no' already exists.");
    }
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    process.exit();
  }
}

addInvoiceNoColumn();
