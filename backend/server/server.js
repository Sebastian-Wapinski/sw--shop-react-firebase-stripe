require('dotenv').config()

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors({
  origin: 'http://localhost:3000'
}))
app.use(
  express.json({
    verify: (req, res, buffer) => {
      req.rawBody = buffer;
    },
  })
);
const YOUR_DOMAIN = 'http://localhost:3000'
const getRealtimeDatabase = require('./getRealtimeDatabase')
const setRealtimeDatabase = require('./setRealtimeDatabase')
const dbFn = require('../firebaseRealtimeDatabaseInit');
const createUnpaidOrder = require('./createUnpaidOrder')
const nodemailer = require('nodemailer');
const { google } = require('googleapis')

app.post('/create-checkout-session', async (req, res) => {
  const {customerEmail, items} = req.body
  const customer = await stripe.customers.create();
  
  const firebaseData = await getRealtimeDatabase('productsPrices')

  const storeItems = new Map(Object.entries(firebaseData))

  const db = dbFn()
  const uniqueId = db.ref().push().key;

  const lineItems = items.map(item => {
    const storeItem = storeItems.get(item.id)
    return {
      price_data: {
        currency: 'eur',
        product_data: {
          name: storeItem.name
        },
        unit_amount: storeItem.price
      },
      quantity: item.quantity
    }
  })

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card', 'customer_balance'],
    payment_method_options: {
      customer_balance: {
        funding_type: 'bank_transfer',
        bank_transfer: {
          type: 'eu_bank_transfer',
          eu_bank_transfer: {
            country: 'DE',
          },
        },
      },
    },
    mode: 'payment',
    line_items: lineItems,
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    shipping_address_collection: { allowed_countries: ['PL'] },
    custom_fields: [
      {
        key: 'additionalInfo',
        optional: true,
        label: {
          type: 'custom',
          custom: 'Additional Information',
        },
        type: 'text'
      },
    ],
    metadata: {
      userId: uniqueId
    }
  })

  createUnpaidOrder(lineItems, uniqueId)

  res.json({ url: session.url })
})

const fulfillOrder = (lineItems) => {
  console.log('Fulfilling order')
}

const createOrder = (session) => {
  console.log('Creating order', session)
  const {
    id,
    amount_total,
    customer_details,
    metadata,
    payment_intent,
    payment_status,
    shipping_details,
    custom_fields,
    created
  } = session

  const orderData = {
    id,
    amountTotal: amount_total,
    customerDetails: customer_details,
    metadata,
    paymentIntent: payment_intent,
    paymentStatus: payment_status,
    shippingDetails: shipping_details,
    customFields: custom_fields,
    created
  }

  setRealtimeDatabase(orderData)
}

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

app.post('/webhook', async (req, res) => {
  const payload = req['rawBody']
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.ENDPOINT_SECRET)
  } catch (err) {
    console.log(err, 'Error');
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      createOrder(session)

      if (session.payment_status === 'paid') {
        fulfillOrder(session)
      }
      break
    }

    case 'charge.failed': {
      const session = event.data.object
      // console.log('failed obj', session);
      const email = session.billing_details.email
      console.log('email', email);
      // await emailCustomerAboutFailedPayment(email)
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}`)
      break
  }

  res.status(200).end()
})

app.listen(8080, () => console.log('Running on port:', 8080))
