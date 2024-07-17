const mongoose = require("mongoose");
const { DB_USER, DB_PASS, DB_NAME, MONGODB_URL } = require("../");

mongoose.connect(`${MONGODB_URL}${DB_NAME}?retryWrites=true&w=majority`);

module.exports = mongoose;
