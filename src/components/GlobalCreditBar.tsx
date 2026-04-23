'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, ArrowUpCircle, Activity, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import Link from 'next/link';

/**
 * @fileOverview A persistent bottom bar showing user status.
 * Updated for the Open Neural Protocol: Credits are now unlimited.
 */
export function GlobalCreditBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const isAuthenticated = !!(user && !user.isAnonymous);

  const userDocRef = useMemoFirebase(() => (firestore && isAuthenticated ? doc(firestore, 'users', user.uid) : null), [firestore, isAuthenticated, user?.uid]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isVisible || isUserLoading || !isAuthenticated) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[110] bg-background/95 backdrop-blur-xl border-t border-primary/30 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-primary z-[120]"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="container max-w-7xl mx-auto flex items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background flex items-center justify-center border border-primary/20">
                    <Activity className="h-2 w-2 text-primary animate-pulse" />
                </div>
            </div>
            <div className="text-left">
                <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-primary">Open Research Status: Active</p>
                <div className="flex items-center gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-sm sm:text-md font-bold text-foreground">
                            Unlimited 
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Credits</span>
                        </p>
                        <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-widest">
                            {profile?.plan || 'Free'} Open Tier
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <Button 
            asChild
            variant="default" 
            size="sm" 
            className="h-10 px-6 sm:px-8 shadow-xl shadow-primary/30 text-[10px] sm:text-xs font-black gap-2 rounded-full whitespace-nowrap active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
        >
            <Link href="/pricing">
                <Heart className="h-4 w-4 fill-current" /> 
                <span className="hidden xs:inline">Support the Project</span>
                <span className="xs:hidden">Support</span>
            </Link>
        </Button>
      </div>
    </div>
  );
}
