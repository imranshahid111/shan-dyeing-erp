const { sequelize } = require('./src/models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.query(`
      ALTER TABLE delivery_orders 
      ADD COLUMN IF NOT EXISTS order_date DATE NOT NULL DEFAULT (CURRENT_DATE) AFTER gray_lot_id;
    `);

    console.log('✅ Migration done: order_date column added (or already existed)');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrate();
