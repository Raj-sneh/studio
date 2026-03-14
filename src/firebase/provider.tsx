'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextState {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  user: User | null;
  isUserLoading: boolean;
  isFirebaseReady: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * The main Firebase Provider that manages the authentication state and provides
 * access to initialized Firebase services.
 */
export const FirebaseProvider: React.FC<{ 
  children: ReactNode; 
  firebaseApp: FirebaseApp; 
  auth: Auth; 
  firestore: Firestore; 
}> = ({ 
  children, 
  firebaseApp, 
  auth, 
  firestore 
}) => {
  const [userAuthState, setUserAuthState] = useState<{ user: User | null; isUserLoading: boolean; userError: Error | null; }>({ 
    user: null, 
    isUserLoading: true, 
    userError: null 
  });
  const [isFirebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUserAuthState({ user, isUserLoading: false, userError: null });
        setFirebaseReady(true);
      },
      (error) => {
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
        setFirebaseReady(true);
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => ({
    app: firebaseApp,
    auth,
    db: firestore,
    ...userAuthState,
    isFirebaseReady,
  }), [firebaseApp, auth, firestore, userAuthState, isFirebaseReady]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => {
    const { auth } = useFirebase();
    return auth;
}

export const useFirestore = () => {
    const { db } = useFirebase();
    return db;
}

export const useUser = () => {
  const { user, isUserLoading, userError, isFirebaseReady } = useFirebase();
  return { user, isUserLoading, userError, isFirebaseReady };
};
