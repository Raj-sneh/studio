import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Unified Firebase initialization for both client components and server-side API routes.
 * Uses hardcoded config from config.ts for stability in Studio environments.
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let db;
try {
  // Force long polling for reliable connectivity in cloud environments
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, db, storage };
