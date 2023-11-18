const dbFn = require('./firebaseRealtimeDatabaseInit');
const getRealtimeDatabase = require('./getRealtimeDatabase');

async function setRealtimeDatabase(paymentData) {
  const db = dbFn()
  const {
    id = null,
    amountTotal = null,
    customerDetails = null,
    metadata = null,
    paymentIntent = null,
    paymentStatus = null,
    shippingDetails = null,
    customFields = null,
    created = null
  } = paymentData

  try {
    const existingData = await getRealtimeDatabase(`orders/${metadata.userId}`)

    await db.ref(`orders/${metadata.userId}`).set({
    ...existingData,
    id,
    amountTotal,
    customerDetails,
    metadata,
    paymentIntent,
    paymentStatus,
    shippingDetails,
    customFields,
    created
    });
    console.log('setRealtimeDatabase');
  } catch (error) {
    console.error('setRealtimeDatabase err', error);
  }
}

module.exports = setRealtimeDatabase