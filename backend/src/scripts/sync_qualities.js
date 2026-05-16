const { Quality } = require("../models");

async function syncQualityTable() {
  try {
    console.log("Syncing 'qualities' table...");
    await Quality.sync();
    console.log("'qualities' table synced successfully.");
  } catch (error) {
    console.error("Sync failed:", error.message);
  } finally {
    process.exit();
  }
}

syncQualityTable();
