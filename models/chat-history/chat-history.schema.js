const mongoose = require("mongoose");
const schemaType = require("../../types");

const videoSchema = new mongoose.Schema(
  {
    isBot: {
      type: schemaType.TypeBoolean,
      required: true,
    },
    text: {
      type: schemaType.TypeString,
      required: true,
    },
    vehicles: [
      {
        type: schemaType.TypeString,
      },
    ],
    state: {
      type: schemaType.TypeObject,
      default: {
        user_contact_info: { name: "", "e-mail": "", number: "" },
        user_vehicle_info: {
          vrn: "",
          mileage: "",
          cost: "",
          active: "",
          make: "",
          model: "",
          generation: "",
          links: [],
          condition: "",
          service_history: "",
        },
        finance_info: { vin: "", deposit: "", term: "", active: "" },
        full_pay_info: { vin: "", active: "" },
        user_location: {},
        stripe: "",
        viewed_vehicles: [],
        user_location_info: { postcode: "", town: "", county: "" },
      },
    },
    phone_number: {
      type: schemaType.TypeString,
      required: true,
    },
    time: {
      type: schemaType.TypeDate,
      required: true,
      default: new Date(),
    },
    forward: {
      type: schemaType.TypeBoolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = videoSchema;
