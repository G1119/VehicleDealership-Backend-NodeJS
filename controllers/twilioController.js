const twilio = require("twilio");

const {
  sendMessage,
  queryToBot,
  findOne,
  generateVerificationCode,
  insertNewDocument,
} = require("../helpers");

const { TWILIO_AUTH_TOKEN, APP_API, US_PHONENUMBER, UK_PHONENUMBER } = require("../config");

exports.handleSMS = async (req, res) => {
  try {
    console.log(req.body);

    const twilioSignature = req.headers["x-twilio-signature"];
    const params = req.body;
    const url = `https://${APP_API}/api/twilio/sms`;

    const requestIsValid = twilio.validateRequest(
      TWILIO_AUTH_TOKEN,
      twilioSignature,
      url,
      params
    );

    if (requestIsValid) {
      console.log("Valid Twilio Signature");
      // Continue processing request
    } else {
      console.log("Invalid Twilio Signature");
      // Return appropriate response
      throw new Error("Invalid Twilio Signature");
    }

    if (
      !req.body.From ||
      !req.body.To ||
      !req.body.Body ||
      req.body.Body === ""
    ) {
      throw new Error("Incorrect request body.");
    }

    try {
      const result = await queryToBot(req.body.From, req.body.Body);

      await sendMessage(
        `${result.text}\n ${result.vehicles.join("\n ")}`,
        req.body.From,
        req.body.To
      );
    } catch (error) {
      console.log(error);
      await sendMessage(
        "Sorry, could you please try again?",
        req.body.From,
        req.body.To
      );
    }

    res.status(200).json({ message: "Success!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkSMS = async (req, res) => {
  try {
    if (!req.query.phone_number) {
      throw new Error("Incorrect Params.");
    }

    phone_number = `+${req.query.phone_number.replace(/\D/g, "")}`;

    let verification_code;
    let result;

    do {
      verification_code = generateVerificationCode();

      result = await findOne("user", {
        phone_number,
        verification_code,
      });
    } while (!!result);

    const status = await sendMessage(verification_code, phone_number);

    if (status === true) {
      await insertNewDocument("user", {
        phone_number,
        verification_code,
        isCodeUsed: false,
      });
    } else {
      throw new Error(status.message);
    }

    res.status(200).json({ message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

exports.sendSMS = async (req, res) => {
  try {
    if (
      !req.body.To ||
      !req.body.type ||
      !req.body.Body ||
      req.body.Body === ""
    ) {
      throw new Error("Incorrect request body.");
    }

    console.log("*****************")
    const status = await sendMessage(
      req.body.Body,
      req.body.type === "whatsapp" ? `whatsapp:${req.body.To}` : req.body.To,
      req.body.type === "whatsapp" ? `whatsapp:${UK_PHONENUMBER}` : null       // US_PHONENUMBER
    );

    console.log("####", req.body, "%%%", status)
    if (status !== true) {
      throw new Error(status.message);
    }

    res.status(200).json({ message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};
