const { sequelize } = require('./src/models');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if column already exists
    const [rows] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'delivery_orders' 
        AND COLUMN_NAME = 'order_date';
    `);

    if (rows.length > 0) {
      console.log('ℹ️  order_date column already exists — skipping');
    } else {
      await sequelize.query(`
        ALTER TABLE delivery_orders 
        ADD COLUMN order_date DATE NOT NULL DEFAULT '2025-01-01' AFTER gray_lot_id;
      `);
      console.log('✅ Migration done: order_date column added successfully');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrate();
