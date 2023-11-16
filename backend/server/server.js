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


// const admin = require('firebase-admin')
// const serviceAccount = require('../secrets/secretAdminKeyShop.json')

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://sw-shop-react-firebase-stripe-default-rtdb.europe-west1.firebasedatabase.app'
// })

const storeItems = new Map([
  ['-NjCGEf3bunbUFs16xXA', { priceInCents: 10000, name: 'Learn React Today' }],
  ['-NjCGEf4G2tGGxFlb_Iy', { priceInCents: 20000, name: 'Learn CSS Today' }]
])

app.post('/create-checkout-session', async (req, res) => {
  const {userId, items} = req.body
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'p24'],
    mode: 'payment',
    line_items: items.map(item => {
      const storeItem = storeItems.get(item.id)
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: storeItem.name
          },
          unit_amount: storeItem.priceInCents
        },
        quantity: item.quantity
      }
    }),
    success_url: `${YOUR_DOMAIN}?success=true`,
    shipping_address_collection: { allowed_countries: ['GB', 'US', 'PL', 'DE'] },
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    custom_fields: [
      {
        key: 'additionalInfo',
        label: {
          type: 'custom',
          custom: 'Additional Information',
        },
        type: 'text'
      },
    ],
    metadata: {
      userId: userId
    }
  })

  res.json({ url: session.url })
})

const endpointSecret = 'whsec_6bHqtF5vjxJYl3gIxdMxL0RlAwM4sIMg'

const fulfillOrder = (lineItems) => {
  console.log('Fulfilling order', lineItems)
}

const createOrder = (session) => {
  console.log('Creating order', session)
}

const emailCustomerAboutFailedPayment = (session) => {
  console.log('Emailing customer', session)
}

app.post('/webhook', async (req, res) => {
  const payload = req['rawBody']
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
  } catch (err) {
    console.log(err);
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

    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object
      fulfillOrder(session)
      break
    }

    case 'checkout.session.async_payment_failed': {
      const session = event.data.object
      emailCustomerAboutFailedPayment(session)
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}`)
      break
  }

  res.status(200).end()
})

app.listen(8080, () => console.log('Running on port:', 8080))
