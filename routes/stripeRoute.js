const express = require("express");
const router = express.Router();

const stripeController = require("../controllers/stripeController");

router.post("/create-intent", stripeController.createIntent);
router.get("/confirm-intent", stripeController.confirmIntent);

module.exports = router;
