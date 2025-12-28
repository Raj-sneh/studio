'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseServices.firebaseApp) {
      
      // FOR DEBUGGING ON LOCALHOST:
      // 1. Activate Debug Mode for App Check
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      console.log("App Check debug mode activated.");

      // 2. Intercept console logs to find and alert the debug token.
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('AppCheck debug token')) {
          alert("COPY THIS TOKEN (then add to Firebase Console > App Check): " + args[0]);
        }
        originalLog.apply(console, args);
      };

      // IMPORTANT: Replace with your actual ReCaptcha Enterprise Site Key
      const enterpriseSiteKey = '6LdceDgsAAAAAG2u3dQNEXT6p7aUdIy1xgRoJmHE';
      
      try {
        initializeAppCheck(firebaseServices.firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(enterpriseSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized successfully.");
      } catch (error) {
        console.warn("Firebase App Check may have already been initialized.", error);
      }
    }
  }, [firebaseServices.firebaseApp]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
