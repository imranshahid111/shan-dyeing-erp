const { sequelize, User } = require("../models");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
  await sequelize.authenticate();
  
  const password_hash = await bcrypt.hash("admin123", 10);
  
  const [user, created] = await User.findOrCreate({
    where: { email: "admin@erp.com" },
    defaults: {
      full_name: "System Admin",
      password_hash,
      role: "admin",
      is_active: true
    }
  });

  if (created) {
    console.log("Admin user created: admin@erp.com / admin123");
  } else {
    console.log("Admin user already exists.");
  }
  
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
