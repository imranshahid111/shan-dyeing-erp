const sequelize = require("../config/db");

async function fixSchema() {
  try {
    console.log("Checking ActivityLog table...");
    const [results] = await sequelize.query("SHOW COLUMNS FROM ActivityLog LIKE 'user_name'");
    
    if (results.length === 0) {
      console.log("Adding 'user_name' column to ActivityLog table...");
      await sequelize.query("ALTER TABLE ActivityLog ADD COLUMN user_name VARCHAR(120) AFTER details");
      console.log("Column added successfully!");
    } else {
      console.log("'user_name' column already exists.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error fixing schema:", error.message);
    process.exit(1);
  }
}

fixSchema();
