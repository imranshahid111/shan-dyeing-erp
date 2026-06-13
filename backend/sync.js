const { sequelize } = require("./src/models");

async function createTable() {
  try {
    await sequelize.authenticate();
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS return_lots (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gray_lot_id BIGINT UNSIGNED NOT NULL,
        returned_quantity DECIMAL(12,2) NOT NULL,
        return_date DATE NOT NULL,
        reason TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX idx_return_lot_gray_lot (gray_lot_id),
        INDEX idx_return_lot_date (return_date)
      ) ENGINE=InnoDB;
    `);
    
    console.log("Table return_lots created successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

createTable();
