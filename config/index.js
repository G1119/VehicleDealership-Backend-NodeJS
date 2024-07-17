require("dotenv").config();

module.exports = {
  PORT: process.env.PORT,
  DB_NAME: process.env.DB_NAME,
  MONGODB_URL: process.env.MONGODB_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  EXPIRES_IN: process.env.EXPIRES_IN,

  ADMIN_KEY: process.env.ADMIN_KEY,

  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,

  GOOGLE_MAP_API_KEY: process.env.GOOGLE_MAP_API_KEY,

  ENQUIRY_HANDLER_USER: process.env.ENQUIRY_HANDLER_USER,

  CMS_API_SEARCH_ENDPOINT: process.env.CMS_API_SEARCH_ENDPOINT,
  CMS_API_RESERVE_ENDPOINT: process.env.CMS_API_RESERVE_ENDPOINT,
  CMS_KEY: process.env.CMS_KEY,

  FINANCE_API_ENDPOINT: process.env.FINANCE_API_ENDPOINT,
  FINANCE_KEY: process.env.FINANCE_KEY,

  AUTOTRADER_API: process.env.AUTOTRADER_API,
  AUTOTRADER_KEY: process.env.AUTOTRADER_KEY,
  AUTOTRADER_SECRET: process.env.AUTOTRADER_SECRET,
  ADVERTISER_ID: process.env.ADVERTISER_ID,
  AUTOTRADER_WEBHOOK_KEY: process.env.AUTOTRADER_WEBHOOK_KEY,

  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  UK_PHONENUMBER: process.env.UK_PHONENUMBER,
  US_PHONENUMBER: process.env.US_PHONENUMBER,
  UK_PHONENUMBER: process.env.UK_PHONENUMBER,

  BOT_API: process.env.BOT_API,
  BOT_API_DEMO: process.env.BOT_API_DEMO,

  APP_API: process.env.APP_API,
  APP_URL: process.env.APP_URL,
  CMS_APP_URL: process.env.CMS_APP_URL,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  SECRET: "HTP",
  
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,

  POSTCODE: process.env.POSTCODE,
  BRANCH: process.env.BRANCH,

  CHATBOT_KEY: process.env.CHATBOT_KEY
};
