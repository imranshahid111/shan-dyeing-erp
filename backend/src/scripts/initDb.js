const { sequelize } = require("../models");

async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();

  console.log("Database ready with indexes.");
  process.exit(0);
}

initDb().catch((error) => {
  console.error("DB init failed:", error.message);
  process.exit(1);
});
