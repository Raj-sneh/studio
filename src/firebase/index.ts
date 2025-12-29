
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const isClient = typeof window !== 'undefined';
  let firebaseApp: FirebaseApp;

  if (!getApps().length) {
    // Attempt to initialize using hosting variables, otherwise use local config.
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  // Initialize App Check only on the client side, after the app is initialized.
  if (isClient) {
    if ((self as any).FIREBASE_APPCHECK_DEBUG_TOKEN) {
      // Debug token is already set, just initialize.
      initializeAppCheck(firebaseApp, { isTokenAutoRefreshEnabled: true });
      console.log('App Check initialized in debug mode.');
    } else {
      const key = process.env.NODE_ENV === 'development'
        ? process.env.NEXT_PUBLIC_RECAPTCHA_DEV_SITE_KEY
        : '6Ldv2h8qAAAAAPx0Z3An-p4E1bEP_J_e_1t2t3Y4'; // Production key

      if (key) {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaV3Provider(key),
          isTokenAutoRefreshEnabled: true,
        });
        console.log('App Check with reCAPTCHA initialized.');
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('NEXT_PUBLIC_RECAPTCHA_DEV_SITE_KEY is not set. App Check will not work in development.');
      }
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
