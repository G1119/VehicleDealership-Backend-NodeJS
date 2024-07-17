const mongoose = require("mongoose");
const chatHistorySchema = require("./chat-history.schema");

const chatHistory = mongoose.model("chat-histories", chatHistorySchema);

module.exports = chatHistory;
