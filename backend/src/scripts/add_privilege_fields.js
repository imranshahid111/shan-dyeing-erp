const { sequelize } = require("../models");

async function runMigration() {
  try {
    console.log("Checking columns on 'privileges' table...");
    
    // Check if can_edit column exists
    const [canEditResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'privileges' 
      AND COLUMN_NAME = 'can_edit'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (canEditResults.length === 0) {
      console.log("Adding 'can_edit' column to 'privileges' table...");
      await sequelize.query(`
        ALTER TABLE privileges 
        ADD COLUMN can_edit TINYINT(1) NOT NULL DEFAULT 0 AFTER can_view_reports
      `);
      console.log("Column 'can_edit' added successfully.");
    } else {
      console.log("Column 'can_edit' already exists.");
    }

    // Check if allowed_reports column exists
    const [allowedReportsResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'privileges' 
      AND COLUMN_NAME = 'allowed_reports'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (allowedReportsResults.length === 0) {
      console.log("Adding 'allowed_reports' column to 'privileges' table...");
      await sequelize.query(`
        ALTER TABLE privileges 
        ADD COLUMN allowed_reports TEXT NULL AFTER can_edit
      `);
      console.log("Column 'allowed_reports' added successfully.");
    } else {
      console.log("Column 'allowed_reports' already exists.");
    }

  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    process.exit();
  }
}

runMigration();
