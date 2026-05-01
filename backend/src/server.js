const app = require("./app");
const env = require("./config/env");
const { sequelize } = require("./models");

async function bootstrap() {
  await sequelize.authenticate();
  await sequelize.sync();

  app.listen(env.port, () => {
    console.log(`ERP backend running on port http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
