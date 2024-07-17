const mongoose = require("mongoose");
const vehicleSchema = require("./vehicle-schema");

const vehicle = mongoose.model("vehicles", vehicleSchema);

module.exports = vehicle;
