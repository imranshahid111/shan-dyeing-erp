exports.checkHealth = async (req, res) => {
  return res.json({ ok: true, service: "erp-backend" });
};
