
'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

/**
 * @fileOverview A persistent bottom bar showing the user's current research credits.
 */

export function GlobalCreditBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const contactDeveloper = () => {
    const subject = encodeURIComponent("Application for Sargam AI Premium Credits");
    const body = encodeURIComponent(`Hi Sneh,\n\nI am using Sargam AI and would like to apply for more premium credits to support my musical research.\n\nThank you!`);
    window.location.href = `mailto:hello@sargamskv.in?subject=${subject}&body=${body}`;
  };

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

      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-primary">Neural Research Allocation</p>
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <p className="text-lg font-bold text-foreground">
                            {profile?.credits ?? 0} <span className="text-xs font-normal text-muted-foreground">Credits Available</span>
                        </p>
                    )}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <p className="hidden md:block text-xs text-muted-foreground max-w-[200px] leading-tight">
                For more credits or research allocation, please contact the developer.
            </p>
            <Button 
                variant="default" 
                size="sm" 
                className="h-10 px-8 shadow-lg shadow-primary/20 text-xs font-bold gap-2 rounded-full"
                onClick={contactDeveloper}
            >
                <Mail className="h-4 w-4" /> Contact Developer
            </Button>
        </div>
      </div>
    </div>
  );
}
