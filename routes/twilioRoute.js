const express = require("express");
const router = express.Router();

const twilioController = require("../controllers/twilioController");

router.post("/sms", twilioController.handleSMS);
router.get("/checksms", twilioController.checkSMS);
router.post("/sendsms", twilioController.sendSMS);

module.exports = router;
