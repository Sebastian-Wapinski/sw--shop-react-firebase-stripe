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

app.post('/create-checkout-session', async (req, res) => {
  const {userId, items} = req.body
  
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
    payment_method_types: ['card', 'p24'],
    mode: 'payment',
    line_items: lineItems,
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    shipping_address_collection: { allowed_countries: ['GB', 'US', 'PL', 'DE'] },
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

const emailCustomerAboutFailedPayment = () => {
  console.log('Emailing customer sends')
}

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

    case 'payment_intent.payment_failed': {
      // const session = event.data.object
      emailCustomerAboutFailedPayment()
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}`)
      break
  }

  res.status(200).end()
})

app.listen(8080, () => console.log('Running on port:', 8080))
