const express = require("express");
const router = express.Router();

const seoController = require("../controllers/seoController");

router.post("/prerender", seoController.prerender);
router.get("/prerenderAll", seoController.prerenderAll);
router.get("/html/*", seoController.sendHTML);

module.exports = router;
