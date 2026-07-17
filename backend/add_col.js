const { sequelize } = require("./src/models");
async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TABLE payments ADD COLUMN customer_id BIGINT UNSIGNED NULL AFTER delivery_order_id;");
    console.log("Column added successfully.");
  } catch (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("Column already exists.");
    } else {
      console.error(err);
      process.exit(1);
    }
  }
  process.exit(0);
}
run();
