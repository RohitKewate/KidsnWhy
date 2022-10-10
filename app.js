const express = require("express");
const { google } = require("googleapis");

const path = require("path");

const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const credn = require("./credn.js");
const OAuth2 = google.auth.OAuth2;

const OAuth2_client = new OAuth2(
  credn.clientId,
  credn.clientSecret,
  credn.redirectUrl
);
OAuth2_client.setCredentials({ refresh_token: credn.refreshToken });
const app = express();

const port = process.env.PORT || 8080;

//Middleware
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//Routes
app.get("/", function (req, res) {
  res.render("index");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.post("/contact", async function (req, res) {
  try {
    const userMessage = req.body;
    const output = `
     <p>You have a new Contact Request</p>
     <h1>Contact Details</h1>

     <ul>
       <li>Name: ${userMessage.name}</li>
       <li>Phone Number: ${userMessage.number}</li>
       <li>Email: ${userMessage.email}</li>
     </ul>
     
     <p>Message: ${userMessage.message}</p>

     
  `;

    console.log(userMessage);

    const accessToken = OAuth2_client.getAccessToken();
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: credn.user, // generated ethereal user
        clientId: credn.clientId,
        clientSecret: credn.clientSecret,
        refreshToken: credn.refreshToken,
        accessToken: accessToken,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: userMessage.email, // sender address
      to: credn.user, // list of receivers
      subject: "Enquiry", // Subject line
      text: "Hello?", // plain text body
      html: output, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    res.redirect("/confirm");
  } catch (error) {
    return error;
  }
});

app.get("/confirm", function (req, res) {
  res.render("confirm");
});

//Status Errors
app.use(function (req, res) {
  res.status(404).render("404");
});

app.use(function (error, req, res, next) {
  res.status(505).render("500");
});

//port
app.listen(port, function () {
  console.log(`Server running on port: ${port}`);
});
