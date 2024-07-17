const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user");
db.chatHistory = require("./chat-history");
db.payment = require("./payment");
db.vehicle = require("./vehicle");

module.exports = db;
