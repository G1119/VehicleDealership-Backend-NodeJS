const { calculateFinance, findOneAndSelect } = require("../helpers");

exports.calculate = async (req, res) => {
  try {
    const vin = req.query.vin;
    if (!vin) {
      throw new Error("Missing vin");
    }

    const vehicle = await findOneAndSelect(
      "vehicle",
      { vin },
      "vehicle adverts odometerReadingMiles price"
    );

    if (!vehicle) throw new Error("Couldn't found the vehicle.");

    const cashPrice = vehicle.price;

    if (cashPrice < 2500) {
      throw new Error("Cash price is less than £2500.");
    }

    const currentMileage = vehicle.odometerReadingMiles;

    const registrationDate = vehicle.vehicle.firstRegistrationDate;

    const term = req.query.term * 1;

    if (!(term && Number.isInteger(term) && term > 0 && 60 >= term && term >= 36)) {
      throw new Error("The value of term is incorrect");
    }

    const deposit = req.query.deposit * 1;

    if (!(!isNaN(deposit) && Number.isInteger(deposit) && deposit >= 0)) {
      throw new Error("The value of deposit is incorrect");
    }

    const depositType = req.query.depositType || "Amount";

    if (!["Amount", "Percentage"].includes(depositType)) {
      throw new Error("The value of depositType is incorrect");
    }

    const result = await calculateFinance(
      term,
      deposit,
      vin,
      cashPrice,
      currentMileage,
      depositType,
      registrationDate
    );

    res.status(200).json({
      message: "Success!",
      data: {
        Apr: result.Quote.Apr,
        RateOfInterest: result.Quote.RateOfInterest,
        RegularPayment: result.Quote.RegularPayment,
        AllInclusiveRegularPayment: result.Quote.AllInclusiveRegularPayment,
        TotalAmountPayableExcludingContributions:
          result.Quote.TotalAmountPayableExcludingContributions,
        Term: result.Quote.Term,
        Deposit: result.Quote.Deposit,
        Balance: result.Quote.Balance,
        vatStatus: vehicle.adverts.forecourtPriceVatStatus === "Ex VAT",
        vatPrice:
          vehicle.adverts.forecourtPriceVatStatus === "Ex VAT"
            ? vehicle.price * 0.2
            : 0,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getLimitation = async (req, res) => {
  try {
    const vin = req.query.vin;
    if (!vin) {
      throw new Error("Missing vin");
    }

    const vehicle = await findOneAndSelect(
      "vehicle",
      { vin },
      "vehicle adverts odometerReadingMiles price"
    );

    if (!vehicle) throw new Error("Couldn't found the vehicle.");

    const cashPrice = vehicle.price;

    if (cashPrice < 2500) {
      throw new Error("Cash price is less than £2500.");
    }

    const currentMileage = vehicle.odometerReadingMiles;

    const registrationDate = vehicle.vehicle.firstRegistrationDate;

    const min_term_and_max_deposit = await calculateFinance(
      1,
      99,
      vin,
      cashPrice,
      currentMileage,
      "Percentage",
      registrationDate
    );

    console.log(min_term_and_max_deposit.Notifications.Public);

    const max_term_and_min_deposit = await calculateFinance(
      61,
      0,
      vin,
      cashPrice,
      currentMileage,
      "Percentage",
      registrationDate
    );

    console.log(max_term_and_min_deposit.Notifications.Public);

    const limit = {
      deposit_max: 100000,
      deposit_min: 0,
      term_max: 60,
      term_min: 12,
    };

    [
      ...min_term_and_max_deposit.Notifications.Public,
      ...max_term_and_min_deposit.Notifications.Public,
    ].forEach((notification) => {
      if (notification.Code === "8") {
        // Remove the currency symbol and commas from the value
        const numericValue = notification.Value.replace(/[^0-9.-]+/g, "");

        // Parse the numeric value as a float and round it to eliminate decimal places
        const floatValue = parseFloat(numericValue);
        const roundedValue = Math.round(floatValue);

        // Convert the rounded value to an integer
        const integerValue = parseInt(roundedValue);
        limit.deposit_max = integerValue;
      } else if (notification.Code === "5") {
        limit.term_max = notification.Value * 1;
      } else if (notification.Code === "3") {
        limit.term_min = notification.Value * 1;
      }
    });

    res.status(200).json({
      message: "Success!",
      data: limit,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
