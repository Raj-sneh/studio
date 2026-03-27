'use client';

import { useState, useEffect } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @fileOverview A simplified persistent bottom bar for the Research Trial phase.
 * Directs users to the developer for all credit-related requests.
 */

export function GlobalCreditBar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

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

      <div className="container max-w-7xl mx-auto flex items-center justify-center gap-6 py-1">
        <p className="text-sm font-medium text-muted-foreground">
          For more credits or research allocation, please contact the developer with your application.
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
  );
}
