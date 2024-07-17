const axios = require("axios");

exports.getCount = async (req, res) => {
  try {
    const serviceScores = req.query.serviceScores;

    if (!["1", "2", "3", "4", "5", "ALL"].includes(serviceScores)) {
      throw new Error(
        "Wrong Parameters. serviceScores should be ['1', '2', '3', '4', '5', 'ALL'] ."
      );
    }

    const response = await axios.get(
      `https://www.feefo.com/api/feedbacks/count/thatchers-motor-company` +
        `?displayFeedbackType=SERVICE&locale=en-gb&pageNumber=0&serviceScores=${serviceScores}&sort=newest&tags=%7B%7D&timeFrame=ALL&withMedia=false`
    );

    const result = response.data;

    res.status(200).json({ message: "Success!", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAverageRate = async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.feefo.com/api/feedbacks/stats/thatchers-motor-company" +
        "?children=exclude&displayFeedbackType=SERVICE&timeFrame=YEAR&withMedia=false"
    );

    const result = response.data;

    res.status(200).json({ message: "Success!", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getFeedbacks = async (req, res) => {
  try {
    const sort = req.query.sort;
    const pageNumber = Number(req.query.pageNumber);
    const lastDate = req.query.lastDate ? req.query.lastDate : "";
    const lastId = req.query.lastId ? req.query.lastId : "";
    const serviceScores = req.query.serviceScores;

    if (!["newest", "oldest"].includes(sort)) {
      throw new Error(
        "Wrong Parameters. sort should be ['newest', 'oldest'] ."
      );
    }

    if (!["1", "2", "3", "4", "5", "ALL"].includes(serviceScores)) {
      throw new Error(
        "Wrong Parameters. serviceScores should be ['1', '2', '3', '4', '5', 'ALL'] ."
      );
    }

    if (!(!isNaN(pageNumber) && pageNumber > 0)) {
      throw new Error(
        "Wrong Parameters. pageNumber should be a Number that is bigger than 0."
      );
    }

    const response = await axios.get(
      `https://www.feefo.com/api/feedbacks/lazy/thatchers-motor-company` +
        `?displayFeedbackType=SERVICE&locale=en-gb&pageNumber=${pageNumber}&sort=${sort}&tags=%7B%7D&timeFrame=ALL` +
        `&withMedia=false&lastDate=${lastDate}&lastId=${lastId}&serviceScores=${serviceScores}`
    );

    const result = response.data;

    res.status(200).json({ message: "Success!", data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
