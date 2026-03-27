'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Mail, MessageSquare, ShieldCheck, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

/**
 * @fileOverview A persistent bottom bar simplified for the Research Trial phase.
 */

export function GlobalCreditBar() {
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [credits, setCredits] = useState(5);

  useEffect(() => {
    setIsMounted(true);
    
    const fetchCredits = () => {
      const stored = localStorage.getItem("sargam_credits");
      if (stored) {
        setCredits(parseInt(stored));
      }
    };

    fetchCredits();
    const handleUpdate = () => fetchCredits();
    window.addEventListener('creditsUpdated', handleUpdate);
    return () => window.removeEventListener('creditsUpdated', handleUpdate);
  }, []);

  const contactDeveloper = () => {
    const subject = encodeURIComponent("Application for Sargam AI Premium Credits");
    const body = encodeURIComponent(`Hi Sneh,\n\nI am using Sargam AI and would like to apply for more premium credits to support my musical research.\n\nUser ID: ${user?.uid || 'Guest'}\n\nThank you!`);
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

      <div className="container max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6 py-1">
        
        {/* Simplified Balance Section */}
        <div className="flex items-center gap-6 px-4 border-r border-border/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Research Pool</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-bold transition-colors",
                credits <= 0 ? "text-destructive" : "text-primary"
              )}>
                {credits}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Allocated Credits</span>
            </div>
          </div>
        </div>

        {/* Informational Section */}
        <div className="flex-1 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-foreground">Premium Research Allocation</h3>
            <p className="text-[11px] text-muted-foreground">For more credits, please apply via the formal developer channel.</p>
          </div>
        </div>

        {/* Action Section */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 px-6 border-primary/20 hover:bg-primary/5 text-xs font-bold gap-2"
            onClick={contactDeveloper}
          >
            <Mail className="h-4 w-4 text-primary" /> Contact Developer
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="h-10 px-6 shadow-lg shadow-primary/20 text-xs font-bold gap-2"
            onClick={contactDeveloper}
          >
            <Gem className="h-4 w-4" /> Request Extension
          </Button>
        </div>

      </div>
    </div>
  );
}
