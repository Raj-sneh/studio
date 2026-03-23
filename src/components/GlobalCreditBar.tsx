'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Coins, Sparkles, Ticket, Gem, Coffee, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

/**
 * @fileOverview A persistent bottom bar for credit management and premium features.
 * Handles credit display, coupon redemption, and manual payment contact.
 */

export function GlobalCreditBar() {
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [credits, setCredits] = useState(5);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Hardcoded ngrok URL provided by user. 
  const API_BASE_URL = "https://lourdes-hesitant-jeraldine.ngrok-free.dev";

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
    const handleShow = () => {
      setIsVisible(true);
      setShowContactInfo(true);
    };

    window.addEventListener('creditsUpdated', handleUpdate);
    window.addEventListener('showCreditBar', handleShow);
    
    return () => {
      window.removeEventListener('creditsUpdated', handleUpdate);
      window.removeEventListener('showCreditBar', handleShow);
    };
  }, []);

  const handleRedeem = async () => {
    if (!couponCode.trim()) {
      setCouponStatus({ message: "⚠️ Enter code", type: 'info' });
      return;
    }

    if (!user) {
      setCouponStatus({ message: "❌ Login required", type: 'error' });
      return;
    }

    setIsRedeeming(true);
    setCouponStatus({ message: "⏳ Checking...", type: 'info' });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const formData = new FormData();
      formData.append("code", couponCode.trim());
      formData.append("userId", user.uid);

      const res = await fetch(`${API_BASE_URL}/redeem`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          "ngrok-skip-browser-warning": "true", 
        }
      });

      clearTimeout(timeoutId);

      const resText = await res.text();
      let data;
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch (e) {
        throw new Error("Invalid response format. Is your Python server running?");
      }

      if (res.ok && data.status === "success") {
        const current = parseInt(localStorage.getItem("sargam_credits") || "0");
        const newTotal = current + data.credits;
        localStorage.setItem("sargam_credits", newTotal.toString());
        
        setCouponCode('');
        window.dispatchEvent(new Event('creditsUpdated'));
        setCouponStatus({ message: `✅ +${data.credits} Credits!`, type: 'success' });
      } else if (data.status === "used") {
        setCouponStatus({ message: "❌ Already used by you", type: 'error' });
      } else {
        setCouponStatus({ message: data.message || "❌ Invalid coupon", type: 'error' });
      }
    } catch (err: any) {
      console.error("Redeem Error:", err);
      
      let errorMsg = "❌ Service offline";
      if (err.name === 'AbortError') {
        errorMsg = "❌ Request timed out";
      } else if (err.message.includes('fetch') || err.message.includes('NetworkError')) {
        errorMsg = "❌ Connection refused. Check Python server.";
      }

      setCouponStatus({ 
        message: errorMsg, 
        type: 'error' 
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const fundProject = () => {
    const upiId = "snehkumarverma@upi";
    alert(`🙏 Support Development\n\nYour contributions help keep Sargam AI growing. Send any amount to ${upiId} to support Sneh's research! 🚀`);
  };

  if (!isMounted || !isVisible) return null;

  const emailSubject = encodeURIComponent("Request for Sargam AI Premium Coupon");
  const emailBody = encodeURIComponent("Hi Sneh,\n\nI'm interested in purchasing a premium coupon for Sargam AI. Please provide the payment details for the ₹49 or ₹99 plans.\n\nThank you!");
  const mailToLink = `mailto:support.sargamskv@gmail.com?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] bg-background/95 backdrop-blur border-t p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="container max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 py-2">
        
        {/* Balance Section */}
        <div className="flex flex-col items-center gap-1 px-6 border-r border-border/50">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Your Balance</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-2xl font-bold transition-colors",
              credits <= 0 ? "text-destructive" : "text-primary"
            )}>
              {credits}
            </span>
            <span className="text-xs text-muted-foreground">Credits</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="flex-1 min-w-[200px] hidden lg:block">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-primary">AI Features Active</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Instant activation via coupon after payment.
          </p>
        </div>

        {/* Coupon Redemption */}
        <div className="flex flex-col gap-2 px-6 border-r border-border/50">
          <h3 className="text-xs font-bold text-center flex items-center justify-center gap-1">
            <Ticket className="h-3 w-3 text-primary" /> Redeem Coupon
          </h3>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Enter code..." 
              className="h-8 w-32 text-xs" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            />
            <Button 
              size="sm" 
              className="h-8 px-3 text-xs font-bold"
              onClick={handleRedeem}
              disabled={isRedeeming}
            >
              {isRedeeming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Redeem'}
            </Button>
          </div>
          {couponStatus && (
            <p className={cn(
              "text-[10px] font-bold text-center animate-in fade-in zoom-in-95",
              couponStatus.type === 'success' ? "text-primary" : 
              couponStatus.type === 'error' ? "text-destructive" : "text-muted-foreground"
            )}>
              {couponStatus.message}
            </p>
          )}
        </div>

        {/* Premium Refill */}
        <div className="flex flex-col gap-1 items-center px-6 border-r border-border/50 relative">
          <h3 className="text-xs font-bold text-secondary flex items-center gap-1">
            <Gem className="h-3 w-3" /> Buy Premium
          </h3>
          <div className="text-[10px] text-muted-foreground text-center leading-tight">
            ₹49 → 100 Credits | ₹99 → 250 Credits
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 px-6 text-[10px] font-bold mt-1"
            onClick={() => setShowContactInfo(!showContactInfo)}
          >
            Get Premium
          </Button>

          {showContactInfo && (
            <div className="absolute bottom-full mb-4 w-64 p-4 bg-card border border-secondary/20 rounded-2xl text-center space-y-3 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-secondary flex items-center gap-1">
                  📩 Contact for Code
                </p>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setShowContactInfo(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <a 
                href={mailToLink}
                className="flex items-center justify-center gap-2 p-3 bg-secondary/10 rounded-xl hover:bg-secondary/20 transition-colors group"
              >
                <Mail className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold text-secondary">support.sargamskv@gmail.com</span>
              </a>
              <p className="text-[9px] font-medium text-muted-foreground leading-relaxed">
                Click the link above to request your premium coupon code via email.
              </p>
            </div>
          )}
        </div>

        {/* Funding Section */}
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Support Research</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-[10px] border-foreground/20"
            onClick={fundProject}
          >
            <Coffee className="mr-1 h-3 w-3" /> Fund Research
          </Button>
        </div>

      </div>
    </div>
  );
}
