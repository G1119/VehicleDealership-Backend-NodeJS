const mongoose = require("mongoose");
const schemaType = require("../../types");

const userSchema = new mongoose.Schema(
  {
    phone_number: {
      type: schemaType.TypeString,
      required: true,
      set: function (value) {
        return `+${value.replace(/\D/g, "")}`; // Remove spaces from the phone number
      },
    },
    verification_code: {
      type: schemaType.TypeString,
      required: true,
    },
    isCodeUsed: {
      type: schemaType.TypeBoolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = userSchema;
