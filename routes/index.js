const express = require("express");

const autotraderRoute = require("./autotraderRoute");
const feefoRoute = require("./feefoRoute");
const twilioRoute = require("./twilioRoute");
const botRoute = require("./botRoute");
const financeRoute = require("./financeRoute");
const stripeRoute = require("./stripeRoute");
const mainRoute = require("./mainRoute");
const vehicleRoute = require("./vehicleRoute");
const seoRoute = require("./seoRoute");

const router = express.Router();

router.use("/autotrader", autotraderRoute);
router.use("/feefo", feefoRoute);
router.use("/twilio", twilioRoute);
router.use("/bot", botRoute);
router.use("/finance", financeRoute);
router.use("/stripe", stripeRoute);
router.use("/main", mainRoute);
router.use("/vehicle", vehicleRoute);
router.use("/seo", seoRoute);

module.exports = router;
