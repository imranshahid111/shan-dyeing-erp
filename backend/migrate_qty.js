const { sequelize } = require('./src/models');

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE delivery_orders ADD COLUMN kinar_cut_qty DECIMAL(12,2) NULL;');
    console.log('Added kinar_cut_qty');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('kinar_cut_qty already exists');
    } else {
      console.error(err);
    }
  }

  try {
    await sequelize.query('ALTER TABLE delivery_orders ADD COLUMN packing_qty DECIMAL(12,2) NULL;');
    console.log('Added packing_qty');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('packing_qty already exists');
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}

migrate();
