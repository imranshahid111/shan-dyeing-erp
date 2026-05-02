const { sequelize } = require("./src/models");

async function run() {
  try {
    await sequelize.query('ALTER TABLE delivery_orders CHANGE total_ready_gazana total_gray_gazana DECIMAL(12, 2) NOT NULL DEFAULT 0;');
    console.log("Column renamed successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

run();
