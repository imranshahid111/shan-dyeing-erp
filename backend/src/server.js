require("./utils/logger");
const app = require("./app");
const env = require("./config/env");
const { sequelize } = require("./models");
const os = require("os");

async function bootstrap() {

  await sequelize.authenticate();
  // await sequelize.sync({ alter: true });

  // Initialize Background Services
  try {
    require("./services/backupService");
    console.log("Database backup service started");
  } catch (err) {
    console.error("Failed to start backup service:", err.message);
  }

  const server = app.listen(env.port, "0.0.0.0", () => {
    const address = server.address();
    const interfaces = Object.values(os.networkInterfaces())
      .flat()
      .filter((item) => item && item.family === "IPv4" && !item.internal)
      .map((item) => item.address);

    console.log(`ERP backend running on http://0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((error) => {

  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
