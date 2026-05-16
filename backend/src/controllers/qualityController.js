const { Quality } = require("../models");

exports.getQualities = async (req, res, next) => {
  try {
    const qualities = await Quality.findAll({ order: [["name", "ASC"]] });
    return res.json(qualities);
  } catch (error) {
    return next(error);
  }
};

exports.createQuality = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const exists = await Quality.findOne({ where: { name } });
    if (exists) return res.status(400).json({ message: "Quality already exists" });

    const quality = await Quality.create({ name });
    return res.status(201).json(quality);
  } catch (error) {
    return next(error);
  }
};

exports.updateQuality = async (req, res, next) => {
  try {
    const { name } = req.body;
    const quality = await Quality.findByPk(req.params.id);
    if (!quality) return res.status(404).json({ message: "Quality not found" });

    await quality.update({ name });
    return res.json(quality);
  } catch (error) {
    return next(error);
  }
};

exports.deleteQuality = async (req, res, next) => {
  try {
    const quality = await Quality.findByPk(req.params.id);
    if (!quality) return res.status(404).json({ message: "Quality not found" });

    await quality.destroy();
    return res.json({ success: true, message: "Quality deleted" });
  } catch (error) {
    return next(error);
  }
};
