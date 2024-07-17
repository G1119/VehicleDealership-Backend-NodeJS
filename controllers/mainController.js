const {
  ENQUIRY_HANDLER_USER,
  APP_URL,
  POSTCODE,
  BRANCH,
} = require("../config");
const { SitemapStream } = require("sitemap");
const { createGzip } = require("zlib");
const {
  findOne,
  findAndSelect,
  lookupPostcode,
  validatePostcode,
  calcRoadDistance,
  isValidEmail,
  sendEmail,
  getAllArticles,
} = require("../helpers");

exports.postcode = async (req, res) => {
  try {
    const validation = await validatePostcode(req.query.postcode);
    if (validation) {
      const result = await lookupPostcode(req.query.postcode);
      res.status(200).json({ message: "success", result });
    } else {
      throw new Error("Invalid postcode");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.validatePostcode = async (req, res) => {
  try {
    const { postcode } = req.body;

    if (!postcode) {
      throw new Error("Missing value of postcode");
    }

    const validation = await validatePostcode(postcode);
    if (validation) {
      const result = await lookupPostcode(postcode);
      res.status(200).json({
        message: "Valid postcode",
        data: { Town: result.Town, County: result.County },
      });
    } else {
      throw new Error("The postcode is not valid in UK.");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.generateSitemapXML = async (req, res) => {
  try {
    let sitemap = new SitemapStream({
      hostname: `https://${APP_URL}/`,
    });
    const pipeline = sitemap.pipe(createGzip());

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

    const currentDate = new Date().toISOString();
    for (let url of urls) {
      sitemap.write({ url: `/${url}`, lastmodISO: currentDate });
    }

    // ensure you attach a write stream such as streamToPromise or createGzip
    sitemap.end();

    // stream the response
    res.header("Content-Type", "application/xml");
    res.header("Content-Encoding", "gzip");
    pipeline.pipe(res).on("error", (e) => {
      throw e;
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occurred while generating sitemap.");
  }
};

exports.handleEnquiry = async (req, res) => {
  try {
    const {
      isDelivery,
      title,
      name,
      email,
      phoneNumber,
      type,
      note,
      make,
      model,
      reg,
      phoneChecked,
      emailChecked,
      smsChecked,
      letterChecked,
    } = req.body;
    if (
      !name ||
      (!isValidEmail(email) && email) ||
      !email ||
      phoneNumber.length <= 1 ||
      (!["TMC Oakhanger (Head Office)"].includes(isDelivery) && isDelivery) ||
      !isDelivery ||
      (!["Mr", "Miss", "Mrs", "Ms", "Dr"].includes(title) && title) ||
      !title
    ) {
      throw new Error("Incorrect Form Format");
    } else {
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
                      <td class="m_1815589142183751782hero-subheader__title" style="font-size:43px;font-weight:bold;padding:80px 0 15px 0" align="left">Website Enquiry</td>
                  </tr>
                  <tr>
                      <td class="m_1815589142183751782hero-subheader__content" style="font-size:16px;line-height:27px;color:#969696;padding:0 60px 90px 0" align="left">
                          <p>A client has submitted an enquiry from the website. Please contact back as soon as possible.</p>
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
                                      <strong>Name:</strong> ${title} ${name} <br>
                                      <strong>Email Address:</strong> <a href="mailto:${email}" target="_blank">${email}</a><br>
                                      <strong>Phone Number:</strong> ${phoneNumber} <br>
                                      </p>
                                  </td>
                              </tr>
                          </tbody></table>
                      </td>
                  </tr>
              </tbody></table>

              <table class="m_1815589142183751782container m_1815589142183751782title-block" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tbody><tr>
                      <td align="center" valign="top">
                          <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                              <tbody><tr>
                                  <td style="border-bottom:solid 1px #eeeeee;padding:0 0 18px 0;font-size:26px" align="left">Enquiry Details</td>
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
                                      <strong style="font-size:20px">Vehicle Information</strong><br>
                                      <strong>Make:</strong> ${make}<br>
                                      <strong>Model:</strong> ${model}<br>
                                      <strong>Registration Number:</strong> ${reg}<br>
                                      <br>
                                      <strong>To:</strong> ${isDelivery} <br>
                                      <strong>Additional Note:</strong> ${note} <br>
                                      <br>
                                      <strong style="font-size:20px">Future Contact Preferences:</strong><br>
                                      <strong>Phone:</strong> ${
                                        phoneChecked ? "YES" : "No"
                                      } <br>
                                      <strong>Email:</strong> ${
                                        emailChecked ? "YES" : "No"
                                      } <br>
                                      <strong>SMS:</strong> ${
                                        smsChecked ? "YES" : "No"
                                      } <br>
                                      <strong>Letter:</strong> ${
                                        letterChecked ? "YES" : "No"
                                      } <br>
                                      <br>
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

      await sendEmail(`Subject: ${type}`, mail, ENQUIRY_HANDLER_USER);

      res.status(200).json({ message: "success" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.sendMail = async (req, res) => {
  try {
    if (
      !req.body.To ||
      !req.body.title ||
      !req.body.Body ||
      req.body.Body === ""
    ) {
      throw new Error("Incorrect request body.");
    }

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
                      <td class="m_1815589142183751782hero-subheader__title" style="font-size:43px;font-weight:bold;padding:80px 0 15px 0" align="left">${req.body.title}</td>
                  </tr>
                  <tr>
                      <td class="m_1815589142183751782hero-subheader__content" style="font-size:25px;line-height:27px;color:#969696;padding:0 60px 90px 0" align="left">
                          <p>Thank you for using our service.</p>
                      </td>
                  </tr>
              </tbody></table>
              
              <table class="m_1815589142183751782container m_1815589142183751782title-block" border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tbody><tr>
                      <td align="center" valign="top">
                          <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                              <tbody><tr>
                                  <td style="border-bottom:solid 1px #eeeeee;padding:0 0 18px 0;font-size:26px" align="left">Details</td>
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
                                      ${req.body.Body}
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

    await sendEmail(req.body.title, mail, req.body.To, "TMC Sales Assistant");
    await sendEmail(
      `${req.body.title} - ${req.body.To}`,
      mail,
      ENQUIRY_HANDLER_USER,
      "TMC Sales Assistant"
    );

    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.calcRoadDistance = async (req, res) => {
  try {
    const { postcode, vin } = req.body;

    const branches = BRANCH.split(",");
    const postcodes = POSTCODE.split(",");

    if (branches.length === 0) throw new Error("Internal Server Error");

    let branch;

    if (!vin) {
      branch = postcodes[0];
    } else {
      if (vin.length !== 17) {
        throw new Error("Wrong Parameters.");
      }

      const item = await findOne("vehicle", { vin: vin.toUpperCase() });

      if (!item) {
        throw new Error("Not found the vehicle.");
      }

      branch = item.vehicle.branch;
    }

    let forecourt_postcode;

    if (branches.indexOf(branch) > -1) {
      forecourt_postcode = postcodes[branches.indexOf(branch)];
    } else {
      //default forecourt postcode for OAKHANGER
      forecourt_postcode = postcodes[0];
    }

    const validation = await validatePostcode(postcode);

    if (validation) {
      const result = await calcRoadDistance(postcode, forecourt_postcode);
      res.status(200).json({ message: "success", result });
    } else {
      throw new Error("Invalid postcode in UK");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
