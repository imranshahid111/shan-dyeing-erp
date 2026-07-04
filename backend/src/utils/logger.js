exports.logActivity = async (module, action, details, req) => {
  console.log(`[ACTIVITY LOG] ${module} | ${action} | ${details}`);
};

exports.error = (message, ...args) => {
  console.error(`[ERROR]`, message, ...args);
};

exports.info = (message, ...args) => {
  console.log(`[INFO]`, message, ...args);
};
