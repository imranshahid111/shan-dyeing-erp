exports.logActivity = async (module, action, details, req) => {
  console.log(`[ACTIVITY LOG] ${module} | ${action} | ${details}`);
};
