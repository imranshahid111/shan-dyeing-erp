function notFound(req, res) {
  return res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
  return res.status(status).json({
    message: err.message || "Internal server error",
  });
}

module.exports = { notFound, errorHandler };
