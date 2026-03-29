
'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview A persistent bottom bar showing the user's current research credits and a coupon redemption field.
 */

export function GlobalCreditBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRedeem = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "You need to be logged in to redeem a coupon.", variant: "destructive" });
      return;
    }

    if (!couponCode.trim()) {
      toast({ title: "Empty Code", description: "Please enter a valid coupon code.", variant: "destructive" });
      return;
    }

    setIsRedeeming(true);
    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), userId: user.uid }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ 
          title: "Success!", 
          description: `Successfully added ${result.credits} credits to your account.`,
        });
        setCouponCode('');
      } else {
        toast({ 
          title: "Redemption Failed", 
          description: result.message || "Invalid or expired coupon code.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong during redemption. Please try again.", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
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

      <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 py-1">
        {/* Credit Display Section */}
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Research Allocation</p>
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

        {/* Coupon Redemption Section */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Enter Coupon Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="pl-10 h-10 bg-muted/20 border-primary/10 rounded-full focus:border-primary/40 text-xs font-mono uppercase tracking-widest"
                    disabled={isRedeeming}
                />
            </div>
            <Button 
                variant="default" 
                size="sm" 
                className="h-10 px-8 shadow-lg shadow-primary/20 text-xs font-bold gap-2 rounded-full shrink-0"
                onClick={handleRedeem}
                disabled={isRedeeming || !couponCode.trim()}
            >
                {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
            </Button>
        </div>
      </div>
    </div>
  );
}
