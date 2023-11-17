const admin = require('firebase-admin')
const serviceAccount = require('./secrets/secretAdminKeyShop.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sw-shop-react-firebase-stripe-default-rtdb.europe-west1.firebasedatabase.app'
})

function dbFn() {
  return admin.database();
}

module.exports = dbFn