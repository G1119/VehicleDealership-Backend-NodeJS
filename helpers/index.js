const Models = require("../models");
const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require("axios");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {
  AUTOTRADER_API,
  AUTOTRADER_KEY,
  AUTOTRADER_SECRET,
  ADVERTISER_ID,
  AUTOTRADER_WEBHOOK_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  UK_PHONENUMBER,
  US_PHONENUMBER,
  BOT_API,
  BOT_API_DEMO,
  CMS_APP_URL,
  JWT_SECRET,
  EXPIRES_IN,
  ADMIN_KEY,
  CMS_API_SEARCH_ENDPOINT,
  CMS_API_RESERVE_ENDPOINT,
  CMS_KEY,
  FINANCE_API_ENDPOINT,
  FINANCE_KEY,
  SMTP_USER,
  SMTP_PASSWORD,
  GOOGLE_MAP_API_KEY,
  ENQUIRY_HANDLER_USER,
  CHATBOT_KEY
} = require("../config");


const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const find = async (modelDb, queryObj) =>
  await Models[modelDb].find(queryObj).exec();

const findAndSelect = async (modelDb, queryObj, selectQuery) =>
  await Models[modelDb].find(queryObj).select(selectQuery).exec();

const findOne = async (modelDb, queryObj) =>
  await Models[modelDb].findOne(queryObj).exec();

const findOneAndSelect = async (modelDb, queryObj, selectQuery) =>
  await Models[modelDb].findOne(queryObj).select(selectQuery).exec();

const insertNewDocument = async (modelDb, storeObj) => {
  let data = new Models[modelDb](storeObj);
  return await data.save();
};

async function aa() {
  let users = {}
  const ttt = await find("chatHistory");
  ttt.map(item => {
    const name = item?.state.user_contact_info?.name
    const email = item?.state.user_contact_info["e-mail"]
    const phone = item?.state.user_contact_info?.number
    const postcode = item?.state.user_location_info?.postcode
    if(!users.hasOwnProperty(name)) users[name] = {email: '', phone: '', postcode: ''}
    users[name].email = users[name].email || email
    users[name].phone = users[name].phone || phone
    users[name].postcode = users[name].postcode || postcode
    console.log(phone)
  })
  var str = ''
  Object.keys(users).map(name => str += name+','+users[name].email + ','+users[name].phone+','+users[name].postcode+'\r\n')
  fs.writeFile('users.csv', str, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
}
aa()

const updateDocument = async (modelDb, updateQuery, setQuery) =>
  await Models[modelDb].findOneAndUpdate(
    updateQuery,
    { $set: setQuery },
    { new: true, upsert: true }
  );

const upsertManyDocuments = async (modelDb, key, documents) =>
  await Models[modelDb].bulkWrite(
    documents.map((document) => {
      return {
        updateOne: {
          filter: { [key]: document[key] },
          update: document,
          upsert: true,
        },
      };
    })
  );

const deleteAllDocuments = async (modelDb) =>
  await Models[modelDb].deleteMany({}).exec();

const customUpdate = async (modelDb, updateQuery, setQuery) =>
  await Models[modelDb].updateOne(updateQuery, setQuery);

const pushIntoArray = async (modelDb, updateQuery, setQuery) =>
  await Models[modelDb].findOneAndUpdate(
    updateQuery,
    { $addToSet: setQuery },
    { new: true }
  );

const deleteDocument = async (modelDb, deleteQuery) =>
  await Models[modelDb].deleteOne(deleteQuery);

const findOneAndPopulate = async (
  modelDb,
  searchQuery,
  populateQuery,
  selectQuery
) =>
  await Models[modelDb]
    .findOne(searchQuery)
    .populate({ path: populateQuery, select: selectQuery })
    .lean();

const findAndPopulate = async (
  modelDb,
  searchQuery,
  populateQuery,
  selectQuery
) =>
  await Models[modelDb]
    .find(searchQuery)
    .populate({ path: populateQuery, select: selectQuery })
    .lean();

const findPopulateSortAndLimit = async (
  modelDb,
  searchQuery,
  populateQuery,
  selectQuery,
  sortedBy,
  skip,
  limit
) =>
  await Models[modelDb]
    .find(searchQuery)
    .populate({ path: populateQuery, select: selectQuery })
    .sort(sortedBy)
    .skip(skip)
    .limit(limit)
    .lean();

const findSliceAndPopulate = async (
  modelDb,
  searchQuery,
  sliceQuery,
  populateQuery,
  selectQuery
) =>
  await Models[modelDb]
    .find(searchQuery, sliceQuery)
    .populate({ path: populateQuery, select: selectQuery })
    .lean();

const findAndPopulateNested = async (modelDb, searchQuery, populate) =>
  await Models[modelDb].find(searchQuery).populate(populate).lean();

const findSliceAndPopulateNested = async (
  modelDb,
  searchQuery,
  sliceQuery,
  populate
) =>
  await Models[modelDb].find(searchQuery, sliceQuery).populate(populate).lean();

const getAggregate = async (modelDb, aggregateQuery) =>
  await Models[modelDb].aggregate(aggregateQuery);

const findOneSliceAndPopulate = async (
  modelDb,
  searchQuery,
  sliceQuery,
  populateQuery,
  selectQuery
) =>
  await Models[modelDb]
    .findOne(searchQuery, sliceQuery)
    .populate({ path: populateQuery, select: selectQuery })
    .lean();

const findOneSliceAndCustomPopulate = async (
  modelDb,
  searchQuery,
  sliceQuery,
  customQuery
) =>
  await Models[modelDb]
    .findOne(searchQuery, sliceQuery)
    .populate(customQuery)
    .lean();

const getDataWithLimit = async (modelDb, searchQuery, sortedBy, skip, limit) =>
  await Models[modelDb]
    .find(searchQuery)
    .sort(sortedBy)
    .skip(skip)
    .limit(limit)
    .exec();

const getDataSelectWithLimit = async (
  modelDb,
  searchQuery,
  selectQuery,
  sortedBy,
  skip,
  limit
) =>
  await Models[modelDb]
    .find(searchQuery)
    .select(selectQuery)
    .sort(sortedBy)
    .skip(skip)
    .limit(limit)
    .exec();

let autotrader_token = {
  value: "",
  updatedAt: Date.now(),
};

const authenticate = async () => {
  try {
    const currentTimestamp = Date.now();
    if (
      currentTimestamp - autotrader_token.updatedAt > 10 * 60 * 1000 ||
      !autotrader_token.value
    ) {
      const response = await axios.post(
        `https://${AUTOTRADER_API}/authenticate`,
        {
          key: AUTOTRADER_KEY,
          secret: AUTOTRADER_SECRET,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      autotrader_token = {
        value: response.data.access_token,
        updatedAt: Date.now(),
      };

      return response.data.access_token;
    } else {
      return autotrader_token.value;
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message);
  }
};

const retrieveStockFromCMS = async () => {
  try {
    let vehicles = [];

    let response = await axios.post(
      CMS_API_SEARCH_ENDPOINT,
      {
        token: CMS_KEY,
        limit: 200,
        page: 1,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const xmlData = response.data;

    let regex;
    let match;

    regex = /<total_pages>(.*?)<\/total_pages>/s;
    match = xmlData.match(regex);
    let total_pages;

    if (match && match.length > 1) {
      total_pages = match[1] * 1;
    } else {
      total_pages = 1;
    }

    match = null;
    regex = /<status>(.*?)<\/status>/s;

    match = xmlData.match(regex);
    let status;

    if (match && match.length > 1) {
      status = match[1];
    } else {
      status = "error";
    }

    if (status !== "success") {
      throw new Error(`CMS API ${status}`);
    } else {
      match = null;
      regex = /<vehicle>([\s\S]*?)<\/vehicle>/g;

      match = xmlData.match(regex);

      if (match && match.length > 0) {
        vehicles = match.map((m) =>
          m.replace("<vehicle>", "").replace("</vehicle>", "")
        );
      } else {
        vehicles = [];
      }

      if (total_pages > 1) {
        for (let i = 2; i <= total_pages; i++) {
          response = await axios.post(
            CMS_API_SEARCH_ENDPOINT,
            {
              token: CMS_KEY,
              limit: 200,
              page: i,
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );

          match = null;
          regex = /<vehicle>([\s\S]*?)<\/vehicle>/g;

          match = response.data.match(regex);

          if (match && match.length > 0) {
            vehicles = [
              ...vehicles,
              ...match.map((m) =>
                m.replace("<vehicle>", "").replace("</vehicle>", "")
              ),
            ];
          }
        }
      }
    }

    const cms_vehicles = {};

    vehicles.forEach((vehicle) => {
      const vehicle_extra_info = {};

      //video
      const video_regex = /<video>(.*?)<\/video>/s;
      const video_match = vehicle.match(video_regex);

      if (video_match && video_match.length > 1) {
        vehicle_extra_info.video = video_match[1] || "There is no video";
      } else {
        vehicle_extra_info.video = "There is no video";
      }

      //branch office
      const branch_regex = /<branch>(.*?)<\/branch>/s;
      const branch_match = vehicle.match(branch_regex);

      if (branch_match && branch_match.length > 1) {
        vehicle_extra_info.branch = branch_match[1] || "There is no branch";
      } else {
        vehicle_extra_info.branch = "There is no branch";
      }

      //service history
      const service_history_regex =
        /<service_history>(.*?)<\/service_history>/s;
      const service_history_match = vehicle.match(service_history_regex);

      if (service_history_match && service_history_match.length > 1) {
        vehicle_extra_info.service_history =
          service_history_match[1] || "There is no service history";
      } else {
        vehicle_extra_info.service_history = "There is no service history";
      }

      //mot expiry date
      const mot_expiry_date_regex =
        /<mot_expiry_date>(.*?)<\/mot_expiry_date>/s;
      const mot_expiry_date_match = vehicle.match(mot_expiry_date_regex);

      if (mot_expiry_date_match && mot_expiry_date_match.length > 1) {
        vehicle_extra_info.mot_expiry_date =
          mot_expiry_date_match[1] || "There is no mot expiry date";
      } else {
        vehicle_extra_info.mot_expiry_date = "There is no mot expiry date";
      }

      //last service date
      const last_service_date_regex =
        /<last_service_date>(.*?)<\/last_service_date>/s;
      const last_service_date_match = vehicle.match(last_service_date_regex);

      if (last_service_date_match && last_service_date_match.length > 1) {
        vehicle_extra_info.last_service_date =
          last_service_date_match[1] || "There is no last service date";
      } else {
        vehicle_extra_info.last_service_date = "There is no last service date";
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
        vehicle_extra_info.mileage_at_last_service =
          mileage_at_last_service_match[1] ||
          "There is no mileage at last service";
      } else {
        vehicle_extra_info.mileage_at_last_service =
          "There is no mileage at last service";
      }

      //number of keys
      const no_of_keys_regex = /<no_of_keys>(.*?)<\/no_of_keys>/s;
      const no_of_keys_match = vehicle.match(no_of_keys_regex);

      if (no_of_keys_match && no_of_keys_match.length > 1) {
        vehicle_extra_info.no_of_keys = no_of_keys_match[1] * 1 || 0;
      } else {
        vehicle_extra_info.no_of_keys = 0;
      }

      //sale type
      const sale_type_regex = /<sale_type>(.*?)<\/sale_type>/s;
      const sale_type_match = vehicle.match(sale_type_regex);

      if (sale_type_match && sale_type_match.length > 1) {
        vehicle_extra_info.sale_type = sale_type_match[1] || "";
      } else {
        vehicle_extra_info.sale_type = "";
      }

      //number of owners
      const no_of_owners_regex = /<no_of_owners>(.*?)<\/no_of_owners>/s;
      const no_of_owners_match = vehicle.match(no_of_owners_regex);

      if (no_of_owners_match && no_of_owners_match.length > 1) {
        vehicle_extra_info.no_of_owners = no_of_owners_match[1] * 1 || 0;
      } else {
        vehicle_extra_info.no_of_owners = 0;
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
        vehicle_extra_info.experian_or_hpi_report =
          encodeURI(experian_or_hpi_report_match[1]) ||
          "There is no Experian or HPI report";
      } else {
        vehicle_extra_info.experian_or_hpi_report =
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
        vehicle_extra_info.service_history_attachment =
          encodeURI(service_history_attachment_match[1]) ||
          "There is no service history attachment";
      } else {
        vehicle_extra_info.service_history_attachment =
          "There is no service history attachment";
      }

      //status for sales [availabe, reserved, sold]
      const status_regex = /<status>(.*?)<\/status>/s;
      const status_match = vehicle.match(status_regex);

      if (status_match && status_match.length > 1) {
        vehicle_extra_info.status = status_match[1] || "available";
      } else {
        vehicle_extra_info.status = "available";
      }

      //vin
      const vin_regex = /<vin>(.*?)<\/vin>/s;
      const vin_match = vehicle.match(vin_regex);

      if (vin_match && vin_match.length > 1) {
        if (vin_match[1]) cms_vehicles[vin_match[1]] = vehicle_extra_info;
      }
    });

    return cms_vehicles;
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message);
  }
};

const retrieveStock = async (page, pageSize) => {
  try {
    const token = await authenticate();

    const response = await axios.get(
      `https://${AUTOTRADER_API}/stock?advertiserId=${ADVERTISER_ID}&page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      results: response.data.results.filter((vehicle) => {
        return (
          vehicle.adverts.retailAdverts.advertiserAdvert.status ===
            "PUBLISHED" &&
          (vehicle.metadata.lifecycleState === "FORECOURT" ||
            vehicle.metadata.lifecycleState === "SALE_IN_PROGRESS")
        );
      }),
      total_pages: ~~(response.data.totalResults / pageSize) + 1,
    };
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.messages[0].message);
    }
    throw new Error(error.message);
  }
};

const retrieveVehicleByRegistration = async (registration) => {
  try {
    const token = await authenticate();
    const response_vehicle = await axios.get(
      `https://${AUTOTRADER_API}/vehicles?advertiserId=${ADVERTISER_ID}&registration=${registration.replace(
        /\s/g,
        ""
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response_vehicle.data;
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.messages[0].message);
    }
    throw new Error(error.message);
  }
};

const retrieveVehicleByVin = async (vin) => {
  try {
    const token = await authenticate();
    const response_vehicle = await axios.get(
      `https://${AUTOTRADER_API}/stock?vin=${vin.toUpperCase()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response_vehicle.data;
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.messages[0].message);
    }
    throw new Error(error.message);
  }
};

const retrieveVehicleByVinFromCMS = async (vin) => {
  try {
    let vehicles = [];

    let response = await axios.post(
      CMS_API_SEARCH_ENDPOINT,
      {
        token: CMS_KEY,
        page: 1,
        vin: vin.toUpperCase(),
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const xmlData = response.data;

    let regex;
    let match;

    regex = /<status>(.*?)<\/status>/s;
    match = xmlData.match(regex);
    let status;

    if (match && match.length > 1) {
      status = match[1];
    } else {
      status = "error";
    }

    if (status !== "success") {
      throw new Error(`CMS API ${status}`);
    } else {
      match = null;
      regex = /<vehicle>([\s\S]*?)<\/vehicle>/g;

      match = xmlData.match(regex);

      if (match && match.length > 0) {
        vehicles = match.map((m) =>
          m.replace("<vehicle>", "").replace("</vehicle>", "")
        );
      } else {
        vehicles = [];
      }
    }

    let cms_vehicles = null;

    vehicles.forEach((vehicle) => {
      const vehicle_extra_info = {};

      //video
      const video_regex = /<video>(.*?)<\/video>/s;
      const video_match = vehicle.match(video_regex);

      if (video_match && video_match.length > 1) {
        vehicle_extra_info.video = video_match[1] || "There is no video";
      } else {
        vehicle_extra_info.video = "There is no video";
      }

      //branch office
      const branch_regex = /<branch>(.*?)<\/branch>/s;
      const branch_match = vehicle.match(branch_regex);

      if (branch_match && branch_match.length > 1) {
        vehicle_extra_info.branch = branch_match[1] || "There is no branch";
      } else {
        vehicle_extra_info.branch = "There is no branch";
      }

      //service history
      const service_history_regex =
        /<service_history>(.*?)<\/service_history>/s;
      const service_history_match = vehicle.match(service_history_regex);

      if (service_history_match && service_history_match.length > 1) {
        vehicle_extra_info.service_history =
          service_history_match[1] || "There is no service history";
      } else {
        vehicle_extra_info.service_history = "There is no service history";
      }

      //mot expiry date
      const mot_expiry_date_regex =
        /<mot_expiry_date>(.*?)<\/mot_expiry_date>/s;
      const mot_expiry_date_match = vehicle.match(mot_expiry_date_regex);

      if (mot_expiry_date_match && mot_expiry_date_match.length > 1) {
        vehicle_extra_info.mot_expiry_date =
          mot_expiry_date_match[1] || "There is no mot expiry date";
      } else {
        vehicle_extra_info.mot_expiry_date = "There is no mot expiry date";
      }

      //last service date
      const last_service_date_regex =
        /<last_service_date>(.*?)<\/last_service_date>/s;
      const last_service_date_match = vehicle.match(last_service_date_regex);

      if (last_service_date_match && last_service_date_match.length > 1) {
        vehicle_extra_info.last_service_date =
          last_service_date_match[1] || "There is no last service date";
      } else {
        vehicle_extra_info.last_service_date = "There is no last service date";
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
        vehicle_extra_info.mileage_at_last_service =
          mileage_at_last_service_match[1] ||
          "There is no mileage at last service";
      } else {
        vehicle_extra_info.mileage_at_last_service =
          "There is no mileage at last service";
      }

      //number of keys
      const no_of_keys_regex = /<no_of_keys>(.*?)<\/no_of_keys>/s;
      const no_of_keys_match = vehicle.match(no_of_keys_regex);

      if (no_of_keys_match && no_of_keys_match.length > 1) {
        vehicle_extra_info.no_of_keys = no_of_keys_match[1] * 1 || 0;
      } else {
        vehicle_extra_info.no_of_keys = 0;
      }

      //sale type
      const sale_type_regex = /<sale_type>(.*?)<\/sale_type>/s;
      const sale_type_match = vehicle.match(sale_type_regex);

      if (sale_type_match && sale_type_match.length > 1) {
        vehicle_extra_info.sale_type = sale_type_match[1] || "";
      } else {
        vehicle_extra_info.sale_type = "";
      }

      //number of owners
      const no_of_owners_regex = /<no_of_owners>(.*?)<\/no_of_owners>/s;
      const no_of_owners_match = vehicle.match(no_of_owners_regex);

      if (no_of_owners_match && no_of_owners_match.length > 1) {
        vehicle_extra_info.no_of_owners = no_of_owners_match[1] * 1 || 0;
      } else {
        vehicle_extra_info.no_of_owners = 0;
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
        vehicle_extra_info.experian_or_hpi_report =
          encodeURI(experian_or_hpi_report_match[1]) ||
          "There is no Experian or HPI report";
      } else {
        vehicle_extra_info.experian_or_hpi_report =
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
        vehicle_extra_info.service_history_attachment =
          encodeURI(service_history_attachment_match[1]) ||
          "There is no service history attachment";
      } else {
        vehicle_extra_info.service_history_attachment =
          "There is no service history attachment";
      }

      //status for sales [availabe, reserved, sold]
      const status_regex = /<status>(.*?)<\/status>/s;
      const status_match = vehicle.match(status_regex);

      if (status_match && status_match.length > 1) {
        vehicle_extra_info.status = status_match[1] || "available";
      } else {
        vehicle_extra_info.status = "available";
      }

      //vin
      const vin_regex = /<vin>(.*?)<\/vin>/s;
      const vin_match = vehicle.match(vin_regex);

      if (vin_match && vin_match.length > 1) {
        if (vin_match[1]) cms_vehicles = vehicle_extra_info;
      }
    });

    return cms_vehicles;
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message);
  }
};

const valuateVehicle = async (
  registration,
  miles,
  condition,
  serviceHistory
) => {
  let token, response_vehicle, response_valuation;
  try {
    token = await authenticate();
    response_vehicle = await axios.get(
      `https://${AUTOTRADER_API}/vehicles?advertiserId=${ADVERTISER_ID}&features=true&registration=${registration.replace(
        /\s/g,
        ""
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`Error: ${registration} ${miles} ${error}`);
    throw new Error(
      "Sorry, we couldn't find your vehicle.\nCan you please double check the registration?"
    );
  }

  try {
    token = await authenticate();
    response_valuation = await axios.post(
      `https://${AUTOTRADER_API}/valuations`,
      {
        vehicle: {
          derivativeId: response_vehicle.data.vehicle.derivativeId,
          firstRegistrationDate:
            response_vehicle.data.vehicle.firstRegistrationDate,
          odometerReadingMiles: miles,
        },
        // features: response_vehicle.data.features.map((feature) => {
        //   return {
        //     name: feature.name,
        //   };
        // }),
        // conditionRating: "Good",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response_valuation.data.valuations) {
      console.log(response_valuation.data);
      throw new Error("Failed valuation");
    }
  } catch (error) {
    console.error(`Error: ${registration} ${miles} ${error}`);
    throw new Error(
      "Sorry, we're unable to value this vehicle\nThis may be because:\n\nIt is not a car or van\nIt has been recently registered\nIt has zero miles\nIt is car over 15 years old or a van over 10 years old\nIt is left hand drive\nIt is an unusual model\nIt is a Chassis Cab van\nIt has a personalised registration plate\nOur systems don't recognise it"
    );
  }

  console.log(response_valuation.data.valuations);

  const retailPrice =
    response_valuation.data.valuations.retail.amountGBP ||
    response_valuation.data.valuations.retail.amountExcludingVatGBP;

  if (retailPrice <= 2000) {
    console.log(response_valuation.data.valuations);
    throw new Error(
      "Can you please double check the details, mileage and registration?"
    );
  } else if (retailPrice <= 5000) {
    response_valuation.data.valuations.trade.amountGBP = retailPrice - 2000;
  } else if (retailPrice <= 10000) {
    response_valuation.data.valuations.trade.amountGBP =
      retailPrice - Math.max(2000, retailPrice * 0.25);
  } else if (retailPrice <= 15000) {
    response_valuation.data.valuations.trade.amountGBP =
      retailPrice - Math.max(2000, retailPrice * 0.2);
  } else {
    response_valuation.data.valuations.trade.amountGBP =
      retailPrice - Math.min(Math.max(2000, retailPrice * 0.17), 10000);
  }

  console.log("data", { registration, miles, condition, serviceHistory });

  const conditions = {
    Excellent: 0,
    Good: 5,
    Average: 10,
    "Below Average": 15,
    Poor: 20,
  };

  const serviceHistories = {
    "Full History": 0,
    "Part History": 5,
    "No History": 10,
  };

  const deduction =
    (retailPrice *
      ((conditions[condition] || 0) +
        (serviceHistories[serviceHistory] || 0))) /
    100;

  console.log(
    deduction,
    (conditions[condition] || 0) + (serviceHistories[serviceHistory] || 0)
  );

  if (response_valuation.data.valuations.trade.amountGBP <= deduction) {
    console.log({
      trade: response_valuation.data.valuations.trade.amountGBP,
      deduction,
    });
    throw new Error(
      "Sorry, Your vehicle's service history and condition information does not allow me to assess its value. I will definitely pass your vehicle's information to our sales team."
    );
  } else {
    response_valuation.data.valuations.trade.amountGBP -= deduction;
  }

  response_valuation.data.valuations.trade.amountGBP = Math.floor(
    response_valuation.data.valuations.trade.amountGBP
  );

  response_valuation.data.vehicle = response_vehicle.data.vehicle;

  return response_valuation.data;
};

const canReceiveSMS = (phoneNumber) => {
  return client.lookups
    .phoneNumbers(phoneNumber)
    .fetch({ type: "carrier" })
    .then((carrier) => true)
    .catch((error) => false);
};

const canReceiveWhatsapp = (phoneNumber) => {
  return client.lookups
    .phoneNumbers(phoneNumber)
    .fetch()
    .then((phone_number) => true)
    .catch((error) => false);
};

const sendMessage = async (body, to, from) => {
  try {
    const messageChunks = [];
    if (body.length > 1600) {
      const words = body.split(" ").filter((word) => word !== "");

      let chuck = "";

      for (let i = 0; i < words.length; i++) {
        if (words[i].length > 1600) {
          //due to space between words 1599 instead of 1600
          messageChunks.push(
            `${chuck} ${words[i].substring(0, 1600 - chuck.length - 1)}`
          );

          let index = 1600 - chuck.length - 1;
          while (index < words[i].length) {
            messageChunks.push(words[i].slice(index, index + 1600));
            index += 1600;
          }

          chuck = "";
        } else {
          const temp = [chuck, words[i]].join(" ");

          if (temp.length > 1600) {
            messageChunks.push(chuck);
            chuck = words[i];
          } else {
            chuck = temp;
          }

          if (i === words.length - 1) {
            messageChunks.push(chuck);
          }
        }
      }
    } else {
      messageChunks.push(body);
    }

    console.log(
      "---",
      from ||
        (to.startsWith("+1")
          ? US_PHONENUMBER
          : `${to.startsWith("whatsapp:") ? "whatsapp:" : ""}${UK_PHONENUMBER}`)
    );

    for (let i = 0; i < messageChunks.length; i++) {
      const message = await client.messages.create({
        to,
        from:
          from ||
          (to.startsWith("+1")
            ? US_PHONENUMBER
            : `${
                to.startsWith("whatsapp:") ? "whatsapp:" : ""
              }${UK_PHONENUMBER}`),
        body: messageChunks[i],
      });
      console.log(`Message${i} id: `, message.sid);
    }

    return true;
  } catch (error) {
    console.log("Failed to send message:", error);
    return error;
  }
};

const queryToBot = async (
  phone_number,
  query,
  location,
  history,
  focusedVehicle,
  state,
  chat_id
) => {
  console.log(query);
  console.log(`http://${query.startsWith("#") ? BOT_API_DEMO : BOT_API}/query`)
  try {
    query = query || "";

    if (phone_number) {
      phone_number = `+${phone_number.replace(/\D/g, "")}`;

      if (!history || history.length === 0) {
        history = await find("chatHistory", {
          phone_number,
        });
      } else if (history.length === 1) {
        await insertNewDocument("chatHistory", {
          isBot: true,
          text: history[0].text,
          vehicles: [],
          phone_number,
        });
      }

      if (history.length > 0) {
        state = history[history.length - 1].state;
      }

      history.push({
        isBot: false,
        text: query,
        time: Date(),
      });

      history = history.slice(-30).map((h) => {
        return {
          isBot: h.isBot,
          text: h.text,
          time: h.time,
        };
      });

      if (state && !state.user_location) state.user_location = {};
      if (state && state.user_contact_info)
        state.user_contact_info.number = phone_number;

      await insertNewDocument("chatHistory", {
        isBot: false,
        text: query,
        phone_number,
        state,
      });

      try {
        const response = await axios.post(`http://${query.startsWith("#") ? BOT_API_DEMO : BOT_API}/query`, {
          query,
          phone_number,
          history,
          focusedVehicle: focusedVehicle || null,
          location: location || null,
          state: state || {
            user_contact_info: {
              name: "",
              "e-mail": "",
              number: phone_number,
            },
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
        }, { headers: { Authorization: CHATBOT_KEY }});
        await insertNewDocument("chatHistory", {
          isBot: true,
          text: response.data.text,
          vehicles: response.data.vehicles,
          phone_number,
          state: response.data.state,
        });

        return response.data;
      } catch (error) {
        await sendEmail(
          "Bot Error: " + error.message,
          "Bot Error: " + error.message,
          ENQUIRY_HANDLER_USER,
          `!!!Bot Error!!!`
        );
        text = state?.user_contact_info?.name
          ? "Sorry, we're offline right now, we'll be back in touch asap"
          : "Sorry, we're offline right now, please leave your name and we'll be back in touch asap";

        await insertNewDocument("chatHistory", {
          isBot: true,
          text,
          vehicles: [],
          phone_number,
          state,
        });
        return {
          text,
          vehicles: [],
          state,
        };
      }
    } else {
      if (history.length === 1 && chat_id) {
        await insertNewDocument("chatHistory", {
          isBot: true,
          text: history[0].text,
          vehicles: [],
          phone_number: chat_id,
        });
      }

      history.push({
        isBot: false,
        text: query,
        time: Date(),
      });

      history = history.map((h) => {
        return {
          isBot: h.isBot,
          text: h.text,
          time: h.time,
        };
      });

      if (chat_id) {
        await insertNewDocument("chatHistory", {
          isBot: false,
          text: query,
          phone_number: chat_id,
          state,
        });
      }

      try {
        const response = await axios.post(`http://${query.startsWith("#") ? BOT_API_DEMO : BOT_API}/query`, {
          query,
          phone_number: "guest",
          history,
          focusedVehicle: focusedVehicle || null,
          location: location || null,
          state: state || {
            user_contact_info: {
              name: "",
              "e-mail": "",
              number: "",
            },
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
        }, { headers: { Authorization: CHATBOT_KEY }});

        if (chat_id) {
          await insertNewDocument("chatHistory", {
            isBot: true,
            text: response.data.text,
            vehicles: response.data.vehicles,
            phone_number: chat_id,
            state: response.data.state,
          });
        }

        console.log(response.data);

        return response.data;
      } catch (error) {
        await sendEmail(
          "Bot Error: " + error.message,
          "Bot Error: " + error.message,
          ENQUIRY_HANDLER_USER,
          `!!!Bot Error!!!`
        );

        if (
          !state?.user_contact_info?.name &&
          !state?.user_contact_info?.number &&
          !state?.user_contact_info?.["e-mail"]
        ) {
          text =
            "Sorry, we're offline right now, please leave your name and contact details and we'll be back in touch asap";
        } else if (
          state?.user_contact_info?.name &&
          (state?.user_contact_info?.number ||
            state?.user_contact_info?.["e-mail"])
        ) {
          text = "Sorry, we're offline right now, we'll be back in touch asap";
        } else if (state?.user_contact_info?.name) {
          text =
            "Sorry, we're offline right now, please leave your contact details and we'll be back in touch asap";
        } else {
          text =
            "Sorry, we're offline right now, please leave your name and we'll be back in touch asap";
        }

        if (chat_id) {
          await insertNewDocument("chatHistory", {
            isBot: true,
            text,
            vehicles: [],
            phone_number: chat_id,
            state: state,
          });
        }
        return {
          text,
          vehicles: [],
          state,
        };
      }
    }
  } catch (error) {
    await sendEmail(
      "Bot Error: " + error.message,
      "Bot Error: " + error.message,
      ENQUIRY_HANDLER_USER,
      `!!!Bot Error-!!!`
    );
    throw new Error(error.message);
  }
};

const extractVins = (message) => {
  const regex = /\/vehicles-for-sale\/viewdetail\/([A-Za-z0-9]{17})/g;
  const matches = message.match(regex);
  if (matches) {
    return matches.map((match) =>
      match.replace("/vehicles-for-sale/viewdetail/", "")
    );
  } else {
    return [];
  }
};

const getImagesByVins = async (vins) => {
  try {
    if (vins.length === 0) {
      console.log("nothing");
      return {
        sliderType: "nothing",
        img: [],
      };
    }

    const data = { img: [] };

    if (vins.length === 1) {
      data.sliderType = "single";
      console.log("single");
      const results = await findAndSelect(
        "vehicle",
        { vin: vins[0] },
        "media -_id"
      );
      const result = {
        results,
        totalResults: results.length,
      };
      if (result.totalResults === 1) {
        const media = result.results[0].media;
        if (media) {
          data.img = media.images || [];
          data.img = data.img.map((img) => {
            return { href: img.href, vin: vins[0] };
          });
        }
      }
    } else {
      data.sliderType = "multiple";

      const allVehicles = await findAndSelect(
        "vehicle",
        {},
        "vehicle media -_id"
      );
      const vehicles = { results: allVehicles };

      const results = vehicles.results
        .filter((vehicle) => vins.includes(vehicle.vehicle.vin))
        .map((vehicle) => {
          const media = vehicle.media;
          if (media && media.images) {
            if (media.images.length > 0) {
              return [{ href: media.images[0].href, vin: vehicle.vehicle.vin }];
            }
          }
          return [];
        });

      console.log("multiple", results.length);

      data.img = results.flat();
    }

    if (data.img.length === 0) data.sliderType = "nothing";

    return data;
  } catch (error) {
    return {
      sliderType: "nothing",
      img: [],
    };
  }
};

const generateVerificationCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let verificationCode = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    verificationCode += characters.charAt(randomIndex);
  }

  return verificationCode;
};

const checkVerificationCode = (inputCode, expectedCode) => {
  const normalizedInput = inputCode.toUpperCase().replace(/\s/g, "");

  return normalizedInput === expectedCode;
};

const generateToken = (phone_number, verification_code) => {
  const token = jwt.sign({ phone_number, verification_code }, JWT_SECRET, {
    expiresIn: EXPIRES_IN, //"30d"
  });

  return token;
};

const checkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the header exists and contains a Bearer token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Extract the token value by removing the 'Bearer ' prefix
      const token = authHeader.split(" ")[1];

      if (token) {
        if (token === ADMIN_KEY) {
          req.check = { status: "admin" };
        } else {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);

            const user = await findOne("user", {
              phone_number: decoded.phone_number,
              verification_code: decoded.verification_code,
              isCodeUsed: true,
            });

            console.log(decoded);

            if (!user) {
              req.check = { status: "Not authorized, no number" };
              return;
            }

            const jwtToken = generateToken(
              user.phone_number,
              user.verification_code
            );

            res.set("Authorization", jwtToken);

            req.check = { status: "user", user };
          } catch (error) {
            console.error(error);
            req.check = { status: "Not authorized, token failed" };
          }
        }
      } else {
        req.check = { status: "Not authorized, no token" };
      }
    } else {
      req.check = { status: "Invalid or missing JWT token" };
    }
  } catch (error) {
    console.error(error);
    req.check = { status: "Not authorized, internal server error" };
  }
  next();
};

const calculateFinance = async (
  Term,
  Deposit,
  Identifier,
  CashPrice,
  CurrentMileage,
  DepositType,
  RegistrationDate
) => {
  //Type: Amount || Percentage
  try {
    const Vehicle = {
      CashPrice,
      Identifier,
      IdentifierType: "VIN",
      CurrentMileage,
      CurrentMileageUnit: "Miles",
    };

    if (RegistrationDate) {
      Vehicle.RegistrationDate = RegistrationDate;
    }
    const response = await axios.post(
      FINANCE_API_ENDPOINT,
      {
        Parameters: {
          Term,
          Deposit,
          DepositType,
          AnnualMileage: 10000,
        },
        VehicleRequests: [
          {
            Id: 1,
            Vehicle,
          },
        ],
      },
      {
        headers: {
          "X-CW-ApiKey": FINANCE_KEY,
        },
      }
    );

    if (response.data.HasError) {
      throw new Error("Incorrect finance params");
    }

    if (!response.data.VehicleResults[0]) {
      throw new Error("Incorrect finance params");
    }

    if (!response.data.VehicleResults[0].FinanceProductResults[1]) {
      console.log(response.data.VehicleResults[0]);
      throw new Error("unknown error");
    }
    if (!response.data.VehicleResults[0].FinanceProductResults[1].Quote) {
      console.log(response.data.VehicleResults[0].FinanceProductResults[1]);
      if (
        response.data.VehicleResults[0].FinanceProductResults[1].Error ||
        response.data.VehicleResults[0].FinanceProductResults[1].Error
          .TechnicalMessage
      )
        throw new Error(
          response.data.VehicleResults[0].FinanceProductResults[1].Error.TechnicalMessage
        );
      else throw new Error("unknown error");
    }

    return response.data.VehicleResults[0].FinanceProductResults[1];
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.Error.TechnicalMessage);
    }
    throw new Error(error.message);
  }
};

const calculateMultiDefaultFinance = async (vehicles) => {
  //Type: Amount || Percentage
  try {
    if (vehicles.length === 0) return {};

    const response = await axios.post(
      FINANCE_API_ENDPOINT,
      {
        Parameters: {
          Term: 48,
          Deposit: 3000,
          DepositType: "Amount",
          AnnualMileage: 10000,
        },
        VehicleRequests: vehicles.map((vehicle, i) => {
          if (vehicle.vehicle.firstRegistrationDate) {
            return {
              Id: i + 1,
              Vehicle: {
                CashPrice: vehicle.adverts.forecourtPrice.amountGBP || 0,
                Identifier: vehicle.vehicle.vin,
                IdentifierType: "VIN",
                CurrentMileage: vehicle.vehicle.odometerReadingMiles || 0,
                CurrentMileageUnit: "Miles",
                RegistrationDate: vehicle.vehicle.firstRegistrationDate,
              },
            };
          } else {
            return {
              Id: i + 1,
              Vehicle: {
                CashPrice: vehicle.adverts.forecourtPrice.amountGBP || 0,
                Identifier: vehicle.vehicle.vin,
                IdentifierType: "VIN",
                CurrentMileage: vehicle.vehicle.odometerReadingMiles || 0,
                CurrentMileageUnit: "Miles",
              },
            };
          }
        }),
      },
      {
        headers: {
          "X-CW-ApiKey": FINANCE_KEY,
        },
      }
    );

    if (response.data.HasError) {
      console.log(response.data);
      throw new Error("Incorrect finance params");
    }

    if (!response.data.VehicleResults[0]) {
      throw new Error("Incorrect finance params");
    }

    const result = {};

    response.data.VehicleResults.forEach((vehicle, i) => {
      if (!vehicle.FinanceProductResults[1]) {
        result[`${vehicles[i].vehicle.vin}`] = 0;
      } else {
        const quote = vehicle.FinanceProductResults[1].Quote;

        if (quote && quote.Deposit === 3000 && quote.Term === 48) {
          result[`${vehicles[i].vehicle.vin}`] =
            quote.AllInclusiveRegularPayment;
        } else {
          result[`${vehicles[i].vehicle.vin}`] = 0;
        }
      }
    });

    return result;
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.Error.TechnicalMessage);
    }
    throw new Error(error.message);
  }
};

const validatePostcode = async (postcode) => {
  if (postcode.length === 0) return false;
  const res = await axios(
    `https://api.postcodes.io/postcodes/${postcode}/validate`
  );
  return res.data.result;
};

const lookupPostcode = async (postcode) => {
  // const res = await axios.post(
  //   ` https://api.postcodes.io/postcodes/${encodeURIComponent(
  //     postcode
  //   )}`
  // );
  // return {
  //   "Address1": res.data.result["parish"],
  //   "Address2": null,
  //   "Address3": null,
  //   "Address4": null,
  //   "Town": res.data.results[0]["address_components"][2]["long_name"],
  //   "County": res.data.results["admin_district"],
  //   "Postcode": res.data.results["postcode"],
  //   "PremiseData": "||22;||24;||26;||26b;||26c;||28;||30;||32;||34;||36;",
  //   "ErrorNumber": 0,
  //   "ErrorMessage": ""
  // }
  const res = await axios.post(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      postcode
    )}&key=${GOOGLE_MAP_API_KEY}`
  );

  console.log(res.data.results[0]["address_components"].length)
  if(res.data.results[0]["address_components"].length == 6) {
    return {
      "Address1": res.data.results[0]["address_components"][1]["long_name"],
      "Address2": null,
      "Address3": null,
      "Address4": null,
      "Town": res.data.results[0]["address_components"][2]["long_name"],
      "County": res.data.results[0]["address_components"][3]["long_name"],
      "Postcode": res.data.results[0]["address_components"][0]["long_name"],
      "PremiseData": "||22;||24;||26;||26b;||26c;||28;||30;||32;||34;||36;",
      "ErrorNumber": 0,
      "ErrorMessage": ""
    }
  } else { // this means 7
    return {
      "Address1": res.data.results[0]["address_components"][1]["long_name"],
      "Address2": res.data.results[0]["address_components"][2]["long_name"],
      "Address3": null,
      "Address4": null,
      "Town": res.data.results[0]["address_components"][3]["long_name"],
      "County": res.data.results[0]["address_components"][4]["long_name"],
      "Postcode": res.data.results[0]["address_components"][0]["long_name"],
      "PremiseData": "||22;||24;||26;||26b;||26c;||28;||30;||32;||34;||36;",
      "ErrorNumber": 0,
      "ErrorMessage": ""
    }
  }
  
  // const res = await axios.post(
  //   `https://checkout.tmcmotors.co.uk/Shared/DoPostcodeLookup?postcode=${encodeURIComponent(
  //     postcode
  //   )}`
  // );
  // return res.data;
};

const calcRoadDistance = async (postcode1, postcode2) => {
  let url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${postcode1}&destinations=${postcode2}&key=${GOOGLE_MAP_API_KEY}`;

  const response = await axios.get(url);

  if (response.data.rows[0].elements[0].status === "OK") {
    return {
      distance: response.data.rows[0].elements[0].distance.text,
      client_address: response.data.origin_addresses[0],
      forecourt_address: response.data.destination_addresses[0],
    };
  } else {
    throw new Error("Incorrect Postcode");
  }
};

const reserveFromCMS = async (vin) => {
  const response = await axios.get(
    `${CMS_API_RESERVE_ENDPOINT}?token=${CMS_KEY}&vin=${vin}`
  );
};

const sendEmail = async (subject, text, to, user) => {
  try {
    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    const mailDetails = {
      from: `"${user || SMTP_USER}" <${SMTP_USER}>`,
      to,
      subject,
      html: text,
    };

    await mailTransporter.sendMail(mailDetails);
    console.log("Email sent successfully");
    return true;
  } catch (err) {
    console.log("An error occurred while sending email.");
    console.log(err);
  }
};

const isValidEmail = (email) => {
  // Define a regular expression pattern for email validation.
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

const getAllArticles = async () => {
  try {
    const response = await axios.get(
      `https://${CMS_APP_URL}/api/content/allarticle`
    );
    return response.data.articles;
  } catch (error) {
    console.error(`Error: ${error}`);
    if (error.response.data) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message);
  }
};

const sendHook = async () => {
  try {
    const response = await axios.put(
      `http://${BOT_API}/update-hook`,
      {},
      {
        headers: { "X-API-Key": AUTOTRADER_WEBHOOK_KEY, Authorization: CHATBOT_KEY},
      }
    );

    console.log("bot_update", response.data);

    if (response.data.status === "success") return true;
    else return false;
  } catch (error) {
    console.error(`Send-Hook-Error: ${error}`);
    return false;
  }
};

const updateStock = async () => {
  try {
    let vehicles = await findAndSelect(
      "vehicle",
      {},
      "vehicle adverts media -_id"
    );

    const defaultFinances = await calculateMultiDefaultFinance(vehicles);

    const vehiclesCMS = await retrieveStockFromCMS();

    vehicles = vehicles.map((vehicle) => {
      const vin = vehicle.vehicle.vin;
      const temp = {
        vin,
        finance: defaultFinances[vin] || 0,
        //general data
        vehicle: { ...vehicle.vehicle, ...{ finance: defaultFinances[vin] } },
        media: vehicle.media,
      };

      if (vehiclesCMS[vin]) {
        temp.media.video.href = vehiclesCMS[vin].video;
        temp.vehicle.branch = vehiclesCMS[vin].branch;
        temp.vehicle.service_history = vehiclesCMS[vin].service_history;
        temp.vehicle.mot_expiry_date = vehiclesCMS[vin].mot_expiry_date;
        temp.vehicle.last_service_date = vehiclesCMS[vin].last_service_date;
        temp.vehicle.mileage_at_last_service =
          vehiclesCMS[vin].mileage_at_last_service;
        temp.vehicle.no_of_keys = vehiclesCMS[vin].no_of_keys;
        temp.vehicle.sale_type = vehiclesCMS[vin].sale_type;
        temp.vehicle.no_of_owners = vehiclesCMS[vin].no_of_owners;
        temp.vehicle.status = vehiclesCMS[vin].status;
        temp.vehicle.experian_or_hpi_report =
          vehiclesCMS[vin].experian_or_hpi_report;
        temp.vehicle.service_history_attachment =
          vehiclesCMS[vin].service_history_attachment;
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

      return { $set: temp };
    });

    await Models["vehicle"].bulkWrite(
      vehicles.map((document) => {
        return {
          updateOne: {
            filter: { vin: document["$set"].vin },
            update: document,
          },
        };
      })
    );

    const result = await sendHook();
    if (!result)
      throw new Error("Error while sending a notification to a bot engine");

    return true;
  } catch (error) {
    console.error(`Update-Stock-Error: ${error}`);
    return false;
  }
};

const upsertPineconeVehicle = async (vehicles) => {
  try {
    await axios.post(`http://${BOT_API}/upsert_pinecone_vehicle`, {
      vehicles: vehicles.map((vehicle) => {
        return {
          vehicle,
          metadata: { id: vehicle.vin, category: "vehicle" },
        };
      }),
    }, { headers: { Authorization: CHATBOT_KEY }});
  } catch (error) {
    console.error(`Pinecone-Vehicle-Upsert-Error: ${error}`);
  }
};

const removePineconeVehicles = async (id) => {
  try {
    if (id) {
      await axios.post(`http://${BOT_API}/delete_pinecone`, {
        metadata: { category: "vehicle", id },
      }, { headers: { Authorization: CHATBOT_KEY }});
    } else {
      await axios.post(`http://${BOT_API}/delete_pinecone`, {
        metadata: { category: "vehicle" },
      }, { headers: { Authorization: CHATBOT_KEY }});
    }
  } catch (error) {
    console.error(`Pinecone-Vehicles-Remove-Error: ${error}`);
  }
};

const prerender = async (url, fileName) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  let content = await page.content();

  // replace all instances of the class for stars
  content = content.replace(
    /class="cursor-pointer text-yellow-700 w-6 h-6"/g,
    'class="cursor-pointer text-yellow-700" width="24px" height="24px"'
  );

  fs.writeFileSync(`./prerendered_pages/${fileName}.html`, content);

  await browser.close();
};

const handleTranscript = async () => {
  try {
    console.log("handle transcript");

    let transcripts = await findAndSelect(
      "chatHistory",
      { forward: false },
      "phone_number"
    );

    phone_numbers = transcripts
      .map((obj) => obj.phone_number)
      .filter((value, index, self) => self.indexOf(value) === index);

    const promises = phone_numbers.map(async (phone_number) => {
      const chat_histories = await findAndSelect(
        "chatHistory",
        { forward: false, phone_number },
        "phone_number isBot text state time"
      );

      const last_message = chat_histories[chat_histories.length - 1];

      const docTimestamp = last_message._id.getTimestamp();

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      if (docTimestamp < fifteenMinutesAgo) {
        console.log(phone_number, last_message.state.user_vehicle_info.links);
        const mail = `<table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%">
        <tbody><tr>
            <td align="center" valign="top">
                
                <table class="m_1815589142183751782container m_1815589142183751782header" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                    <tbody><tr>
                        <td style="padding:30px 0 30px 0;border-bottom:solid 1px #eeeeee" align="center">
                            <a href="https://ehabhdi.r.bh.d.sendibt3.com/tr/cl/WLnEavwrJY5Nj6_RB01h3jbZXPePNezwOGe5ScGAe9Ult66cNfyYiUZsUAu5v1mEeId6lTHWKbU_lELbZazZR_BTm6pmWUz5N5S1V5ri-Fsn7VC2k4th-sHHNllHzSqbtsVBEG3w0FhsFGl0IgJ9ecrd6O9cCFBTJjmaaT_A0_VmrswcCXPvTy9RbdReCYJ-CAl43u3zPQYNWl2HPxnHCrSMYkAw_9HhLIvq32df-Be6QGANlGrfV_gSzWT1jPSOLZxdao5cZ6jfUB9iVa0w9wYNWZOF" style="font-size:30px;text-decoration:none;color:#000000" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://ehabhdi.r.bh.d.sendibt3.com/tr/cl/WLnEavwrJY5Nj6_RB01h3jbZXPePNezwOGe5ScGAe9Ult66cNfyYiUZsUAu5v1mEeId6lTHWKbU_lELbZazZR_BTm6pmWUz5N5S1V5ri-Fsn7VC2k4th-sHHNllHzSqbtsVBEG3w0FhsFGl0IgJ9ecrd6O9cCFBTJjmaaT_A0_VmrswcCXPvTy9RbdReCYJ-CAl43u3zPQYNWl2HPxnHCrSMYkAw_9HhLIvq32df-Be6QGANlGrfV_gSzWT1jPSOLZxdao5cZ6jfUB9iVa0w9wYNWZOF&amp;source=gmail&amp;ust=1706165619211000&amp;usg=AOvVaw3UPVcIKeGXw7AEMKvC9wTT">
                              <img src="https://ci3.googleusercontent.com/meips/ADKq_NZn_QSgPcx6eMkP8QAieJZJIFGfah4U5JYbXp1S83RdzOUrzAr1e4oTP1kv6MchuOiBuAvJAxAMNJDW324yTD83L2OnioV4oRipURoDMmyTgGE25MSKJAS_Y6bSr_WlPPTRE2feYD1BCajeXvvudgFYVO1E_kAc42AZ3cxByE-Oq7X48VLUfHaDNUHRF4Papycn6XbOD4Hp6IP6S4C-QtGUTObU7V4u-LfVXFsTk1Aw-JYruC-_U9xhXWVLKSECEYj_CwQfqwAI4NJG0JUdcVK08AiyWknjeQdAcONbc2MLjw1WoNfFZjP14_ySaWGBPawebC53998zy02QCDeyl6NeP--WunA4fICGfZzi_Q0YsXuPIvC5_SfJWN8TyOyZ9vH09yPSoB_5eSVHcQ8eZf7iLZlUC6BXT3Ri1bMikLaDV2-3Hhmx8tvS7USgmrTMuz1lt92_kSaZQz8ChJKRBxfsGU4JFeYlTBbRM-gfBdwOV7lGWZeHkUfcgcJ73_u88bRWwbVsoGNCtPAJs8Juw0dSMsOngWPHNgJl0Bvudt3PLLe3f6zxwBpAaJzTrkyHp6CUKDs=s0-d-e1-ft#https://ehabhdi.r.bh.d.sendibt3.com/im/4701738/df92a2f7dd1019a5d035633c42cf101e1e87db1c84e3b7366fdc4b73916d5a3b.png?e=XIFl1pArmA4X1MDpCVEStXqrk3sFdvIBSA8-7YOso_FxT8W8D9Bko6kaClkFyWe0DlnkkP9TZLo7PXkBD7SbxhvayepeUQWKfHgMVyvH8uMm01ESXsIElGBnmltWgiSHtZcpmDryw9P7XuF0FT1OD-tKrmL5tFZT4FBVTo18h6dNdv6J4mCwzHhOkJcmRU4JbbGVGVTOz_scNEbm0jp_3Oz34S3ALrOJHs0z3-CLtlKRme7tMOEkBwKjZ2XuOjPtWerIoWlTzc9j0GErqkarhMQTKrbd-sCQc50W5EA" border="0" class="CToWUd" data-bit="iit" width="50%" >
                            </a>
                        </td>
                    </tr>
                </tbody></table>
                
                <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                    <tbody><tr>
                        <td class="m_1815589142183751782hero-subheader__title" style="font-size:43px;font-weight:bold;padding:80px 0 15px 0" align="left">${`Transcript cid-${last_message.phone_number}`}</td>
                    </tr>
                    <tr>
                        <td class="m_1815589142183751782hero-subheader__content" style="font-size:16px;line-height:27px;color:#969696;padding:0 60px 90px 0" align="left">
                            <p>This client just chatted with Aime. Please contact back as soon as possible.</p>
                        </td>
                    </tr>
                </tbody></table>
                
                <table class="m_1815589142183751782container m_1815589142183751782title-block" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tbody><tr>
                        <td align="center" valign="top">
                            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                                <tbody><tr>
                                    <td style="border-bottom:solid 1px #eeeeee;padding:0 0 18px 0;font-size:26px" align="left">Client Details</td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tbody><tr>
                        <td align="center" valign="top">
                            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                                <tbody><tr>
                                    <td class="m_1815589142183751782paragraph-block__content" style="padding:25px 0 18px 0;font-size:16px;line-height:27px;color:#969696;word-wrap:break-word;word-break:break-word" align="left">
                                        <p>
                                        <strong>Name:</strong> ${
                                          last_message.state.user_contact_info
                                            .name
                                        } <br>
                                        <strong>Email Address:</strong> <a href="mailto:${
                                          last_message.state.user_contact_info[
                                            "e-mail"
                                          ]
                                        }" target="_blank">${
          last_message.state.user_contact_info["e-mail"]
        }</a><br>
                                        <strong>Phone Number:</strong> ${
                                          last_message.state.user_contact_info
                                            .number
                                        } <br>
                                        <strong>Postcode:</strong> ${
                                          last_message.state.user_location_info
                                            .postcode
                                        } <br>
                                        <strong>Town:</strong> ${
                                          last_message.state.user_location_info
                                            .town
                                        } <br>
                                        <strong>County:</strong> ${
                                          last_message.state.user_location_info
                                            .county
                                        } <br>
                                        </p>
                                    </td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                
                
                ${
                  last_message.state.user_vehicle_info.cost !== ""
                    ? `<table class="m_1815589142183751782container m_1815589142183751782title-block" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr>
                    <td align="center" valign="top">
                        <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                            <tbody><tr>
                                <td style="border-bottom:solid 1px #eeeeee;padding:0 0 18px 0;font-size:26px" align="left">Client Vehicle Information ${
                                  last_message.state.user_vehicle_info
                                    .active === "true"
                                    ? "for Parts Exchange"
                                    : ""
                                }</td>
                            </tr>
                        </tbody></table>
                    </td>
                </tr>
            </tbody></table>
            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody><tr>
                    <td align="center" valign="top">
                        <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                            <tbody><tr>
                                <td class="m_1815589142183751782paragraph-block__content" style="padding:25px 0 18px 0;font-size:16px;line-height:27px;color:#969696;word-wrap:break-word;word-break:break-word" align="left">
                                    <p>
                                    <strong>VRN:</strong> ${
                                      last_message.state.user_vehicle_info.vrn
                                    } <br>
                                    <strong>Make:</strong> ${
                                      last_message.state.user_vehicle_info.make
                                    } <br>
                                    <strong>Model:</strong> ${
                                      last_message.state.user_vehicle_info.model
                                    } <br>
                                    <strong>Generation:</strong> ${
                                      last_message.state.user_vehicle_info
                                        .generation
                                    } <br>
                                    <strong>Mileage:</strong> ${parseInt(
                                      last_message.state.user_vehicle_info
                                        .mileage || 0
                                    ).toLocaleString()} <br>
                                    <strong>Condition:</strong> ${
                                      last_message.state.user_vehicle_info
                                        .condition
                                    } <br>
                                    <strong>Service History:</strong> ${
                                      last_message.state.user_vehicle_info
                                        .service_history
                                    } <br>
                                    <strong>Trading Price:</strong> ${
                                      last_message.state.user_vehicle_info.cost
                                    } <br>
                                    <strong>Attached links:</strong> ${
                                      Array.isArray(
                                        last_message.state.user_vehicle_info
                                          .links
                                      ) &&
                                      last_message.state.user_vehicle_info.links.every(
                                        (item) => typeof item === "string"
                                      )
                                        ? last_message.state.user_vehicle_info.links.join(
                                            ", "
                                          )
                                        : last_message.state.user_vehicle_info
                                            .links
                                    } <br>
                                    </p>
                                </td>
                            </tr>
                        </tbody></table>
                    </td>
                </tr>
            </tbody></table>`
                    : ""
                }
                
                <table class="m_1815589142183751782container m_1815589142183751782title-block" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tbody><tr>
                        <td align="center" valign="top">
                            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                                <tbody><tr>
                                    <td style="border-bottom:solid 1px #eeeeee;padding:0 0 18px 0;font-size:26px" align="left">Chat History</td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tbody><tr>
                        <td align="center" valign="top">
                            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                                <tbody><tr>
                                    <td class="m_1815589142183751782paragraph-block__content" style="padding:25px 0 18px 0;font-size:16px;line-height:27px;color:#969696;word-wrap:break-word;word-break:break-word" align="left">
                                        <p>
                                        ${chat_histories
                                          .map((message) => {
                                            if (message.isBot)
                                              return `<strong>Aime:</strong> ${message.text} <br><br>`;
                                            else
                                              return `<i>Location: ${message.state?.user_location}</i> <br><strong>Client(${last_message.state.user_contact_info.name}):</strong> ${message.text} <br>`;
                                          })
                                          .join("")}
                                        </p>
                                    </td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                
  
                
                <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="100%" align="center">
                    <tbody><tr>
                        <td align="center">
                            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="620" align="center" style="border-bottom:solid 1px #eeeeee;width:620px">
                                <tbody><tr>
                                    <td align="center">&nbsp;</td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                
  
                
                <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="100%" align="center">
                    <tbody><tr>
                        <td align="center">
                            <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" width="620" align="center" style="border-top:1px solid #eeeeee;width:620px">
                                <tbody><tr>
                                    <td style="text-align:center;padding:50px 0 10px 0">
                                        <a href="https://ehabhdi.r.bh.d.sendibt3.com/tr/cl/Hx-XS2B0GaD4h8d8kOlQ8_9TmtVr-vmZ77whSaCjKTi5HvoP5h7sUf7wzhnWrxQERGKWvZocC4WpX64KyOPmWo4hGhjlWWP58GDm26PbYGxpdnZlkxovrpAIKLKy5l_waCQ00gI0OqpY4gajvN2CdO2S3b-TfQ298k1cf1bT3uXQ7I8u1ZvpIl1W9GiAxjOTQqlInlF7TdtF0m7HFUppueRJAI49NBDC4zfFj7Z8ZHQraR5GQoFTUKFM55zt9dMxR0PDEx21O4WnaPjVruX_LOgD0C5Y" style="font-size:28px;text-decoration:none;color:#d5d5d5" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://ehabhdi.r.bh.d.sendibt3.com/tr/cl/Hx-XS2B0GaD4h8d8kOlQ8_9TmtVr-vmZ77whSaCjKTi5HvoP5h7sUf7wzhnWrxQERGKWvZocC4WpX64KyOPmWo4hGhjlWWP58GDm26PbYGxpdnZlkxovrpAIKLKy5l_waCQ00gI0OqpY4gajvN2CdO2S3b-TfQ298k1cf1bT3uXQ7I8u1ZvpIl1W9GiAxjOTQqlInlF7TdtF0m7HFUppueRJAI49NBDC4zfFj7Z8ZHQraR5GQoFTUKFM55zt9dMxR0PDEx21O4WnaPjVruX_LOgD0C5Y&amp;source=gmail&amp;ust=1706165619211000&amp;usg=AOvVaw0YUGFgMDuo5QIAnIDopHVg">
                                          <img src="https://ci3.googleusercontent.com/meips/ADKq_NZvljZGwfiJJ4Is0wPQaMLfpFItZwbKCG1LyDlb0gcCpMVlHPXEHahVhJm-gYeIXV4hVppV7AxzZt0YZrm1CEJuh67KQw4D7tNooo-iGXqEYPG_idHrReGuDKXCH-5jNyZlXu96Temncv8GszgiEw-52_0gIHgp7dKjJR2FL-5lshj4VNJoFIGvarIV4Ck8UbEmHeqs2D0GB4JyB4qSyId744MHed6IfNB8IMrY6_or25pCofJ5_PKkccZVxHEQAku1NYjgDmAybioDgZ49vio87fcJlMdwDOKHO7YtLh5N72HpVYlKPptQIY8CsxsRw8xT7Vcm1fJQ2ljAojgZWCqigIow28Y1KcomDP7MPfdl25CsDb6V2vRW-Kqgh25-GfFx-nXmCBHNp2RcSIs2kan0-XdN4E0WvHyttD-0UNN-7dnttKRozKCy_lcLe2z7U-vj0lc_zHpC3YWzLR40KvZUlH8pOUeQzrjmA6SBGpOlui4O6QONZ_5qgYQGAWyGnu_lbRPVY0aIXakkeJrQ-DnC0FCFEhw33YduxoKGJD6Dkw5yHpFOrr8Tl7280Tajbd_4N8Y=s0-d-e1-ft#https://ehabhdi.r.bh.d.sendibt3.com/im/4701738/df92a2f7dd1019a5d035633c42cf101e1e87db1c84e3b7366fdc4b73916d5a3b.png?e=Fm8mZd3Vart9ug3efuiMqwTZDm7_4i2cOcDo4Ur7OwHVedxaLfagzQWP4A1nnpDcJvtlRxDkIoqpJagqVoObkFpACM3qYmJybbp3GtjcQ8Y6Zy5VeC4AKUy_r5yaiOatJmiYFIkZ1MVBy8TBGXrV47SoW52i3cPdCjDGVopGiVaUUL4X-BBqxtTz_4monQ-WQUAQ5Q2mfY6KYW3CGeNc0yLy7ZYQmOzIdcNXUplwghW6ld0DjX9TgsmGbBIi6tOMBdgnGTE19pZWMkIgYWEdDOrfmn6JXF4dJKlaAJA" border="0" class="CToWUd" data-bit="iit" width="50%" >
                                        </a>
                                    </td>
                                </tr>
  
                                <tr>
                                    <td style="color:#d5d5d5;text-align:center;font-size:15px;padding:10px 0 60px 0;line-height:22px">Copyright © <a href="https://ehabhdi.r.bh.d.sendibt3.com/tr/cl/-fcoNLaBZPAt3XX4s8U4IJIbmDQ3z7ql2l0VOyeumzD1EZTF6Xb7cA1zjcd8TMN7MuXqmR6nVqm9LXfivr3FMNpF9dJ-U_w-wON_afJ4c31PJb4i2-Tj9jnVXcmNjw5iSco9j68-cX3-KWr43L-tD0hL73Nr5YWROD_INpilHLv8Pd1wS6IecY6wCyeuGrthaiM3mruwJCbqYtGt6VrU0lvNYZnk6Qg3QMSosqoKy0HwWhrscOf-veOk_JYaPFbkEptxmzknkMvQnCPwBasRRbi6vq5M" style="text-decoration:none;border-bottom:1px solid #d5d5d5;color:#d5d5d5" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://ehabhdi.r.bh.d.sendibt3.com/tr/cl/-fcoNLaBZPAt3XX4s8U4IJIbmDQ3z7ql2l0VOyeumzD1EZTF6Xb7cA1zjcd8TMN7MuXqmR6nVqm9LXfivr3FMNpF9dJ-U_w-wON_afJ4c31PJb4i2-Tj9jnVXcmNjw5iSco9j68-cX3-KWr43L-tD0hL73Nr5YWROD_INpilHLv8Pd1wS6IecY6wCyeuGrthaiM3mruwJCbqYtGt6VrU0lvNYZnk6Qg3QMSosqoKy0HwWhrscOf-veOk_JYaPFbkEptxmzknkMvQnCPwBasRRbi6vq5M&amp;source=gmail&amp;ust=1706165619211000&amp;usg=AOvVaw35wz2ukJzA36gvKp6pYzFD">TMC - The Motor Company</a>. <br>All rights reserved.</td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                </tbody></table>
                
            </td>
        </tr>
    </tbody></table>`;

        await sendEmail(
          `Subject: Transcript cid-${last_message.phone_number}`,
          mail,
          ENQUIRY_HANDLER_USER,
          `Transcript cid-${last_message.phone_number}`
        );

        await Models["chatHistory"].updateMany(
          { phone_number, forward: false },
          { $set: { forward: true } }
        );
      }

      return true;
    });

    Promise.all(promises)
      .then((results) => {
        console.log(results);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.error(error);
  }
};

const updateTotalStock = async () => {
  const pageSize = 200;
  let total_pages = 1;
  let current_page = 1;
  let vehicles = [];
  
  while (total_pages >= current_page) {
    const temp = await retrieveStock(current_page, pageSize);
    vehicles = vehicles.concat(temp.results);
    current_page += 1;
    total_pages = temp.total_pages;
  }

  const defaultFinances = await calculateMultiDefaultFinance(vehicles);

  const vehiclesCMS = await retrieveStockFromCMS();

  vehicles = vehicles.map((vehicle) => {
    const vin = vehicle.vehicle.vin;
    const temp = {
      vin,
      registration: vehicle.vehicle.registration,
      make: vehicle.vehicle.make,
      model: vehicle.vehicle.model,
      vehicleType: vehicle.vehicle.vehicleType,
      bodyType: vehicle.vehicle.bodyType,
      fuelType: vehicle.vehicle.fuelType,
      colour: vehicle.vehicle.standard.colour,
      transmissionType: vehicle.vehicle.transmissionType,
      odometerReadingMiles: vehicle.vehicle.odometerReadingMiles || 0,
      price: vehicle.adverts.forecourtPrice.amountGBP || 0,
      finance: defaultFinances[vin] || 0,
      yearOfManufacture: vehicle.vehicle.yearOfManufacture || 0,
      //general data
      vehicle: {
        ...vehicle.vehicle,
        ...{ finance: defaultFinances[vin] },
        ...{ colour: vehicle.vehicle.standard.colour },
      },
      adverts: vehicle.adverts,
      metadata: vehicle.metadata,
      features: vehicle.features,
      media: {
        ...vehicle.media,
        ...{
          images: vehicle.media.images.map((image) => {
            return {
              ...image,
              href: image.href.replace("{resize}", "w600h450"),
            };
          }),
        },
      },
      history: vehicle.history,
      check: vehicle.check,
    };

    if (vehiclesCMS[vin]) {
      temp.media.video.href = vehiclesCMS[vin].video;
      temp.vehicle.branch = vehiclesCMS[vin].branch;
      temp.vehicle.service_history = vehiclesCMS[vin].service_history;
      temp.vehicle.mot_expiry_date = vehiclesCMS[vin].mot_expiry_date;
      temp.vehicle.last_service_date = vehiclesCMS[vin].last_service_date;
      temp.vehicle.mileage_at_last_service =
        vehiclesCMS[vin].mileage_at_last_service;
      temp.vehicle.no_of_keys = vehiclesCMS[vin].no_of_keys;
      temp.vehicle.sale_type = vehiclesCMS[vin].sale_type;
      temp.vehicle.no_of_owners = vehiclesCMS[vin].no_of_owners;
      temp.vehicle.status = vehiclesCMS[vin].status;
      temp.vehicle.experian_or_hpi_report =
        vehiclesCMS[vin].experian_or_hpi_report;
      temp.vehicle.service_history_attachment =
        vehiclesCMS[vin].service_history_attachment;
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

    return temp;
  });

  await deleteAllDocuments("vehicle");
  console.log("deleted all");

  await upsertManyDocuments("vehicle", "vin", vehicles);
  console.log("upsert all to mongodb");

  await removePineconeVehicles();
  console.log("remove all from pinecone");

  const promises = Array.from(
    { length: Math.ceil(vehicles.length / 20) },
    (_, i) => vehicles.slice(i * 20, (i + 1) * 20)
  ).map(async (vehicles, i) => {
    await upsertPineconeVehicle(vehicles);
    console.log("pinecone", i);
  });

  try {
    const responses = await Promise.all(promises);
  } catch (error) {
    // Handle the error if any of the requests fail
    console.error(error);
  }
  console.log("upsert all to pinecone");

  const result = await sendHook();
  if (!result)
    throw new Error("Error while sending a notification to a bot engine");
};

module.exports = {
  find,
  findAndSelect,
  findOne,
  insertNewDocument,
  updateDocument,
  upsertManyDocuments,
  deleteAllDocuments,
  deleteDocument,
  findOneAndPopulate,
  findAndPopulate,
  pushIntoArray,
  findAndPopulateNested,
  customUpdate,
  getAggregate,
  findOneSliceAndPopulate,
  findOneSliceAndCustomPopulate,
  getDataWithLimit,
  getDataSelectWithLimit,
  findSliceAndPopulateNested,
  findSliceAndPopulate,
  findOneAndSelect,
  findPopulateSortAndLimit,
  retrieveStock,
  retrieveVehicleByRegistration,
  retrieveVehicleByVin,
  retrieveVehicleByVinFromCMS,
  valuateVehicle,
  sendMessage,
  queryToBot,
  canReceiveSMS,
  canReceiveWhatsapp,
  generateVerificationCode,
  checkVerificationCode,
  generateToken,
  checkToken,
  retrieveStockFromCMS,
  calculateFinance,
  calculateMultiDefaultFinance,
  lookupPostcode,
  validatePostcode,
  calcRoadDistance,
  getImagesByVins,
  extractVins,
  reserveFromCMS,
  sendEmail,
  isValidEmail,
  getAllArticles,
  sendHook,
  updateStock,
  upsertPineconeVehicle,
  removePineconeVehicles,
  prerender,
  handleTranscript,
  updateTotalStock,
};
