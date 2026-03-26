'use client';

import { useState, useEffect } from 'react';
import { X, Coins, Sparkles, Ticket, Gem, Coffee, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, arrayUnion, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview A persistent bottom bar for credit management and premium features.
 * Handles secure client-side coupon redemption and premium purchase links.
 */

const COUPON_VALUES: Record<string, number> = {
  "S49A1B2": 100,
  "MELODY100": 100,
  "SKVPRO49": 100,
  "TUNE7K2L": 100,
  "BEAT49X1": 100,
  "MAX@250#₹": 250,
  "PRO#SKV@₹99": 250,
  "GOLD₹@MAX#": 250,
  "VIP#99@₹250": 250,
  "ULTRA@₹#99": 250
};

export function GlobalCreditBar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [credits, setCredits] = useState(5);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

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
    const code = couponCode.trim();
    if (!code) {
      setCouponStatus({ message: "⚠️ Enter code", type: 'info' });
      return;
    }

    if (!user || !firestore) {
      setCouponStatus({ message: "❌ Login required", type: 'error' });
      return;
    }

    setIsRedeeming(true);
    setCouponStatus({ message: "⏳ Validating...", type: 'info' });

    try {
      // 1. Check if the coupon exists
      const creditsToGrant = COUPON_VALUES[code];
      if (!creditsToGrant) {
        setCouponStatus({ message: "❌ Invalid code", type: 'error' });
        setIsRedeeming(false);
        return;
      }

      // 2. Access user profile in Firestore to check usage
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create profile if missing
        await setDoc(userDocRef, {
          id: user.uid,
          createdAt: serverTimestamp(),
          redeemedCoupons: [code],
          displayName: user.displayName || 'Guest User'
        });
      } else {
        const userData = userDoc.data();
        const redeemedCoupons = userData.redeemedCoupons || [];

        if (redeemedCoupons.includes(code)) {
          setCouponStatus({ message: "❌ Already used!", type: 'error' });
          setIsRedeeming(false);
          return;
        }

        // 3. Mark coupon as used for this user
        await updateDoc(userDocRef, {
          redeemedCoupons: arrayUnion(code)
        });
      }

      // 4. Update Local Credits
      const current = parseInt(localStorage.getItem("sargam_credits") || "0");
      const newTotal = current + creditsToGrant;
      localStorage.setItem("sargam_credits", newTotal.toString());
      
      setCouponCode('');
      window.dispatchEvent(new Event('creditsUpdated'));
      setCouponStatus({ message: `✅ +${creditsToGrant} Credits!`, type: 'success' });

    } catch (err: any) {
      console.error("Redeem Error:", err);
      setCouponStatus({ message: "❌ Studio issue", type: 'error' });
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
  const emailBody = encodeURIComponent("Hi Sneh,\n\nI'm interested in purchasing a premium coupon for Sargam AI. Please provide the details for the ₹49 or ₹99 plans.\n\nThank you!");
  const mailToLink = `mailto:hello@sargamskv.in?subject=${emailSubject}&body=${emailBody}`;

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

        <div className="flex-1 min-w-[200px] hidden lg:block">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-primary">AI Creative Studio</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Redeem your premium codes for instant credits.
          </p>
        </div>

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
              "text-[10px] font-bold text-center animate-in fade-in zoom-in-95 mt-1",
              couponStatus.type === 'success' ? "text-primary" : 
              couponStatus.type === 'error' ? "text-destructive" : "text-muted-foreground"
            )}>
              {couponStatus.message}
            </p>
          )}
        </div>

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
                  📩 Get Your Code
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
                <span className="text-[10px] font-bold text-secondary">hello@sargamskv.in</span>
              </a>
              <p className="text-[9px] font-medium text-muted-foreground leading-relaxed">
                Send an email to request your code. You'll receive it instantly after payment verification.
              </p>
            </div>
          )}
        </div>

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
