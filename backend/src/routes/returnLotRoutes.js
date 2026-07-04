const express = require("express");
const router = express.Router();
const returnLotController = require("../controllers/returnLotController");
const authMiddleware = require("../middleware/authMiddleware");

// router.use(authMiddleware);

router.get("/", returnLotController.getAllReturnLots);
router.post("/", returnLotController.createReturnLot);
router.put("/:id", returnLotController.updateReturnLot);
router.delete("/:id", returnLotController.deleteReturnLot);

module.exports = router;
