const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const {
  findAndSelect,
  getAllArticles,
  prerender,
} = require("../helpers");

const { APP_URL, ENQUIRY_HANDLER_USER } = require("../config");

exports.prerender = async (req, res) => {
  const url = req.body.url;

  try {
    if (url) {
      // replace all "/" with "_" in URL to create a valid filename
      let fileName = url.replace(/\//g, "_");

      if (!fileName.endsWith("_")) {
        fileName = `${fileName}_`;
      }

      await prerender(`https://${APP_URL}${url}`, fileName);

      res.sendStatus(200);
    } else {
      res.status(400).send("Invalid URL");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error while trying to prerender the page" });
  }
};

exports.prerenderAll = async (req, res) => {
  try {
    let urls = [
      "",
      "vehicles-for-sale/",
      "vehicles-for-sale/used-trucks/",
      "vehicles-for-sale/used-cars/",
      "vehicles-for-sale/used-vans/",
      "sell-your-vehicle/",
      "shortlist/",
      "buy-online/",
      "motoring-hub/finance/",
      "motoring-hub/warranties/",
      "meet-the-team/",
      "contact-us/",
      "sitemap/",
      "disclaimer/",
      "privacy-policy/",
      "fca-disclaimer/",
      "faq/",
      "terms-and-conditions/",
    ];

    try {
      const articles = await getAllArticles();

      const reviews = ["motoring-hub/reviews/"];
      const videos = ["motoring-hub/videos/"];
      const news = ["motoring-hub/blog/"];

      articles.forEach((article) => {
        if (article.article_type === "review") {
          reviews.push(`news${article.url}/`);
        } else if (article.article_type === "video") {
          videos.push(`news${article.url}/`);
        } else if (article.article_type === "news") {
          news.push(`news${article.url}/`);
        }
      });

      urls = [...urls, ...reviews, ...videos, ...news];
    } catch (error) {
      console.log(error);
    }

    try {
      const results = await findAndSelect("vehicle", {}, "vehicle -_id");

      const vehicles = results.map(
        (vehicle) =>
          `vehicles-for-sale/viewdetail/${`used ${vehicle.vehicle.make} ${vehicle.vehicle.model} ${vehicle.vehicle.derivative}   ${vehicle.vehicle.transmissionType} ${vehicle.vehicle.fuelType}`
            .toLowerCase()
            .replace(/[^0-9a-zA-Z \-]/g, "")
            .replace(/\s/g, "-")}/${vehicle.vehicle.vin}/`
      );

      urls = [...urls, ...vehicles];
    } catch (error) {
      console.log(error);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (let url of urls) {
      await page.goto(`https://${APP_URL}/${url}`, {
        waitUntil: "networkidle2",
      });

      let content = await page.content();

      // replace all instances of the class for stars
      content = content.replace(
        /class="cursor-pointer text-yellow-700 w-6 h-6"/g,
        'class="cursor-pointer text-yellow-700" width="24px" height="24px"'
      );

      // replace all "/" with "_" in URL to create a valid filename
      const fileName = `/${url}`.replace(/\//g, "_");
      fs.writeFileSync(`./prerendered_pages/${fileName}.html`, content);
    }
    await browser.close();
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error while trying to prerender the page" });
  }
};

exports.sendHTML = async (req, res) => {
  try {
    const url = req.originalUrl.replace("/api/seo/html", "");
    let fileName = url.replace(/\//g, "_");

    if (!fileName.endsWith("_")) {
      fileName = `${fileName}_`;
    }
    const filePath = path.join(
      __dirname,
      `../prerendered_pages/${fileName}.html`
    );

    console.log("File does not exist");

    await prerender(`https://${APP_URL}${url}`, fileName);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send("File does not exist");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
