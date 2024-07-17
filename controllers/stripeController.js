const {
  STRIPE_SECRET_KEY,
  ENQUIRY_HANDLER_USER,
  APP_URL,
} = require("../config");
const {
  insertNewDocument,
  updateDocument,
  findOne,
  reserveFromCMS,
  sendEmail,
  retrieveVehicleByVinFromCMS,
} = require("./../helpers");
const stripe = require("stripe")(STRIPE_SECRET_KEY);

exports.createIntent = async (req, res) => {
  try {
    const {
      type,
      term,
      deposit,
      isDelivery,
      date,
      bestTime,
      note,
      phone,
      mail,
      sms,
      letter,
      vin,
      fname,
      sname,
      email,
      phoneNumber,
      postcode,
      address1,
      address2,
      town,
      county,
      messages,
      px,
    } = req.body;

    if (!vin) {
      throw new Error("Have you selected a vehicle to reserve?");
    }

    if (vin.length !== 17) {
      throw new Error("The value of vin is wrong.");
    }

    const item = await findOne("vehicle", { vin });

    if (!item) {
      throw new Error("The vehicle is not available.");
    }

    const result = await retrieveVehicleByVinFromCMS(item.vehicle.vin);

    if (result) {
      if (result.status && result.status === "sold") {
        throw new Error("The vehicle is already sold out.");
      }

      if (result.status && result.status === "reserved") {
        throw new Error("The vehicle is already reserved.");
      }
    }

    if (!fname || (!email && !phoneNumber) || !postcode) {
      throw new Error(
        `You need to tell Aime your ${`${!fname ? "Name," : ""} ${
          !email && !phoneNumber ? "Email(or Phone number)," : ""
        } ${!postcode ? "Postcode," : ""}`.slice(0, -1)} before reserve.`
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      // amount: req.body.amount,
      amount: 14900,
      currency: "gbp",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const paymentRecord = {
      //stripe
      client_secret: paymentIntent.client_secret,
      amount: 14900,
      //checkout info
      type,
      isDelivery,
      date, //scheduled date
      bestTime,
      note,
      preferredContactMethods: [phone, mail, sms, letter],
      //vehicle info
      vin: item.vehicle.vin,
      vehicleType: item.vehicle.vehicleType,
      make: item.vehicle.make,
      model: item.vehicle.model,
      registration: item.vehicle.registration,
      colour: item.vehicle.colour,
      cashPrice: `${item.adverts.forecourtPrice.amountGBP || 0}${
        item.adverts.forecourtPriceVatStatus === "Ex VAT" ? " +VAT" : ""
      }`,
      //customer detail
      fname,
      sname,
      email,
      phoneNumber,
      postcode,
      address1,
      address2,
      town,
      county,
      messages: messages || [],
      px,
    };

    if (type === "finance") {
      paymentRecord.term = term;
      paymentRecord.deposit = deposit;
    }

    await insertNewDocument("payment", paymentRecord);
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.confirmIntent = async (req, res) => {
  try {
    const client_secret = req.query.payment_intent_client_secret;
    if (client_secret) {
      const payment = await findOne("payment", {
        client_secret,
      });
      if (!payment) {
        throw new Error("Incorrect client_secret");
      }

      if (payment.status !== "pending") {
        throw new Error("Already confirmed");
      }

      await updateDocument("payment", { _id: payment._id }, { status: "done" });
      await reserveFromCMS(payment.vin);
      const item = await findOne("vehicle", { vin: payment.vin });
      await updateDocument(
        "vehicle",
        { vin: payment.vin },
        { vehicle: { ...item.vehicle, ...{ status: "reserved" } } }
      );

      let date;

      if (payment.date === "") {
        date = payment.date;
      } else {
        const timestamp = payment.date;

        const dateInUTC = new Date(timestamp);
        const dateInCET = new Date(dateInUTC.getTime() + 60 * 60 * 1000);

        date = dateInCET.toISOString().slice(0, 10);
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
                                      <strong>First Name:</strong> ${
                                        payment.fname
                                      } <br>
                                      <strong>Surname:</strong> ${
                                        payment.sname
                                      } <br>
                                      <strong>Email Address:</strong> <a href="mailto:${
                                        payment.email
                                      }" target="_blank">${
        payment.email
      }</a><br>
                                      <strong>Phone Number:</strong> ${
                                        payment.phoneNumber
                                      } <br>
                                      <strong>Postcode:</strong> ${
                                        payment.postcode
                                      } <br>
                                      <strong>Address1:</strong> ${
                                        payment.address1
                                      } <br>
                                      <strong>Address2:</strong> ${
                                        payment.address2
                                      } <br>
                                      <strong>Town:</strong> ${
                                        payment.town
                                      } <br>
                                      <strong>County:</strong> ${
                                        payment.county
                                      } <br>
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
                                      <strong>Type:</strong> ${payment.type.toUpperCase()} <br>
                                      ${
                                        payment.type === "finance"
                                          ? `<strong>Term:</strong> ${payment.term} months <br> <strong>Deposit (excl VAT):</strong> £ ${payment.deposit} <br>`
                                          : ""
                                      }
                                      <strong>Payment:</strong>  £ ${
                                        payment.amount / 100
                                      } <br>
                                      <strong>Stripe Transaction Id:</strong> ${
                                        payment.client_secret
                                      } <br>
                                      <br>
                                      <strong style="font-size:20px">Vehicle Information</strong><br>
                                      <strong>Vin:</strong> ${payment.vin}<br>
                                      <strong>Vehicle Type:</strong> ${
                                        payment.vehicleType
                                      }<br>
                                      <strong>Make:</strong> ${payment.make}<br>
                                      <strong>Model:</strong> ${
                                        payment.model
                                      }<br>
                                      <strong>VRN:</strong> ${
                                        payment.registration
                                      }<br>
                                      <strong>Colour:</strong> ${
                                        payment.colour
                                      }<br>
                                      <strong>Cash Price:</strong> £ ${
                                        payment.cashPrice
                                      } <br>
                                      <br>
                                      <strong>How would like to get this vehicle:</strong> ${
                                        payment.isDelivery
                                      } <br>
                                      <strong>When would like to get this vehicle on:</strong> ${date} (CET) <br>
                                      <strong>Best time to contact:</strong> ${
                                        payment.bestTime
                                      } <br>
                                      <strong>Additional Note:</strong> ${
                                        payment.note
                                      } <br>
                                      <br>
                                      <strong style="font-size:20px">Future Contact Preferences:</strong><br>
                                      <strong>Phone:</strong> ${
                                        payment.preferredContactMethods[0] ===
                                        "true"
                                          ? "YES"
                                          : "No"
                                      } <br>
                                      <strong>Email:</strong> ${
                                        payment.preferredContactMethods[1] ===
                                        "true"
                                          ? "YES"
                                          : "No"
                                      } <br>
                                      <strong>SMS:</strong> ${
                                        payment.preferredContactMethods[2] ===
                                        "true"
                                          ? "YES"
                                          : "No"
                                      } <br>
                                      <strong>Letter:</strong> ${
                                        payment.preferredContactMethods[3] ===
                                        "true"
                                          ? "YES"
                                          : "No"
                                      } <br>
                                      <br>
                                      </p>
                                  </td>
                              </tr>
                          </tbody></table>
                      </td>
                  </tr>
              </tbody></table>
              
              ${
                payment.px
                  ? `<table class="m_1815589142183751782container m_1815589142183751782title-block" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tbody><tr>
                  <td align="center" valign="top">
                      <table class="m_1815589142183751782container" border="0" cellpadding="0" cellspacing="0" style="width:80%">
                          <tbody><tr>
                              <td style="border-bottom:solid 1px #eeeeee;padding:0 0 18px 0;font-size:26px" align="left">Client Vehicle Information for Parts Exchange</td>
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
                                  <strong>VRN:</strong> ${payment.px.vrn} <br>
                                  <strong>Mileage:</strong> ${parseInt(
                                    payment.px.mileage || 0
                                  ).toLocaleString()} <br>
                                  <strong>Trading Price:</strong> ${
                                    payment.px.cost
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
                                      ${payment.messages
                                        .map((message) => {
                                          if (message.isBot)
                                            return `<strong>Aime:</strong> ${message.text} <br><br>`;
                                          else
                                            return `<strong>Client(${payment.fname}):</strong> ${message.text} <br>`;
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
        `Subject: ${payment.type.toUpperCase()}`,
        mail,
        ENQUIRY_HANDLER_USER
      );

      let url = `https://${APP_URL}/checkout/${payment.vin}?type=${payment.type}&payment_intent_client_secret=${client_secret}`;

      if (payment.type === "finance") {
        url = `${url}&term=${payment.term}&deposit=${payment.deposit}`;
      }

      if (req.query.bot === client_secret) {
        url = `${url}&bot=${client_secret}`;
      }

      res.redirect(302, url);
    } else {
      throw new Error("Incorrect Parms");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
