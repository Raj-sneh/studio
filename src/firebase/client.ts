import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * @fileOverview Unified Firebase initialization for both client components and server-side API routes.
 * 
 * Provides a stable, singleton instance of Firebase services. 
 * Explicitly typed exports prevent "implicit any" errors during Next.js builds.
 */

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

/**
 * Initializes Firestore with settings optimized for Studio environments.
 * Uses a safe initialization pattern to prevent "Firestore already started" errors.
 */
const initializeDatabase = (): Firestore => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (e) {
    return getFirestore(app);
  }
};

const db: Firestore = initializeDatabase();

export { app, auth, db, storage };
