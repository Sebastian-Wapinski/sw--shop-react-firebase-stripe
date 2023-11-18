const nodemailer = require('nodemailer');
const { google } = require('googleapis')

async function sendEmail(customerEmail, subject, text) {
  const oAuth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI)
  oAuth2Client.setCredentials({refresh_token: process.env.REFRESH_TOKEN})

  const accessToken = await oAuth2Client.getAccessToken()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.MY_EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken
    }
   });

  const mailOptions = {
    from: process.env.MY_EMAIL,
    to: customerEmail,
    subject,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail