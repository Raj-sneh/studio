
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, setDocumentNonBlocking, initiateAnonymousSignIn } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import SButtonIcon from "@/components/icons/SButtonIcon";

export default function AppRootPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If auth is ready and there's no user, sign them in anonymously.
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
            }, { merge: true });
            router.push('/dashboard');
        })
        .catch(error => {
            console.error("Anonymous sign-in failed", error);
            setError("Could not sign in automatically. Please refresh the page.");
        });
    } else if (!isUserLoading && user) {
        router.push('/dashboard');
    }
  }, [user, isUserLoading, router, auth, firestore]);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <>
            <SButtonIcon className="animate-spin h-12 w-12 text-primary" />
            <p className="mt-4 text-muted-foreground">Loading Socio...</p>
          </>
        )}
      </div>
    );
}
