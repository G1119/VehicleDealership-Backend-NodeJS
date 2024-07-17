const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");

router.get("/updateTotalStock", vehicleController.updateTotalStock);
router.get("/stock", vehicleController.retrieveStock);
router.get("/getAll", vehicleController.getAll);
router.post("/retrieveVehicleByVin", vehicleController.retrieveVehicleByVin);
router.post("/retrieveVehiclesByVin", vehicleController.retrieveVehiclesByVin);
router.get("/updateStock", vehicleController.updateStock);
router.post(
  "/cms-webhook",
  express.text({ type: "*/*" }),
  vehicleController.listenNotification
);

module.exports = router;
