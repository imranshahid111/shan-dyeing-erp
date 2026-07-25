const { sequelize } = require('./src/models');

async function migrateDB() {
  try {
    console.log("Starting database migration...");

    // Updating columns to DECIMAL(14, 4)
    await sequelize.query("ALTER TABLE delivery_orders MODIFY total_gray_gazana DECIMAL(14, 4) NOT NULL DEFAULT 0;");
    console.log("Updated total_gray_gazana successfully.");

    await sequelize.query("ALTER TABLE delivery_orders MODIFY total_ready_gazana DECIMAL(14, 4) NOT NULL DEFAULT 0;");
    console.log("Updated total_ready_gazana successfully.");

    await sequelize.query("ALTER TABLE delivery_orders MODIFY kinar_cut_qty DECIMAL(14, 4) NULL;");
    console.log("Updated kinar_cut_qty successfully.");

    await sequelize.query("ALTER TABLE delivery_orders MODIFY packing_qty DECIMAL(14, 4) NULL;");
    console.log("Updated packing_qty successfully.");

    console.log("All columns modified successfully!");
    process.exit(0);
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
}

migrateDB();
