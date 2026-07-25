const { sequelize } = require('./src/models');

async function updateDB() {
  try {
    // Add the 'than' column to the return_lots table if it doesn't exist
    await sequelize.query('ALTER TABLE return_lots ADD COLUMN than INT NULL DEFAULT 0');
    console.log("Successfully added 'than' column to return_lots table.");
  } catch (error) {
    // Catch the error if the column already exists, which is common in SQLite/MySQL
    if (error.message.includes('duplicate column name') || error.message.includes('Duplicate column name')) {
      console.log("Column 'than' already exists in return_lots table.");
    } else {
      console.error("Failed to update database:", error.message);
    }
  } finally {
    process.exit(0);
  }
}

updateDB();
