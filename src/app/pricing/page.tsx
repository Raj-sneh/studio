
'use client';

import { useState } from "react";
import { Check, Zap, Sparkles, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import Script from 'next/script';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    description: 'Perfect for starters exploring sound.',
    icon: Zap,
    credits: '5 Credits / day',
    features: [
      'Standard Quality Audio',
      'Watermarked Downloads',
      'Virtual Piano Access',
      'Community Support'
    ],
    buttonText: 'Current Plan',
    color: 'text-muted-foreground'
  },
  {
    id: 'creator',
    name: 'Creator',
    price: '99',
    description: 'Unleash your creative potential.',
    icon: Sparkles,
    credits: '50 Credits / day',
    popular: true,
    features: [
      'Pro Quality Synthesis',
      'No Watermarks',
      'Save Unlimited Melodies',
      'Priority Support',
      'Custom Voice Cloning'
    ],
    buttonText: 'Upgrade to Creator',
    color: 'text-primary'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '299',
    description: 'The definitive music research tools.',
    icon: Rocket,
    credits: '500 Credits / day',
    features: [
      'Ultra HD Audio Quality',
      'Advanced Voice Replacement',
      'Early access to Neural Models',
      'Personal Account Manager',
      'API Access Preview'
    ],
    buttonText: 'Get Pro Access',
    color: 'text-secondary'
  }
];

const PACKS = [
    { id: 'pack_20', credits: 20, price: 10 },
    { id: 'pack_120', credits: 120, price: 50 },
    { id: 'pack_300', credits: 300, price: 100 },
];

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handlePayment = async (itemId: string, type: 'plan' | 'pack') => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (itemId === 'free') return;

    setIsProcessing(itemId);
    
    // 1. Get the URL
    const baseUrl = process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";
    
    // DEBUG LOG: Open your browser console (F12) and check this!
    console.log("Attempting to fetch from:", baseUrl);

    if (baseUrl.includes("localhost") && typeof window !== 'undefined' && window.location.protocol === "https:") {
      toast({ 
        title: "Configuration Error", 
        description: "Trying to connect to localhost from a live HTTPS site. Check your Environment Variables in Firebase Console.", 
        variant: "destructive" 
      });
      setIsProcessing(null);
      return;
    }

    try {
      // 1. Create order by calling your NEW Python URL directly (Now with CORS)
      const orderRes = await fetch(`${baseUrl}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.uid, 
          item_id: itemId, 
          type: type 
        })
      });

      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        throw new Error(orderData.error || `Payment initiation failed.`);
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount || 50000,
        currency: orderData.currency || "INR",
        name: "Sargam AI",
        description: type === 'plan' ? `Upgrade to ${itemId}` : `${itemId} Credits Pack`,
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsProcessing(itemId);
          try {
            // 3. Verify directly via the Python backend
            const verifyRes = await fetch(`${baseUrl}/api/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user.uid,
                item_id: itemId,
                type: type
              })
            });

            if (verifyRes.ok) {
              toast({ title: "Success!", description: "Your account has been updated." });
              router.refresh();
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              const verifyData = await verifyRes.json();
              throw new Error(verifyData.error || "Payment verification failed.");
            }
          } catch (err: any) {
            toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
          } finally {
            setIsProcessing(null);
          }
        },
        prefill: {
          name: user.displayName || "User",
          email: user.email || "",
        },
        theme: {
          color: "#00ffff",
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(null);
          }
        }
      };

      if (typeof (window as any).Razorpay === 'undefined') {
          throw new Error("Razorpay script not loaded. Please refresh and try again.");
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (e: any) {
      console.error("Payment Initiation Error:", e);
      toast({ 
        title: "Payment Error", 
        description: e.message || "Could not connect to the Neural Engine.", 
        variant: "destructive" 
      });
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground">Premium Access</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Scale your creative output with advanced neural tools and high-fidelity synthesis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col h-full border-primary/10 bg-card/50 backdrop-blur-md transition-all hover:-translate-y-2 hover:shadow-2xl ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <plan.icon className={`h-6 w-6 ${plan.color}`} />
                <CardTitle className="text-2xl font-headline font-bold">{plan.name}</CardTitle>
              </div>
              <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              <div className="mt-6">
                <span className="text-4xl font-black">₹{plan.price}</span>
                <span className="text-muted-foreground">/ mo</span>
              </div>
              <div className="mt-2 text-xs font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                {plan.credits}
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-8 pt-0">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button 
                onClick={() => handlePayment(plan.id, 'plan')}
                disabled={isProcessing === plan.id}
                className="w-full h-12 rounded-xl font-bold text-lg"
                variant={plan.popular ? 'default' : 'outline'}
              >
                {isProcessing === plan.id ? <Loader2 className="animate-spin h-5 w-5" /> : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <section className="max-w-4xl mx-auto px-4 pt-10">
        <div className="text-center space-y-4 mb-10">
          <h2 className="text-3xl font-bold font-headline">Credit Top-ups</h2>
          <p className="text-muted-foreground">Instant neural research allocation for urgent projects.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PACKS.map(pack => (
            <Button 
              key={pack.id}
              variant="outline" 
              onClick={() => handlePayment(pack.id, 'pack')}
              disabled={isProcessing === pack.id}
              className="h-24 flex flex-col gap-1 rounded-2xl border-primary/10 hover:bg-primary/5 transition-all group"
            >
               {isProcessing === pack.id ? (
                 <Loader2 className="animate-spin h-6 w-6" />
               ) : (
                 <>
                   <span className="text-2xl font-black text-primary group-hover:scale-110 transition-transform">₹{pack.price}</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{pack.credits} Neural Credits</span>
                 </>
               )}
            </Button>
          ))}
        </div>
      </section>

      <div className="text-center text-[10px] text-muted-foreground italic uppercase tracking-widest opacity-50">
        * Neural allocations reset at 00:00 UTC. One-time packs do not expire.
      </div>
    </div>
  );
}
