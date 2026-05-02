import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase config — shared "paper-prints-app" project.
// The web API key is different from the Android key.
// To get the web API key:
//   1. Go to https://console.firebase.google.com
//   2. Open "paper-prints-app" project
//   3. Project Settings → General → Your apps
//   4. If no Web app exists: click "Add app" → Web → Register
//   5. Copy the apiKey and appId from the config snippet
//   6. Paste into vendor-web/.env.local as NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_APP_ID

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: 'paper-prints-app.firebaseapp.com',
  projectId: 'paper-prints-app',
  storageBucket: 'paper-prints-app.firebasestorage.app',
  messagingSenderId: '1058165391039',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app = null;
let auth = null;
let googleProvider = null;
let initError = null;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase API key is missing. Add NEXT_PUBLIC_FIREBASE_API_KEY to .env.local');
  }
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.error('Firebase initialization failed:', err.message);
  initError = err.message;
}

export { app, auth, googleProvider, initError };
