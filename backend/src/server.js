const app = require("./app");
const env = require("./config/env");
const { sequelize } = require("./models");
const os = require("os");

async function bootstrap() {
  // #region agent log
  fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'initial-diagnosis',hypothesisId:'H4',location:'backend/src/server.js:bootstrap:start',message:'Server bootstrap started',data:{port:env.port,nodeEnv:env.nodeEnv},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  await sequelize.authenticate();
  await sequelize.sync();

  const server = app.listen(env.port, "0.0.0.0", () => {
    const address = server.address();
    const interfaces = Object.values(os.networkInterfaces())
      .flat()
      .filter((item) => item && item.family === "IPv4" && !item.internal)
      .map((item) => item.address);
    // #region agent log
    fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'initial-diagnosis',hypothesisId:'H4',location:'backend/src/server.js:listen',message:'Server listening',data:{address},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'iteration-3',hypothesisId:'H10',location:'backend/src/server.js:listen:interfaces',message:'Server network interfaces discovered',data:{interfaces,port:env.port},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.log(`ERP backend running on http://0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((error) => {
  // #region agent log
  fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'initial-diagnosis',hypothesisId:'H5',location:'backend/src/server.js:bootstrap:error',message:'Server bootstrap failed',data:{error:error.message},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
