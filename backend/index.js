require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors({
  origin: true
}))
app.use(
  express.json({
    verify: (req, res, buffer) => {
      req.rawBody = buffer;
    },
  })
);
const createCheckoutSession = require('./modules/createCheckoutSession')
const nodemailer = require('nodemailer');
const { google } = require('googleapis')
const webhook = require('./modules/webhook')

app.post('/create-checkout-session', createCheckoutSession)

const emailCustomerAboutFailedPayment = async (customerEmail) => {
  const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI)
  oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN})

  const accessToken = await oAuth2Client.getAccessToken()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'sebwap.it.testing@gmail.com',
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken
    }
   });

  const mailOptions = {
    from: 'sebwap.it.testing@gmail.com',
    to: 'sebastian.wapinski@interia.pl',
    subject: 'Sorry testuje aplikację i zapomniałem zmienić gmail.com na interia.pl :)',
    text: 'Sorry testuje aplikację i zapomniałem zmienić gmail.com na interia.pl :)'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

app.post('/webhook', webhook)

app.listen(8080, () => console.log('Running on port:', 8080))
