const express = require("express");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const authMiddleware = require("./middleware/authMiddleware");

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

app.use(authMiddleware);
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
