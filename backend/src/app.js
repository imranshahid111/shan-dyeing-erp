const express = require("express");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));
app.use((req, _res, next) => {
  // #region agent log
  fetch('http://127.0.0.1:7926/ingest/a2b94f05-6485-4bc6-91a5-e6d95c86d6e1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd915f'},body:JSON.stringify({sessionId:'dd915f',runId:'iteration-2',hypothesisId:'H8',location:'backend/src/app.js:request-in',message:'API request reached backend',data:{method:req.method,url:req.originalUrl},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  next();
});

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
