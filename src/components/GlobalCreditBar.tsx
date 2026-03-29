
'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview A persistent bottom bar showing user status and offering a quick upgrade path.
 */
export function GlobalCreditBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] bg-background/95 backdrop-blur-md border-t border-primary/20 p-4 shadow-2xl animate-in slide-in-from-bottom duration-500">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="container max-w-7xl mx-auto flex items-center justify-between gap-6 py-1">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Neural Status</p>
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <p className="text-md font-bold text-foreground flex items-center gap-2">
                            {profile?.credits ?? 0} 
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Credits Available</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-widest ml-2">
                                {profile?.plan || 'Free'}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>

        <Button 
            variant="default" 
            size="sm" 
            className="h-10 px-8 shadow-xl shadow-primary/20 text-xs font-bold gap-2 rounded-full hidden sm:flex"
            onClick={() => router.push('/pricing')}
        >
            <ArrowUpCircle className="h-4 w-4" /> 
            Get More Credits
        </Button>
      </div>
    </div>
  );
}
