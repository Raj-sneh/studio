'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { X, AlertTriangle, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview A high-visibility administrative banner that appears at the top of the app.
 * Refactored with a manual onSnapshot listener and internal guards to prevent early-request permission errors.
 */
export default function UserNotice() {
  const { user, isFirebaseReady } = useUser();
  const db = useFirestore();
  const [notice, setNotice] = useState<any>(null);

  useEffect(() => {
    // 🛡️ MOVE THE GUARD HERE (Inside the Effect)
    // Only attempt to sync if the user is authenticated and Firebase is ready.
    if (!user?.uid || !isFirebaseReady || !db) {
       setNotice(null);
       return; 
    }

    console.log("DEBUG: Initializing Notice Sync...");

    const noticesRef = collection(db, 'admin_notices');
    const q = query(
      noticesRef, 
      where('active', '==', true), 
      orderBy('createdAt', 'desc'), 
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const noticeData = snapshot.docs[0].data();
        const noticeId = snapshot.docs[0].id;
        
        // Check local storage to see if this specific notice was dismissed.
        if (localStorage.getItem(`dismissed_notice_${noticeId}`) !== 'true') {
          setNotice({ id: noticeId, ...noticeData });
        } else {
          setNotice(null);
        }
      } else {
        setNotice(null);
      }
    }, (error) => {
      // Suppress the sync error to prevent the Red Screen of Death during auth transitions.
      console.warn("Notice Sync Paused (Auth Race):", error.message);
    });

    return () => unsubscribe();
  }, [user?.uid, isFirebaseReady, db]);

  // 🛡️ ONLY RETURN NULL AT THE VERY BOTTOM FOR RENDERING
  if (!notice) return null;

  const handleDismiss = () => {
    if (notice) {
      localStorage.setItem(`dismissed_notice_${notice.id}`, 'true');
      setNotice(null);
    }
  };

  return (
    <div 
      className={cn(
        "w-full px-6 py-2.5 flex items-center justify-center gap-4 relative z-[100] transition-all border-b border-white/10 animate-in slide-in-from-top duration-700",
        notice.type === 'alert' 
          ? "bg-destructive text-white shadow-[0_5px_20px_rgba(255,0,0,0.2)]" 
          : "bg-primary text-primary-foreground shadow-[0_5px_20px_rgba(0,255,255,0.15)]"
      )}
    >
      <div className="flex items-center gap-3 max-w-5xl mx-auto pr-10">
        {notice.type === 'alert' ? (
          <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
        ) : (
          <Megaphone className="h-4 w-4 shrink-0" />
        )}
        <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.05em] leading-tight text-center">
          {notice.message}
        </p>
      </div>
      
      <button 
        onClick={handleDismiss}
        className="absolute right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
