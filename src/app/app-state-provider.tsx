'use client';

import { useEffect, type ReactNode, useState, useRef } from 'react';
import {
  useAuth,
  useUser,
  initiateAnonymousSignIn,
  useFirestore,
  setDocumentNonBlocking,
} from '@/firebase';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { WelcomeModal } from '@/components/WelcomeModal';
import { useToast } from '@/hooks/use-toast';

const GUEST_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/studio-4164192500-df01a.firebasestorage.app/o/1000018646%5B1%5D.png?alt=media&token=2b2f8cea-03cd-477c-bc0d-88988246fdeb";
const INITIAL_CREDITS = 5;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, isFirebaseReady } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isWelcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const isInitialSignInRef = useRef(false);

  const handleSaveName = async (newName: string) => {
    if (!user || !firestore) return;
    if (!newName.trim()) {
        toast({ title: "Name cannot be empty", variant: "destructive" });
        return;
    }
    
    setIsSavingName(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        await updateDoc(userDocRef, { displayName: newName });
        setWelcomeModalOpen(false);
        toast({ title: "Welcome!", description: "Your stage name is set." });
    } catch (error: any) {
        toast({ title: "Error", description: "Could not update your name.", variant: "destructive" });
    } finally {
        setIsSavingName(false);
    }
  };

  /**
   * Daily Credit Sync: Pings the Python engine to handle daily credit resets.
   */
  const syncCreditsWithBackend = async (uid: string) => {
    try {
      await fetch(`http://localhost:1000/credits/status/${uid}`, { cache: 'no-store' });
    } catch (e) {
      console.warn("Credit sync failed: Could not connect to Neural Engine at localhost:1000");
    }
  };

  useEffect(() => {
    if (!isFirebaseReady || !auth || !firestore) return;

    const handleUserSession = async () => {
      if (user) {
        // Sync daily credits on every session start/refresh
        syncCreditsWithBackend(user.uid);

        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const userProfile = docSnap.data();
            
            if (user.photoURL && userProfile.avatarUrl !== user.photoURL) {
              updateDoc(userDocRef, { avatarUrl: user.photoURL });
            }

            if (userProfile.credits === undefined) {
              updateDoc(userDocRef, { credits: INITIAL_CREDITS });
            }

            if (
              (userProfile.displayName === 'Guest User' || userProfile.displayName === 'New User') &&
              !sessionStorage.getItem('welcomeModalShown')
            ) {
              setWelcomeModalOpen(true);
              sessionStorage.setItem('welcomeModalShown', 'true');
            }
          } else {
             const userData = {
              id: user.uid,
              displayName: user.displayName || 'Guest User',
              email: user.email || `guest_${user.uid}@example.com`,
              avatarUrl: user.photoURL || GUEST_AVATAR_URL,
              credits: INITIAL_CREDITS,
              plan: 'free',
              createdAt: serverTimestamp(),
            };
            
            setDocumentNonBlocking(userDocRef, userData, { merge: true });
            
             if (!sessionStorage.getItem('welcomeModalShown')) {
              setWelcomeModalOpen(true);
              sessionStorage.setItem('welcomeModalShown', 'true');
            }
          }
        } catch (e) {
          console.warn("Session retrieval failed:", e);
        }
      } else if (!isInitialSignInRef.current) {
        isInitialSignInRef.current = true;
        initiateAnonymousSignIn(auth).catch((err) => {
          console.error("Anonymous sign-in failed:", err);
          setTimeout(() => { isInitialSignInRef.current = false; }, 2000);
        });
      }
    };

    handleUserSession();
  }, [isFirebaseReady, user, auth, firestore, toast]);

  return (
    <>
      {children}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onOpenChange={setWelcomeModalOpen}
        onSaveName={handleSaveName}
        isSaving={isSavingName}
        currentName={user?.displayName || ''}
      />
    </>
  );
}
