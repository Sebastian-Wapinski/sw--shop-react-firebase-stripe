const dbFn = require("./firebaseRealtimeDatabaseInit");
const getRealtimeDatabase = require("./getRealtimeDatabase");
const createUnpaidOrder = require('./createUnpaidOrder')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

async function createCheckoutSession(req, res) {
  const {items} = req.body
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
    success_url: `${process.env.DOMAIN}?success=true`,
    cancel_url: `${process.env.DOMAIN}?canceled=true`,
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

  await createUnpaidOrder(lineItems, uniqueId)

  res.json({ url: session.url })
}

module.exports = createCheckoutSession