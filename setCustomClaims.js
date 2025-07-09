// setCustomClaims.js
// Usage: node setCustomClaims.js <uid> <role> <businessId>
const admin = require('./firebaseAdmin');

const [,, uid, role, businessId] = process.argv;
if (!uid || !role || !businessId) {
  console.error('Usage: node setCustomClaims.js <uid> <role> <businessId>');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { role, businessId })
  .then(() => {
    console.log(`Custom claims set for UID: ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
