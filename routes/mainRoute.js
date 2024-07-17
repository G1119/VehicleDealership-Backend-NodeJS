const express = require("express");
const router = express.Router();

const mainController = require("../controllers/mainController");

router.get("/postcode", mainController.postcode);
router.post("/validatePostcode", mainController.validatePostcode);
router.post("/calcRoadDistance", mainController.calcRoadDistance);
router.get("/sitemapxml", mainController.generateSitemapXML);
router.post("/enquiry", mainController.handleEnquiry);
router.post("/sendmail", mainController.sendMail);

module.exports = router;
