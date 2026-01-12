'use client';

import { useEffect, useState, type ReactNode } from "react";
import { useAuth, useUser, setDocumentNonBlocking, initiateAnonymousSignIn, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user && auth && firestore) {
      initiateAnonymousSignIn(auth)
        .then(userCredential => {
          const newUser = userCredential.user;
          const userDocRef = doc(firestore, "users", newUser.uid);
          setDocumentNonBlocking(userDocRef, {
            id: newUser.uid,
            displayName: 'Guest User',
            email: `guest_${newUser.uid}@example.com`,
            createdAt: new Date().toISOString(),
            phoneNumber: '',
          }, { merge: true });
        })
        .catch(error => {
          console.error("Anonymous sign-in failed", error);
          setError("Could not sign in automatically. Please refresh the page.");
        });
    }
  }, [user, isUserLoading, auth, firestore]);
  
  if (isUserLoading || (!user && !error)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <>
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="mt-4 text-muted-foreground">Loading Sargam...</p>
          </>
        )}
      </div>
    );
  }
  
  return <>{children}</>;
}
