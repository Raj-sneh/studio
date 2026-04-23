'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Zap, ShieldCheck, PlayCircle } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface RewardedAdModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentCredits: number;
}

declare global {
  interface Window {
    aclib?: {
      runAutoTag: (config: { zoneId: string }) => void;
    };
  }
}

export function RewardedAdModal({ isOpen, onOpenChange, currentCredits }: RewardedAdModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isWatching, setIsWatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleGrantCredits = useCallback(() => {
    if (!user || !firestore) return;
    
    const userRef = doc(firestore, 'users', user.uid);
    const rewardAmount = 5;
    
    updateDocumentNonBlocking(userRef, {
      credits: (currentCredits || 0) + rewardAmount
    });

    toast({
      title: "Reward Protocol Success",
      description: `You've earned ${rewardAmount} Neural Credits!`,
    });
  }, [user, firestore, currentCredits, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWatching && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100));
      }, 150); // ~15 second verification sequence
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, progress]);

  useEffect(() => {
    if (progress >= 100 && isWatching) {
      setIsWatching(false);
      setIsComplete(true);
      handleGrantCredits();
    }
  }, [progress, isWatching, handleGrantCredits]);

  const handleStart = () => {
    // 1. Call the Adcash Manual Script
    if (typeof window !== 'undefined' && window.aclib) {
      try {
        window.aclib.runAutoTag({
          zoneId: '11225786', 
        });
        
        // 2. Start the 'Grant Credits' verification only after the ad starts
        setIsWatching(true);
        setIsComplete(false);
        setProgress(0);
      } catch (e) {
        toast({ 
          title: "Engine Error", 
          description: "Neural ad provider encountered a initialization error.", 
          variant: "destructive" 
        });
      }
    } else {
      toast({ 
        title: "Ad Provider Offline", 
        description: "Please disable AdBlock to initialize the reward protocol.", 
        variant: "destructive" 
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsWatching(false);
      setIsComplete(false);
      setProgress(0);
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="sm:max-w-[420px] rounded-[2rem] bg-background/95 backdrop-blur-2xl border-primary/20">
        <DialogHeader className="items-center text-center">
          <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-headline font-bold">Earn Neural Credits</DialogTitle>
          <DialogDescription className="italic">
            Review our sponsorship protocol to initialize your research liquidity.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 space-y-6">
          {!isWatching && !isComplete && (
            <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 text-center space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Watch a 15-second visual sponsorship to earn <span className="text-primary font-black">5 Neural Credits</span> instantly.
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                <ShieldCheck className="h-3 w-3" /> Verified Reward Protocol
              </div>
            </div>
          )}

          {isWatching && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="relative h-40 w-full rounded-2xl bg-black border border-white/5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sponsorship Active</p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-1.5" />
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Verifying Neural DNA</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Credits Injected!</h3>
              <p className="text-xs text-muted-foreground italic">Your neural account has been synchronized.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!isWatching && !isComplete && (
            <Button onClick={handleStart} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
              <PlayCircle className="mr-2 h-5 w-5" /> Start Review
            </Button>
          )}
          {isComplete && (
            <Button onClick={handleClose} className="w-full h-14 rounded-2xl font-black text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Back to Studio
            </Button>
          )}
          {isWatching && (
            <Button disabled variant="outline" className="w-full h-14 rounded-2xl opacity-50">
              Keep watching...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
