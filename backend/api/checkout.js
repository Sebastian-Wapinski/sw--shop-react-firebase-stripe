const stripeAPI = require('../stripe');

async function createCheckoutSession(req, res) {
  const domainUrl = process.env.DOMAIN;
  const { line_items, customer_email } = req.body;

  if (!line_items || !customer_email) {
    return res.status(400).json({ error: 'missing required session parameters' });
  }

  let session; 

  const storeItems = new Map([
    ['-NjCGEf3bunbUFs16xXA', { priceInCents: 10000, name: 'Learn React Today' }],
    ['-NjCGEf4G2tGGxFlb_Iy', { priceInCents: 20000, name: 'Learn CSS Today' }]
  ])

  try {
    session = await stripeAPI.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: req.body.items.map(item => {
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
      customer_email,
      success_url: `${domainUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domainUrl}/canceled`,
      shipping_address_collection: { allowed_countries: ['GB', 'US', 'PL', 'DE'] }
    }); 
    res.status(200).json({ sessionId: session.id, });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: 'Error occurred, unable to create session!!!'});
  }
}

module.exports = createCheckoutSession;