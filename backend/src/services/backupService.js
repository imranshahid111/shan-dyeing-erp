const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const env = require("../config/env");

const BACKUP_DIR = path.join(__dirname, "../../backups");
const RETENTION_DAYS = 7;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const performBackup = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${env.dbName}-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  console.log(`[Backup] Starting backup: ${filename}`);

  // Construct mysqldump command
  // --set-gtid-purged=OFF prevents the GTID error on systems that don't support it (e.g. MariaDB or different MySQL versions)
  // --column-statistics=0 is used to avoid issues with some newer MySQL versions
  const command = `mysqldump --set-gtid-purged=OFF --column-statistics=0 -h ${env.dbHost} -P ${env.dbPort} -u ${env.dbUser} ${env.dbPassword ? `-p${env.dbPassword}` : ""} ${env.dbName} > "${filepath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Backup] Error during backup: ${error.message}`);
      return;
    }
    console.log(`[Backup] Backup successful: ${filepath}`);
    
    // Fix compatibility: Replace MySQL 8.0 specific collation with more compatible one
    try {
      let content = fs.readFileSync(filepath, 'utf8');
      content = content.replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci');
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`[Backup] Compatibility fix applied to ${filename}`);
    } catch (err) {
      console.error(`[Backup] Failed to apply compatibility fix: ${err.message}`);
    }

    cleanupOldBackups();
  });
};

const cleanupOldBackups = () => {
  console.log("[Backup] Cleaning up old backups...");
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

  files.forEach((file) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const ageMs = now - stats.mtimeMs;

    if (ageMs > retentionMs) {
      console.log(`[Backup] Deleting old backup: ${file}`);
      fs.unlinkSync(filePath);
    }
  });
};

// Schedule: 00:00 (Midnight) and 12:00 (Noon)
// Seconds (0), Minutes (0), Hours (0,12), Day of month (*), Month (*), Day of week (*)
cron.schedule("0 0,12 * * *", () => {
  console.log("[Backup] Scheduled backup triggered...");
  performBackup();
});

// Also run once on startup
console.log("[Backup] Initializing backup service...");
performBackup();

module.exports = { performBackup };
