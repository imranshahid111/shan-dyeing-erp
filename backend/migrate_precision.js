const { sequelize } = require('./src/models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    console.log("Altering delivery_orders table...");
    await sequelize.query("ALTER TABLE delivery_orders MODIFY COLUMN total_gray_gazana DECIMAL(14, 4) NOT NULL DEFAULT 0");
    await sequelize.query("ALTER TABLE delivery_orders MODIFY COLUMN total_ready_gazana DECIMAL(14, 4) NOT NULL DEFAULT 0");
    await sequelize.query("ALTER TABLE delivery_orders MODIFY COLUMN kinar_cut_qty DECIMAL(14, 4) NULL");
    await sequelize.query("ALTER TABLE delivery_orders MODIFY COLUMN packing_qty DECIMAL(14, 4) NULL");

    console.log("Altering gray_lots table...");
    await sequelize.query("ALTER TABLE gray_lots MODIFY COLUMN gazana DECIMAL(14, 4) NOT NULL DEFAULT 0");

    console.log("Altering return_lots table...");
    await sequelize.query("ALTER TABLE return_lots MODIFY COLUMN returned_quantity DECIMAL(14, 4) NOT NULL");

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
