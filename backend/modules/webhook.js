const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)
const setRealtimeDatabase = require('./setRealtimeDatabase')
const sendEmail = require('./sendEmail')

const createOrder = (session) => {
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
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      createOrder(session)
      const email = session.customer_details.email

      if (session.payment_method_options.customer_balance && session.payment_method_options.customer_balance.funding_type === 'bank_transfer') {
        sendEmail(email, 'Payment Bank Transfer Method', `Please transfer the money to the following bank details: ${session.url}`)
      }

      if (session.payment_status === 'paid') {
        sendEmail(email, 'Payment Succeed', `Your order has been received and is now being processed. Payment status: ${session.payment_status}`)
      }
      break
    }

    case 'charge.failed': {
      const session = event.data.object
      const email = session.billing_details.email
      sendEmail(email, 'Payment Decline', 'Sorry, but your payment was declined. Please try again.')
      break
    }

    default:
      console.log(`Unhandled event type ${event.type}`)
      break
  }

  res.status(200).end()
}

module.exports = webhook