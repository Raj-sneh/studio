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
      // IMPORTANT: Replace with your actual ReCaptcha Enterprise Site Key
      const enterpriseSiteKey = '6LdceDgsAAAAAG2u3dQNEXT6p7aUdIy1xgRoJmHE';
      
      try {
        initializeAppCheck(firebaseServices.firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(enterpriseSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized successfully.");
      } catch (error) {
        console.error("Firebase App Check initialization failed:", error);
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
