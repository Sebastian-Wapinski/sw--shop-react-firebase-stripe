const stripeAPI = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

module.exports = stripeAPI;