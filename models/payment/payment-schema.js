const mongoose = require("mongoose");
const schemaType = require("../../types");

const paymentSchema = new mongoose.Schema(
  {
    //stripe
    client_secret: {
      type: schemaType.TypeString,
      required: true,
    },
    amount: {
      type: schemaType.TypeNumber,
      required: true,
    },
    currency: {
      type: schemaType.TypeString,
      default: "gbp",
    },
    status: {
      type: schemaType.TypeString,
      default: "pending",
    },
    //checkout info
    type: {
      type: schemaType.TypeString,
      default: "reserve",
    },
    term: {
      type: schemaType.TypeNumber,
    },
    deposit: {
      type: schemaType.TypeNumber,
    },
    isDelivery: {
      type: schemaType.TypeString,
      default: "",
    },
    date: {
      type: schemaType.TypeString,
      default: "",
    },
    bestTime: {
      type: schemaType.TypeString,
      default: "",
    },
    note: {
      type: schemaType.TypeString,
    },
    preferredContactMethods: [
      {
        type: schemaType.TypeString,
      },
    ],
    //vehicle info
    vin: {
      type: schemaType.TypeString,
      required: true,
    },
    vehicleType: {
      type: schemaType.TypeString,
      required: true,
    },
    make: {
      type: schemaType.TypeString,
      required: true,
    },
    model: {
      type: schemaType.TypeString,
      required: true,
    },
    registration: {
      type: schemaType.TypeString,
      required: true,
    },
    colour: {
      type: schemaType.TypeString,
      required: true,
    },
    cashPrice: {
      type: schemaType.TypeString,
      required: true,
    },
    //customer detail
    fname: {
      type: schemaType.TypeString,
      required: true,
    },
    sname: {
      type: schemaType.TypeString,
      default: "",
    },
    email: {
      type: schemaType.TypeString,
    },
    phoneNumber: {
      type: schemaType.TypeString,
    },
    postcode: {
      type: schemaType.TypeString,
      required: true,
    },
    address1: {
      type: schemaType.TypeString,
      default: "",
    },
    address2: {
      type: schemaType.TypeString,
      default: "",
    },
    town: {
      type: schemaType.TypeString,
      default: "",
    },
    county: {
      type: schemaType.TypeString,
      default: "",
    },
    messages: [
      {
        type: schemaType.TypeObject,
      },
    ],
    px: {
      type: schemaType.TypeObject,
    },
  },
  { timestamps: true }
);

module.exports = paymentSchema;
