const { ENQUIRY_HANDLER_USER } = require("../config");
const crypto = require("crypto");

const {
  getAggregate,
  findAndSelect,
  findOne,
  updateDocument,
  getDataSelectWithLimit,
  updateStock,
  sendHook,
  upsertPineconeVehicle,
  updateTotalStock,
} = require("../helpers");

exports.updateTotalStock = async (req, res) => {
  try {
    await updateTotalStock();
    res.status(200).json({ message: "Success!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.retrieveStock = async (req, res) => {
  try {
    let page = req.query.page;
    let pageSize = req.query.pageSize;

    const {
      make,
      model,
      vehicleType,
      bodyType,
      fuelType,
      colour,
      transmissionType,
      mileageMin,
      mileageMax,
      cashMin,
      cashMax,
      financeMin,
      financeMax,
      sort,
    } = req.query;

    let valid_page = false;
    let valid_pageSize = false;

    if (!(!isNaN(pageSize) && pageSize > 0) && pageSize && pageSize !== "ALL") {
      throw new Error(
        "Wrong Parameters. pageSize should be a Number that is greater than 0."
      );
    } else if (pageSize && pageSize !== "ALL") {
      valid_pageSize = true;
    }

    if (!(!isNaN(page) && page > 0) && page) {
      throw new Error(
        "Wrong Parameters. page should be a Number that is greater than 0."
      );
    } else if (page) {
      valid_page = true;
    }

    const filter = {};
    const sortedBy = {};

    if (make) filter.make = { $in: make.split(",") };
    if (model) filter.model = { $in: model.split(",") };
    if (vehicleType) filter.vehicleType = { $in: vehicleType.split(",") };
    if (bodyType) filter.bodyType = { $in: bodyType.split(",") };
    if (fuelType) filter.fuelType = { $in: fuelType.split(",") };
    if (colour) filter.colour = { $in: colour.split(",") };
    if (transmissionType)
      filter.transmissionType = { $in: transmissionType.split(",") };
    if (sort) {
      if (sort === "1") sortedBy.price = 1; //priceH
      if (sort === "2") sortedBy.price = -1; //priceL
      if (sort === "3") sortedBy.finance = 1; //financeH
      if (sort === "4") sortedBy.finance = -1; //financeL
      if (sort === "5") sortedBy.yearOfManufacture = -1; //ageN
      if (sort === "6") sortedBy.yearOfManufacture = 1; //ageO
    }

    if (!(!isNaN(mileageMin) && mileageMin >= 0) && mileageMin) {
      throw new Error(
        "Wrong Parameters. mileageMin should be a Number that is greater than 0."
      );
    } else if (mileageMin) {
      filter.odometerReadingMiles = {};
      filter.odometerReadingMiles.$gte = mileageMin * 1;
    }

    if (!(!isNaN(mileageMax) && mileageMax >= 0) && mileageMax) {
      throw new Error(
        "Wrong Parameters. mileageMax should be a Number that is greater than 0."
      );
    } else if (mileageMax) {
      if (!filter.odometerReadingMiles) filter.odometerReadingMiles = {};
      filter.odometerReadingMiles.$lte = mileageMax * 1;
    }

    if (!(!isNaN(cashMin) && cashMin >= 0) && cashMin) {
      throw new Error(
        "Wrong Parameters. cashMin should be a Number that is greater than 0."
      );
    } else if (cashMin) {
      filter.price = {};
      filter.price.$gte = cashMin * 1;
    }

    if (!(!isNaN(cashMax) && cashMax >= 0) && cashMax) {
      throw new Error(
        "Wrong Parameters. cashMax should be a Number that is greater than 0."
      );
    } else if (cashMax) {
      if (!filter.price) filter.price = {};
      filter.price.$lte = cashMax * 1;
    }

    if (!(!isNaN(financeMin) && financeMin >= 0) && financeMin) {
      throw new Error(
        "Wrong Parameters. financeMin should be a Number that is greater than 0."
      );
    } else if (financeMin) {
      filter.finance = {};
      filter.finance.$gte = financeMin * 1;
    }

    if (!(!isNaN(financeMax) && financeMax >= 0) && financeMax) {
      throw new Error(
        "Wrong Parameters. financeMax should be a Number that is greater than 0."
      );
    } else if (financeMax) {
      if (!filter.finance) filter.finance = {};
      filter.finance.$lte = financeMax * 1;
    }

    const filteredVehicles = await getDataSelectWithLimit(
      "vehicle",
      filter,
      "vehicle price media adverts -_id",
      sortedBy,
      valid_page && valid_pageSize ? (page - 1) * pageSize : null,
      valid_pageSize ? pageSize * 1 : null
    );

    res.status(200).json({
      message: "Success!",
      data: {
        results: filteredVehicles.map((vehicle) => {
          return {
            vehicle: {
              vin: vehicle.vehicle.vin,
              registration: vehicle.vehicle.registration,
              make: vehicle.vehicle.make,
              model: vehicle.vehicle.model,
              vehicleType: vehicle.vehicle.vehicleType,
              bodyType: vehicle.vehicle.bodyType,
              fuelType: vehicle.vehicle.fuelType,
              colour: vehicle.vehicle.colour,
              transmissionType: vehicle.vehicle.transmissionType,
              odometerReadingMiles: vehicle.vehicle.odometerReadingMiles || 0,
              yearOfManufacture: vehicle.vehicle.yearOfManufacture || 0,
              firstRegistrationDate: vehicle.vehicle.firstRegistrationDate,
              derivative: vehicle.vehicle.derivative,
              finance: vehicle.vehicle.finance || 0,
              branch: vehicle.vehicle.branch,
              status: vehicle.vehicle.status,
            },
            adverts: {
              forecourtPrice: { amountGBP: vehicle.price },
              forecourtPriceVatStatus: vehicle.adverts.forecourtPriceVatStatus,
            },
            media: {
              images: vehicle.media.images[0] ? [vehicle.media.images[0]] : [],
            },
          };
        }),
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const results = await findAndSelect(
      "vehicle",
      {},
      "vehicle adverts metadata features media history check -_id"
    );

    res.status(200).json({
      message: "Success!",
      data: {
        results,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.retrieveVehicleByVin = async (req, res) => {
  try {
    const { vin } = req.body;
    if (!vin) {
      throw new Error("Missing Parameters.");
    }

    if (vin.length !== 17) {
      throw new Error("Wrong Parameters.");
    }

    const results = await findAndSelect(
      "vehicle",
      { vin },
      "vehicle adverts metadata features media history check -_id"
    );

    res.status(200).json({
      message: "Success!",
      data: { results, totalResults: results.length },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.retrieveVehiclesByVin = async (req, res) => {
  try {
    const { vins } = req.body;
    if (!(vins instanceof Array)) {
      throw new Error("Missing Parameters.");
    }

    vins.forEach((vin) => {
      if (vin.length !== 17) {
        throw new Error("Wrong Parameters.");
      }
    });

    const results = await getAggregate("vehicle", [
      { $match: { vin: { $in: vins } } },
      {
        $addFields: {
          __order: { $indexOfArray: [vins, "$vin"] },
        },
      },
      { $sort: { __order: 1 } },
      {
        $project: {
          _id: 0,
          vehicle: 1,
          adverts: 1,
          metadata: 1,
          features: 1,
          media: 1,
          history: 1,
          check: 1,
        },
      },
    ]);

    res.status(200).json({
      message: "Success!",
      data: { results, totalResults: results.length },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const result = await updateStock();

    if (!result) throw new Error("error");

    res.status(200).json({
      message: "Success!",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.listenNotification = async (req, res) => {
  try {
    if (!req.headers["cms-signature"]) {
      throw new Error("Missing cms-signature");
    }

    const vehicle = req.body;
    const id_regex = /<id>(.*?)<\/id>/s;
    const id_match = vehicle.match(id_regex);
    let id = "";

    if (id_match && id_match.length > 1) {
      id = id_match[1] || "";
    }

    if (!id) {
      throw new Error("Invalid vehicle information");
    }

    const time_regex = /<time>(.*?)<\/time>/s;
    const time_match = vehicle.match(time_regex);
    let time = "";

    if (time_match && time_match.length > 1) {
      time = time_match[1] || "";
    }

    if (!time) {
      throw new Error("Invalid vehicle information");
    }

    if (
      req.headers["cms-signature"] !==
      crypto.createHash("md5").update(`${id}${time}`).digest("hex")
    ) {
      throw new Error("Incorrect signature");
    }

    let vin = "";

    //vin
    const vin_regex = /<vin>(.*?)<\/vin>/s;
    const vin_match = vehicle.match(vin_regex);

    if (vin_match && vin_match.length > 1) {
      if (vin_match[1]) vin = vin_match[1];
    }

    if (!vin) throw new Error("Invalid vin");

    const temp = await findOne("vehicle", {
      vin,
    });

    if (!temp) throw new Error("Not found the vehicle with the vin");

    //video
    const video_regex = /<video>(.*?)<\/video>/s;
    const video_match = vehicle.match(video_regex);

    if (video_match && video_match.length > 1) {
      temp.media.video.href = video_match[1] || "There is no video";
    } else {
      temp.media.video.href = "There is no video";
    }

    //branch office
    const branch_regex = /<branch>(.*?)<\/branch>/s;
    const branch_match = vehicle.match(branch_regex);

    if (branch_match && branch_match.length > 1) {
      temp.vehicle.branch = branch_match[1] || "There is no branch";
    } else {
      temp.vehicle.branch = "There is no branch";
    }

    //service history
    const service_history_regex = /<service_history>(.*?)<\/service_history>/s;
    const service_history_match = vehicle.match(service_history_regex);

    if (service_history_match && service_history_match.length > 1) {
      temp.vehicle.service_history =
        service_history_match[1] || "There is no service history";
    } else {
      temp.vehicle.service_history = "There is no service history";
    }

    //mot expiry date
    const mot_expiry_date_regex = /<mot_expiry_date>(.*?)<\/mot_expiry_date>/s;
    const mot_expiry_date_match = vehicle.match(mot_expiry_date_regex);

    if (mot_expiry_date_match && mot_expiry_date_match.length > 1) {
      temp.vehicle.mot_expiry_date =
        mot_expiry_date_match[1] || "There is no mot expiry date";
    } else {
      temp.vehicle.mot_expiry_date = "There is no mot expiry date";
    }

    //last service date
    const last_service_date_regex =
      /<last_service_date>(.*?)<\/last_service_date>/s;
    const last_service_date_match = vehicle.match(last_service_date_regex);

    if (last_service_date_match && last_service_date_match.length > 1) {
      temp.vehicle.last_service_date =
        last_service_date_match[1] || "There is no last service date";
    } else {
      temp.vehicle.last_service_date = "There is no last service date";
    }

    //mileage at last service
    const mileage_at_last_service_regex =
      /<mileage_at_last_service>(.*?)<\/mileage_at_last_service>/s;
    const mileage_at_last_service_match = vehicle.match(
      mileage_at_last_service_regex
    );

    if (
      mileage_at_last_service_match &&
      mileage_at_last_service_match.length > 1
    ) {
      temp.vehicle.mileage_at_last_service =
        mileage_at_last_service_match[1] ||
        "There is no mileage at last service";
    } else {
      temp.vehicle.mileage_at_last_service =
        "There is no mileage at last service";
    }

    //number of keys
    const no_of_keys_regex = /<no_of_keys>(.*?)<\/no_of_keys>/s;
    const no_of_keys_match = vehicle.match(no_of_keys_regex);

    if (no_of_keys_match && no_of_keys_match.length > 1) {
      temp.vehicle.no_of_keys = no_of_keys_match[1] * 1 || 0;
    } else {
      temp.vehicle.no_of_keys = 0;
    }

    //sale type
    const sale_type_regex = /<sale_type>(.*?)<\/sale_type>/s;
    const sale_type_match = vehicle.match(sale_type_regex);

    if (sale_type_match && sale_type_match.length > 1) {
      temp.vehicle.sale_type = sale_type_match[1] || "";
    } else {
      temp.vehicle.sale_type = "";
    }

    //number of owners
    const no_of_owners_regex = /<no_of_owners>(.*?)<\/no_of_owners>/s;
    const no_of_owners_match = vehicle.match(no_of_owners_regex);

    if (no_of_owners_match && no_of_owners_match.length > 1) {
      temp.vehicle.no_of_owners = no_of_owners_match[1] * 1 || 0;
    } else {
      temp.vehicle.no_of_owners = 0;
    }

    //experian or hpi report
    const experian_or_hpi_report_regex =
      /<experian_or_hpi_report>(.*?)<\/experian_or_hpi_report>/s;
    const experian_or_hpi_report_match = vehicle.match(
      experian_or_hpi_report_regex
    );

    if (
      experian_or_hpi_report_match &&
      experian_or_hpi_report_match.length > 1
    ) {
      temp.vehicle.experian_or_hpi_report =
        encodeURI(experian_or_hpi_report_match[1]) ||
        "There is no Experian or HPI report";
    } else {
      temp.vehicle.experian_or_hpi_report =
        "There is no Experian or HPI report";
    }

    //service history attachment
    const service_history_attachment_regex =
      /<service_history_attachment>(.*?)<\/service_history_attachment>/s;
    const service_history_attachment_match = vehicle.match(
      service_history_attachment_regex
    );

    if (
      service_history_attachment_match &&
      service_history_attachment_match.length > 1
    ) {
      temp.vehicle.service_history_attachment =
        encodeURI(service_history_attachment_match[1]) ||
        "There is no service history attachment";
    } else {
      temp.vehicle.service_history_attachment =
        "There is no service history attachment";
    }

    //status for sales [availabe, reserved, sold]
    const status_regex = /<status>(.*?)<\/status>/s;
    const status_match = vehicle.match(status_regex);

    if (status_match && status_match.length > 1) {
      temp.vehicle.status = status_match[1] || "available";
    } else {
      temp.vehicle.status = "available";
    }

    await updateDocument("vehicle", { vin }, temp);
    await upsertPineconeVehicle([temp]);
    const result = await sendHook();

    if (!result)
      throw new Error("Error while sending a notification to a bot engine");
    console.log(vin, "updated");

    return res.status(200).json({ message: "Success!" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};
