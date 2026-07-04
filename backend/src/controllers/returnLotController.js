const { ReturnLot, GrayLot } = require("../models");
const logger = require("../utils/logger");

exports.getAllReturnLots = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    const returnLots = await ReturnLot.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["return_date", "DESC"]],
      include: [
        {
          model: GrayLot,
          attributes: ["lot_no", "party_name", "measurement"],
        },
      ],
    });

    res.json({
      total: returnLots.count,
      totalPages: Math.ceil(returnLots.count / limit),
      currentPage: parseInt(page),
      data: returnLots.rows,
    });
  } catch (error) {
    logger.error(`Error fetching return lots: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch return lots." });
  }
};

exports.createReturnLot = async (req, res) => {
  try {
    const { gray_lot_id, returned_quantity, return_date, reason } = req.body;

    if (!gray_lot_id || !returned_quantity || !return_date) {
      return res.status(400).json({ error: "gray_lot_id, returned_quantity, and return_date are required." });
    }

    const newReturnLot = await ReturnLot.create({
      gray_lot_id,
      returned_quantity,
      return_date,
      reason,
    });

    res.status(201).json({ message: "Return lot created successfully.", data: newReturnLot });
  } catch (error) {
    console.log(error);
    logger.error(`Error creating return lot: ${error.message}`);
    res.status(500).json({ error: "Failed to create return lot." });
  }
};

exports.updateReturnLot = async (req, res) => {
  try {
    const { id } = req.params;
    const { gray_lot_id, returned_quantity, return_date, reason } = req.body;

    const returnLot = await ReturnLot.findByPk(id);

    if (!returnLot) {
      return res.status(404).json({ error: "Return lot not found." });
    }

    if (!gray_lot_id || !returned_quantity || !return_date) {
      return res.status(400).json({ error: "gray_lot_id, returned_quantity, and return_date are required." });
    }

    await returnLot.update({
      gray_lot_id,
      returned_quantity,
      return_date,
      reason,
    });

    res.json({ message: "Return lot updated successfully.", data: returnLot });
  } catch (error) {
    logger.error(`Error updating return lot: ${error.message}`);
    res.status(500).json({ error: "Failed to update return lot." });
  }
};

exports.deleteReturnLot = async (req, res) => {
  try {
    const { id } = req.params;
    const returnLot = await ReturnLot.findByPk(id);

    if (!returnLot) {
      return res.status(404).json({ error: "Return lot not found." });
    }

    await returnLot.destroy();
    res.json({ message: "Return lot deleted successfully." });
  } catch (error) {
    logger.error(`Error deleting return lot: ${error.message}`);
    res.status(500).json({ error: "Failed to delete return lot." });
  }
};
