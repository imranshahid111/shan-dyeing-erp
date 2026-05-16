const { sequelize } = require("../models");

/**
 * Generates the next sequential number for a given model and field.
 * @param {Object} Model - The Sequelize model.
 * @param {string} field - The field to check (e.g., 'lot_no', 'order_no').
 * @param {string} prefix - The prefix (e.g., 'LOT-', 'DO-').
 * @param {number} length - The padding length (default 4 for 0001).
 * @returns {Promise<string>} - The next formatted number.
 */
async function getNextSequence(Model, field, prefix, length = 4) {
  const result = await Model.findOne({
    attributes: [field],
    order: [[field, 'DESC']],
    where: {
      [field]: {
        [require('sequelize').Op.like]: `${prefix}%`
      }
    }
  });

  let nextNumber = 1;
  if (result && result[field]) {
    const currentString = result[field];
    const numericPart = currentString.replace(prefix, '');
    const currentNumber = parseInt(numericPart, 10);
    if (!isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(length, '0')}`;
}

module.exports = { getNextSequence };
