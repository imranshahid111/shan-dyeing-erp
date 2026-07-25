const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const env = require("../config/env");

exports.downloadBackup = (req, res, next) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-manual-${env.dbName}-${timestamp}.sql`;
  const BACKUP_DIR = path.join(__dirname, "../../backups");
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const filepath = path.join(BACKUP_DIR, filename);

  const command = `mysqldump --set-gtid-purged=OFF --column-statistics=0 -h ${env.dbHost} -P ${env.dbPort} -u ${env.dbUser} ${env.dbPassword ? `-p${env.dbPassword}` : ""} ${env.dbName} > "${filepath}"`;

  exec(command, (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to create database backup" });
    }
    
    // Attempt collation fix if needed
    try {
      let content = fs.readFileSync(filepath, 'utf8');
      content = content.replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci');
      fs.writeFileSync(filepath, content, 'utf8');
    } catch(err) {
      console.error(err);
    }
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error(err);
      }
      // Optionally delete the file after sending
      try {
        fs.unlinkSync(filepath);
      } catch(e) { }
    });
  });
};

exports.restoreDatabase = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No database file uploaded" });
  }

  const sqlFilePath = req.file.path;
  const command = `mysql -h ${env.dbHost} -P ${env.dbPort} -u ${env.dbUser} ${env.dbPassword ? `-p${env.dbPassword}` : ""} ${env.dbName} < "${sqlFilePath}"`;

  exec(command, (error, stdout, stderr) => {
    fs.unlink(sqlFilePath, (unlinkErr) => {
      if (unlinkErr) console.error("Failed to delete uploaded SQL file:", unlinkErr);
    });

    if (error) {
      console.error("Exec error:", error);
      console.error("Stderr:", stderr);
      return res.status(500).json({ message: "Failed to restore database", details: error.message });
    }
    
    res.status(200).json({ message: "Database restored successfully" });
  });
};
