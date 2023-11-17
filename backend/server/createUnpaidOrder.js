const dbFn = require('../firebaseRealtimeDatabaseInit');

async function createUnpaidOrder(lineItems, uniqueId) {
  const db = dbFn()

  try {
    await db.ref(`orders/${uniqueId}`).set({
      lineItems: lineItems,
      userId: uniqueId,
      paymentStatus: 'pending'
    });
    console.log('pending');
  } catch (error) {
    console.error('pending err', error);
  }
}

module.exports = createUnpaidOrder