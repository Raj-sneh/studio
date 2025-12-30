
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

  // Initialize Firebase App
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Initialize App Check on the client side
  if (isClient) {
    // This allows you to set a debug token in the browser console
    // self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    if (process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN;
    }

    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!recaptchaSiteKey) {
        console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. App Check may not work correctly. Using a placeholder key.");
    }

    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(
        recaptchaSiteKey || '6Le_88cqAAAAAP0g_9R1t4G5e23z1s2v5q7A6b3C' // A known placeholder
      ),
      isTokenAutoRefreshEnabled: true,
    });
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
