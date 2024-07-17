const mongoose = require("mongoose");
const paymentSchema = require("./payment-schema");

const payment = mongoose.model("payments", paymentSchema);

module.exports = payment;
