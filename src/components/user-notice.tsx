'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { X, AlertTriangle, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview A high-visibility administrative banner that appears at the top of the app.
 * Monitors the 'admin_notices' collection for active broadcasts.
 * Optimized for resilience against initial session race conditions.
 */
export default function UserNotice() {
  const { user, isFirebaseReady, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [isVisible, setIsVisible] = useState(true);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sargam-dismissed-notice-id');
      if (saved) {
        setDismissedId(saved);
      }
    }
  }, []);

  const noticeQuery = useMemoFirebase(() => {
    // 🛡️ STABILITY PROTOCOL: Only fetch if user is logged in to prevent permission errors on boot.
    if (!firestore || !user || !isFirebaseReady || isUserLoading) {
      return null;
    }
    
    try {
      return query(
        collection(firestore, 'admin_notices'),
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
    } catch (e) {
      console.warn("Notice query construction paused.");
      return null;
    }
  }, [firestore, user, isFirebaseReady, isUserLoading]);

  const { data: notices, error } = useCollection(noticeQuery);
  const activeNotice = notices?.[0];

  const handleDismiss = () => {
    if (activeNotice) {
      localStorage.setItem('sargam-dismissed-notice-id', activeNotice.id);
      setDismissedId(activeNotice.id);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (activeNotice && activeNotice.id !== dismissedId) {
      setIsVisible(true);
    }
  }, [activeNotice, dismissedId]);

  // Silently fail if there's an error to keep the user experience clean
  if (error || !activeNotice || dismissedId === activeNotice.id || !isVisible) {
    return null;
  }

  return (
    <div 
      className={cn(
        "w-full px-6 py-2.5 flex items-center justify-center gap-4 relative z-[100] transition-all border-b border-white/10 animate-in slide-in-from-top duration-700",
        activeNotice.type === 'alert' 
          ? "bg-destructive text-white shadow-[0_5px_20px_rgba(255,0,0,0.2)]" 
          : "bg-primary text-primary-foreground shadow-[0_5px_20px_rgba(0,255,255,0.15)]"
      )}
    >
      <div className="flex items-center gap-3 max-w-5xl mx-auto pr-10">
        {activeNotice.type === 'alert' ? (
          <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
        ) : (
          <Megaphone className="h-4 w-4 shrink-0" />
        )}
        <p className="text-[11px] sm:text-xs font-black uppercase tracking-[0.05em] leading-tight text-center">
          {activeNotice.message}
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
