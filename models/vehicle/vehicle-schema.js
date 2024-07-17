const mongoose = require("mongoose");
const schemaType = require("../../types");

const vehicleSchema = new mongoose.Schema(
  {
    vin: {
      type: schemaType.TypeString,
      required: true,
      match: /^[A-Z0-9]{17}$/,
      unique: true,
    },
    registration: {
      type: schemaType.TypeString,
      required: true,
      unique: true,
    },
    make: {
      type: schemaType.TypeString,
      required: true,
    },
    model: {
      type: schemaType.TypeString,
      required: true,
    },
    vehicleType: {
      type: schemaType.TypeString,
      required: true,
    },
    bodyType: {
      type: schemaType.TypeString,
      required: true,
    },
    fuelType: {
      type: schemaType.TypeString,
      required: true,
    },
    colour: {
      type: schemaType.TypeString,
      required: true,
    },
    transmissionType: {
      type: schemaType.TypeString,
      required: true,
    },
    odometerReadingMiles: {
      type: schemaType.TypeNumber,
      required: true,
    },
    price: {
      type: schemaType.TypeNumber,
      required: true,
    },
    finance: {
      type: schemaType.TypeNumber,
      required: true,
    },
    yearOfManufacture: {
      type: schemaType.TypeNumber,
      required: true,
    },
    //general data
    vehicle: {
      type: schemaType.TypeObject,
      required: true,
    },
    adverts: {
      type: schemaType.TypeObject,
      required: true,
    },
    metadata: {
      type: schemaType.TypeObject,
      required: true,
    },
    features: {
      type: schemaType.TypeObject,
      required: true,
    },
    media: {
      type: schemaType.TypeObject,
      required: true,
    },
    history: {
      type: schemaType.TypeObject,
      required: true,
    },
    check: {
      type: schemaType.TypeObject,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = vehicleSchema;
