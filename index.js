const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const schedule = require("node-schedule");

const { checkToken, handleTranscript, updateTotalStock } = require("./helpers");
const routes = require("./routes");
const app = express();

// * Database connection
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("db connected!");
});

// * Cors
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Expose-Headers", "Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true"); // Include this header if you need to pass credentials (e.g., cookies) with the request
  next();
});

app.use((req, res, next) => {
  if (req.path === "/api/autotrader/stock-webhook") {
    next();
  } else {
    // * Body Parser
    bodyParser.json()(req, res, () => {
      bodyParser.urlencoded({ extended: true })(req, res, next);
    });
  }
});
app.use(morgan("short"));

app.use(checkToken);

// * Api routes
app.use("/api", routes);

app.get("/", (req, res) => {
  console.log("Welcome to the TMC Motors LTD API!");
  res.send("Welcome to the TMC Motors LTD API!");
});

app.use("*", (req, res) => {
  res.send("Route not found");
});

const task1 = schedule.scheduleJob("* * * * *", function () {
  handleTranscript();
});

const task2 = schedule.scheduleJob("0 21 * * 0", function () {
  updateTotalStock();
});

let PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
