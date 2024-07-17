const express = require("express");
const router = express.Router();

const financeController = require("../controllers/financeController");

router.get("/calculate", financeController.calculate);
router.get("/limit", financeController.getLimitation);

module.exports = router;
