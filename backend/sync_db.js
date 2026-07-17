const { sequelize } = require("./src/models");
async function run() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("Database altered successfully.");
  process.exit(0);
}
run().catch(err => {
  console.error(err);
  process.exit(1);
});
