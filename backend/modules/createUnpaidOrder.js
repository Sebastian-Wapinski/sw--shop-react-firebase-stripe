const dbFn = require('./firebaseRealtimeDatabaseInit');

async function createUnpaidOrder(lineItems, uniqueId) {
  const db = dbFn()

  try {
    await db.ref(`orders/${uniqueId}`).set({
      lineItems: lineItems,
      paymentStatus: 'pending'
    });
  } catch (error) {
    console.error('pending err', error);
  }
}

module.exports = createUnpaidOrder