const {
  queryToBot,
  findOne,
  find,
  updateDocument,
  generateToken,
  getImagesByVins,
  extractVins,
} = require("../helpers");
const ObjectId = require("mongodb").ObjectID;

exports.queryToBot = async (req, res) => {
  try {
    const result = await queryToBot(
      req.check.user ? req.check.user.phone_number : req.check.user,
      req.body.query,
      req.body.location,
      req.body.history || [],
      req.body.focusedVehicle,
      req.body.state,
      req.body.chat_id
    );

    let extra;

    if (result.vehicles.length === 0) {
      extra = await getImagesByVins(extractVins(result.text));
    } else {
      extra = await getImagesByVins(extractVins(result.vehicles.join(" ")));
    }

    res.status(200).json({
      message: "Success!",
      data: { ...{ text: result.text }, ...extra, ...{ state: result.state } },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    if (req.check.status !== "admin" && req.check.status !== "user") {
      throw new Error(req.check.status);
    }

    let history;

    if (req.check.user) {
      history = await find("chatHistory", {
        phone_number: req.check.user.phone_number,
      });
    } else {
      history = await find("chatHistory", {
        phone_number: `+${req.query.phone_number.replace(/\D/g, "")}`,
      });
    }

    const limit = req.query.limit * 1;

    if (
      limit &&
      Number.isInteger(limit) &&
      limit > 0 &&
      history.length > limit
    ) {
      const promises = history.slice(limit * -1).map(async (h) => {
        if (h.isBot) {
          let extra;
          if (h.vehicles.length === 0) {
            extra = await getImagesByVins(extractVins(h.text));
          } else {
            extra = await getImagesByVins(extractVins(h.vehicles.join(" ")));
          }
          return { ...h._doc, ...extra };
        }
        return h;
      });

      const historyWithCarImg = await Promise.all(promises);

      res.status(200).json({ message: "Success!", data: historyWithCarImg });
    } else {
      const promises = history.map(async (h) => {
        if (h.isBot) {
          let extra;
          if (h.vehicles.length === 0) {
            extra = await getImagesByVins(extractVins(h.text));
          } else {
            extra = await getImagesByVins(extractVins(h.vehicles.join(" ")));
          }
          return { ...h._doc, ...extra };
        }
        return h;
      });

      const historyWithCarImg = await Promise.all(promises);

      res.status(200).json({ message: "Success!", data: historyWithCarImg });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const result = await findOne("user", {
      phone_number: `+${req.body.phone_number.replace(/\D/g, "")}`,
      verification_code: req.body.verification_code
        .toUpperCase()
        .replace(/\s/g, ""),
    });

    if (!result) {
      throw new Error("Wrong verification code!");
    }

    if (result.isCodeUsed) {
      throw new Error("Code already used!");
    }

    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const codeCreationTime = new Date(new ObjectId(result._id).getTimestamp());
    if (fiveMinutesAgo - codeCreationTime > 0) {
      throw new Error("Your code has expired!");
    }

    await updateDocument("user", { _id: result._id }, { isCodeUsed: true });

    const jwtToken = generateToken(
      result.phone_number,
      result.verification_code
    );

    res.set("Authorization", jwtToken);
    res.status(200).json({
      message: "Success!",
      user: { phone_number: result.phone_number },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
