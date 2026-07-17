const { sequelize } = require('./src/models');

async function resetAdvance() {
  try {
    await sequelize.query('UPDATE customers SET advance_balance = 0');
    console.log('All customers advance_balance reset to 0');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAdvance();
