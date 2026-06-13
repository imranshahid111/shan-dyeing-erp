const { sequelize } = require('./src/models');

async function migrate() {
  // 1. Create gate_pass_items table
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS gate_pass_items (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gate_pass_id BIGINT UNSIGNED NOT NULL,
        delivery_order_id BIGINT UNSIGNED NOT NULL,
        description VARCHAR(255) NULL,
        bundles INT UNSIGNED NULL DEFAULT 0,
        gazana_total DECIMAL(12,2) NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_gpi_gate_pass (gate_pass_id),
        INDEX idx_gpi_delivery_order (delivery_order_id),
        CONSTRAINT fk_gpi_gate_pass FOREIGN KEY (gate_pass_id) REFERENCES gate_passes(id) ON DELETE CASCADE,
        CONSTRAINT fk_gpi_do FOREIGN KEY (delivery_order_id) REFERENCES delivery_orders(id) ON DELETE CASCADE
      );
    `);
    console.log('Created gate_pass_items table');
  } catch (err) {
    console.error('Error creating gate_pass_items:', err.message);
  }

  // 2. Migrate existing gate_pass data into gate_pass_items
  try {
    const [existing] = await sequelize.query(`
      SELECT id, delivery_order_id, created_at FROM gate_passes WHERE delivery_order_id IS NOT NULL
    `);
    for (const row of existing) {
      // Get the gray gazana from delivery order
      const [doRows] = await sequelize.query(`SELECT total_gray_gazana FROM delivery_orders WHERE id = ?`, { replacements: [row.delivery_order_id] });
      const gazana = doRows[0]?.total_gray_gazana || 0;
      await sequelize.query(`
        INSERT IGNORE INTO gate_pass_items (gate_pass_id, delivery_order_id, gazana_total, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `, { replacements: [row.id, row.delivery_order_id, gazana] });
    }
    console.log(`Migrated ${existing.length} existing gate pass records to gate_pass_items`);
  } catch (err) {
    console.error('Error migrating existing data:', err.message);
  }

  // 3. Drop the unique index on delivery_order_id if it exists, then drop the column
  try {
    await sequelize.query(`ALTER TABLE gate_passes DROP INDEX idx_gate_delivery_order`);
    console.log('Dropped idx_gate_delivery_order index');
  } catch (err) {
    console.log('Index idx_gate_delivery_order not found or already dropped');
  }

  try {
    await sequelize.query(`ALTER TABLE gate_passes DROP COLUMN delivery_order_id`);
    console.log('Dropped delivery_order_id column from gate_passes');
  } catch (err) {
    console.log('delivery_order_id column not found or already dropped:', err.message);
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate();
