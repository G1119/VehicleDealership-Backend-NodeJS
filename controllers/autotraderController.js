const { AUTOTRADER_WEBHOOK_KEY, APP_URL } = require("../config");
const fs = require("fs");
const cryptojs = require("crypto-js");

const {
  updateDocument,
  deleteDocument,
  retrieveStock,
  valuateVehicle,
  retrieveVehicleByRegistration,
  retrieveVehicleByVin,
  retrieveVehicleByVinFromCMS,
  retrieveStockFromCMS,
  calculateMultiDefaultFinance,
  sendHook,
  upsertPineconeVehicle,
  removePineconeVehicles,
} = require("../helpers");

exports.retrieveStock = async (req, res) => {
  try {
    let page = req.query.page;
    let pageSize = req.query.pageSize;

    if (!page || !pageSize) {
      throw new Error("Missing Parameters.");
    }

    if (
      !(
        (!isNaN(pageSize) && pageSize > 0 && pageSize <= 200) ||
        pageSize === "ALL"
      )
    ) {
      throw new Error(
        "Wrong Parameters. pageSize should be a Number that is greater than 0 & less than 200 or 'ALL'."
      );
    }

    if (!(!isNaN(page) && page > 0)) {
      throw new Error(
        "Wrong Parameters. page should be a Number that is greater than 0."
      );
    }

    let result;

    if (pageSize === "ALL") {
      pageSize = 200;
      let total_pages = 1;
      let current_page = 1;
      let results = [];
      while (total_pages >= current_page) {
        const temp = await retrieveStock(current_page, pageSize);
        results = results.concat(temp.results);
        current_page += 1;
        total_pages = temp.total_pages;
      }

      result = { results };
    } else {
      result = await retrieveStock(page, pageSize);
    }

    const defaultFinances = await calculateMultiDefaultFinance(result.results);

    const vehicles = await retrieveStockFromCMS();

    res.status(200).json({
      message: "Success!",
      data: {
        results: result.results.map((vehicle) => {
          const vin = vehicle.vehicle.vin;
          vehicle.vehicle.finance = defaultFinances[vin];
          if (vehicles[vin]) {
            vehicle.media.video.href = vehicles[vin].video;
            vehicle.vehicle.branch = vehicles[vin].branch;
            vehicle.vehicle.service_history = vehicles[vin].service_history;
            vehicle.vehicle.mot_expiry_date = vehicles[vin].mot_expiry_date;
            vehicle.vehicle.last_service_date = vehicles[vin].last_service_date;
            vehicle.vehicle.mileage_at_last_service =
              vehicles[vin].mileage_at_last_service;
            vehicle.vehicle.no_of_keys = vehicles[vin].no_of_keys;
            vehicle.vehicle.sale_type = vehicles[vin].sale_type;
            vehicle.vehicle.no_of_owners = vehicles[vin].no_of_owners;
            vehicle.vehicle.status = vehicles[vin].status;
            vehicle.vehicle.experian_or_hpi_report =
              vehicles[vin].experian_or_hpi_report;
            vehicle.vehicle.service_history_attachment =
              vehicles[vin].service_history_attachment;
          } else {
            vehicle.media.video.href = null;
            vehicle.vehicle.branch = null;
            vehicle.vehicle.service_history = null;
            vehicle.vehicle.mot_expiry_date = null;
            vehicle.vehicle.last_service_date = null;
            vehicle.vehicle.mileage_at_last_service = null;
            vehicle.vehicle.no_of_keys = null;
            vehicle.vehicle.sale_type = null;
            vehicle.vehicle.no_of_owners = null;
            vehicle.vehicle.status = "available";
            vehicle.vehicle.experian_or_hpi_report = null;
            vehicle.vehicle.service_history_attachment = null;
          }
          return vehicle;
        }),
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.valuateVehicle = async (req, res) => {
  try {
    console.log("?####", req.body)
    if (!req.body.name || !req.body.registration || !req.body.miles || !req.body.condition || !req.body.service_history) {
      throw new Error("Missing Parameters.");
    }

    if (!(!isNaN(req.body.miles) && req.body.miles > 0)) {
      throw new Error(
        "Wrong Parameters. miles should be a Number that is bigger than 0."
      );
    }

    const result = await valuateVehicle(
      req.body.registration,
      req.body.miles,
      req.body.condition,
      req.body.service_history
    );

    res.status(200).json({ message: "Success!", data: result });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

exports.retrieveVehicleByRegistration = async (req, res) => {
  try {
    if (!req.body.registration) {
      throw new Error("Missing Parameters.");
    }

    const result = await retrieveVehicleByRegistration(req.body.registration);

    res.status(200).json({ message: "Success!", data: result });
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

    const result = await retrieveVehicleByVin(vin);

    res.status(200).json({ message: "Success!", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.retrieveVehicleByVinFromCMS = async (req, res) => {
  try {
    const { vin } = req.body;
    if (!vin) {
      throw new Error("Missing Parameters.");
    }

    if (vin.length !== 17) {
      throw new Error("Wrong Parameters.");
    }

    const result = await retrieveVehicleByVinFromCMS(vin);

    res.status(200).json({ message: "Success!", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.listenNotification = async (req, res) => {
  try {
    if (!req.headers["autotrader-signature"])
      throw new Error("Missing autotrader-signature");
    
    const { t, v1 } = getValues(req.headers["autotrader-signature"]);
    if (!t || !v1) throw new Error("Missing autotrader-signature");

    console.log("autotrader-signature:", req.headers["autotrader-signature"]);

    const app_v1 = getAutotraderSignature(AUTOTRADER_WEBHOOK_KEY, t, req.body);
    console.log(app_v1);

    if (app_v1 !== v1) {
      throw new Error("Wrong Signature");
    }

    const req_body = JSON.parse(req.body);

    if (req_body.type !== "STOCK_UPDATE") {
      return res.status(200).json({ message: "Success!" });
    }

    const vin = req_body.data.vehicle.vin;

    const url = `/vehicles-for-sale/viewdetail/${`used ${req_body.data.vehicle.make} ${req_body.data.vehicle.model} ${req_body.data.vehicle.derivative}   ${req_body.data.vehicle.transmissionType} ${req_body.data.vehicle.fuelType}`
      .toLowerCase()
      .replace(/[^0-9a-zA-Z \-]/g, "")
      .replace(/\s/g, "-")}/${req_body.data.vehicle.vin}/`;

    const fileName = url.replace(/\//g, "_");

    if (
      req_body.data.adverts.retailAdverts.advertiserAdvert.status ===
        "PUBLISHED" &&
      (req_body.data.metadata.lifecycleState === "FORECOURT" ||
        req_body.data.metadata.lifecycleState === "SALE_IN_PROGRESS")
    ) {
      const defaultFinances = await calculateMultiDefaultFinance([
        req_body.data,
      ]);
      const vehicleCMS = await retrieveVehicleByVinFromCMS(vin);

      const temp = {
        vin,
        registration: req_body.data.vehicle.registration,
        make: req_body.data.vehicle.make,
        model: req_body.data.vehicle.model,
        vehicleType: req_body.data.vehicle.vehicleType,
        bodyType: req_body.data.vehicle.bodyType,
        fuelType: req_body.data.vehicle.fuelType,
        colour: req_body.data.vehicle.standard.colour,
        transmissionType: req_body.data.vehicle.transmissionType,
        odometerReadingMiles: req_body.data.vehicle.odometerReadingMiles || 0,
        price: req_body.data.adverts.forecourtPrice.amountGBP || 0,
        finance: defaultFinances[vin] || 0,
        yearOfManufacture: req_body.data.vehicle.yearOfManufacture || 0,
        //general data
        vehicle: {
          ...req_body.data.vehicle,
          ...{ finance: defaultFinances[vin] },
          ...{ colour: req_body.data.vehicle.standard.colour },
        },
        adverts: {
          ...req_body.data.adverts,
          ...{
            forecourtPriceVatStatus:
              req_body.data.adverts.retailAdverts.vatStatus,
          },
        },
        metadata: req_body.data.metadata,
        features: req_body.data.features,
        media: {
          ...req_body.data.media,
          ...{
            images: req_body.data.media.images.map((image) => {
              return {
                ...image,
                href: image.href.replace("{resize}", "w600h450"),
              };
            }),
          },
        },
        history: req_body.data.history,
        check: req_body.data.check,
      };

      if (vehicleCMS) {
        temp.media.video.href = vehicleCMS.video;
        temp.vehicle.branch = vehicleCMS.branch;
        temp.vehicle.service_history = vehicleCMS.service_history;
        temp.vehicle.mot_expiry_date = vehicleCMS.mot_expiry_date;
        temp.vehicle.last_service_date = vehicleCMS.last_service_date;
        temp.vehicle.mileage_at_last_service =
          vehicleCMS.mileage_at_last_service;
        temp.vehicle.no_of_keys = vehicleCMS.no_of_keys;
        temp.vehicle.sale_type = vehicleCMS.sale_type;
        temp.vehicle.no_of_owners = vehicleCMS.no_of_owners;
        temp.vehicle.status = vehicleCMS.status;
        temp.vehicle.experian_or_hpi_report = vehicleCMS.experian_or_hpi_report;
        temp.vehicle.service_history_attachment =
          vehicleCMS.service_history_attachment;
      } else {
        temp.media.video.href = null;
        temp.vehicle.branch = null;
        temp.vehicle.service_history = null;
        temp.vehicle.mot_expiry_date = null;
        temp.vehicle.last_service_date = null;
        temp.vehicle.mileage_at_last_service = null;
        temp.vehicle.no_of_keys = null;
        temp.vehicle.sale_type = null;
        temp.vehicle.no_of_owners = null;
        temp.vehicle.status = "available";
        temp.vehicle.experian_or_hpi_report = null;
        temp.vehicle.service_history_attachment = null;
      }

      await updateDocument("vehicle", { vin }, temp);
      await upsertPineconeVehicle([temp]);
      const result = await sendHook();

      if (!result)
        throw new Error("Error while sending a notification to a bot engine");
      console.log(vin, "updated");

      return res.status(200).json({ message: "Success!" });
    } else {
      await deleteDocument("vehicle", { vin });
      await removePineconeVehicles(vin);
      const result = await sendHook();
      if (!result)
        throw new Error("Error while sending a notification to a bot engine");
      console.log(vin, "deleted");

      return res.status(200).json({ message: "Success!" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

const getAutotraderSignature = (secretKey, timestamp, body) => {
  // console.log({ secretKey, timestamp, body });

  const value = `${timestamp}.${body}`;
  const hash = cryptojs.HmacSHA256(value, secretKey);
  return hash.toString(cryptojs.enc.Hex);
};

const getValues = (inputString) => {
  const values = {};
  const parts = inputString.split(",");

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    values[key] = value;
  });

  return values;
};
