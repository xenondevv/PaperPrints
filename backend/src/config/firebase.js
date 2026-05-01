const path = require('path');
const admin = require('firebase-admin');
const env = require('./env');

// Initialize Firebase Admin SDK
// You need to download your service account key from:
// Firebase Console → Project Settings → Service Accounts → Generate new private key
//
// Then set the path in your .env:   FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccount.json
// OR set the JSON content inline:   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

let app;

if (env.firebase?.serviceAccountJson) {
  // Inline JSON from env var (recommended for production/Docker)
  const serviceAccount = JSON.parse(env.firebase.serviceAccountJson);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (env.firebase?.serviceAccountPath) {
  // File path (convenient for local dev)
  const serviceAccount = require(path.resolve(process.cwd(), env.firebase.serviceAccountPath));
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  // Will fail at runtime if neither is set — surface a clear error
  app = admin.initializeApp();
}

module.exports = admin;
