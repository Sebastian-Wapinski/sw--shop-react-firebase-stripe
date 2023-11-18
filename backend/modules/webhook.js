const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)
const setRealtimeDatabase = require('./modules/setRealtimeDatabase')

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

async function webhook(req, res) {
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
      // console.log('email', email);
      await emailCustomerAboutFailedPayment(email)
      break
    }

    default:
      console.log(`Unhandled event type ${event.type}`)
      break
  }

  res.status(200).end()
}

module.exports = webhook