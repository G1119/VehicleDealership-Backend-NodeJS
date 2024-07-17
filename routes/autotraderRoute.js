const express = require("express");
const router = express.Router();

const autotraderController = require("../controllers/autotraderController");

// router.get("/stock", autotraderController.retrieveStock);
router.post("/valuation", autotraderController.valuateVehicle);
router.post(
  "/retrieveVehicleByRegistration",
  autotraderController.retrieveVehicleByRegistration
);
router.post("/retrieveVehicleByVin", autotraderController.retrieveVehicleByVin);
router.post(
  "/retrieveVehicleByVinFromCMS",
  autotraderController.retrieveVehicleByVinFromCMS
);

router.put(
  "/stock-webhook",
  express.text({ type: "*/*" }),
  autotraderController.listenNotification
);

module.exports = router;
