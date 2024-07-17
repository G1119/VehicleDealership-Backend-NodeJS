const express = require("express");
const router = express.Router();

const feefoController = require("../controllers/feefoController");

router.get("/count", feefoController.getCount);
router.get("/stats", feefoController.getAverageRate);
router.get("/feedbacks", feefoController.getFeedbacks);

module.exports = router;
