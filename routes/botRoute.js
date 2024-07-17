const express = require("express");
const router = express.Router();

const botController = require("../controllers/botController");

router.post("/query", botController.queryToBot);
router.get("/history", botController.getChatHistory);
router.post("/verify", botController.verify);

module.exports = router;
