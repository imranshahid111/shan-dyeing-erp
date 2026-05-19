const { sequelize, GrayLot, Quality } = require("../models");

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // 1. Ensure qualities exist
    const [q1] = await Quality.findOrCreate({ where: { name: "Cotton Jersey" } });
    const [q2] = await Quality.findOrCreate({ where: { name: "Polyester Blend" } });
    const [q3] = await Quality.findOrCreate({ where: { name: "Linen" } });
    const [q4] = await Quality.findOrCreate({ where: { name: "Silk" } });

    // 2. Map existing qualities
    const qualities = await Quality.findAll();
    const qMap = {};
    for (const q of qualities) {
      qMap[q.name.toLowerCase()] = q.id;
    }

    // 3. Add quality_id column if it doesn't exist (using raw query to avoid model sync conflicts temporarily)
    const [results] = await sequelize.query("SHOW COLUMNS FROM `gray_lots` LIKE 'quality_id'");
    if (results.length === 0) {
      console.log("Adding quality_id column...");
      await sequelize.query("ALTER TABLE `gray_lots` ADD COLUMN `quality_id` BIGINT UNSIGNED DEFAULT 1");
    }

    // 4. Update existing records
    const [lots] = await sequelize.query("SELECT id, quality FROM `gray_lots` WHERE quality IS NOT NULL");
    for (const lot of lots) {
      const qName = lot.quality.toLowerCase();
      let qId = qMap[qName];
      
      // If quality not found in map, create it
      if (!qId) {
        const newQ = await Quality.create({ name: lot.quality });
        qMap[qName] = newQ.id;
        qId = newQ.id;
      }
      
      await sequelize.query(`UPDATE \`gray_lots\` SET quality_id = ${qId} WHERE id = ${lot.id}`);
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
