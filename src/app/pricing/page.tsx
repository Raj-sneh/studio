
'use client';

import { useState } from "react";
import { Check, Zap, Sparkles, Rocket, Loader2, QrCode, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Script from 'next/script';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    description: 'Perfect for starters exploring sound.',
    icon: Zap,
    credits: '10 Credits (Welcome)',
    features: [
      'Standard Quality Audio',
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
    credits: '1000 Credits / month',
    popular: true,
    features: [
      'Pro Quality Synthesis',
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
    credits: '5000 Credits / month',
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
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  const handleQrPayment = async (itemId: string, price: string, itemName: string) => {
    if (!user || user.isAnonymous) {
      toast({ title: "Account Required", description: "Please sign up to upgrade.", variant: "destructive" });
      router.push('/login');
      return;
    }

    setIsProcessing(`${itemId}_qr`);
    setSelectedItemName(itemName);
    setSelectedPrice(price);

    const baseUrl = process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";

    try {
      const res = await fetch(`${baseUrl}/api/create-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          item_id: itemId, 
          userId: user.uid,
          amount: parseInt(price)
        }),
      });

      const data = await res.json();
      if (data.image_url) {
        setQrImageUrl(data.image_url);
        toast({ title: "QR Generated", description: "Please scan to complete payment." });
      } else {
        throw new Error(data.error || "Failed to generate QR code.");
      }
    } catch (e: any) {
      toast({ title: "QR Error", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePayment = async (itemId: string, type: 'plan' | 'pack') => {
    if (!user || user.isAnonymous) {
      toast({ title: "Account Required", description: "Please login to upgrade.", variant: "destructive" });
      router.push('/login');
      return;
    }

    if (itemId === 'free') return;

    setIsProcessing(itemId);
    
    const baseUrl = process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL || "http://localhost:8080";

    try {
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
      
      if (!orderRes.ok) throw new Error(orderData.error || `Payment initiation failed.`);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Sargam AI",
        description: type === 'plan' ? `Upgrade to ${itemId}` : `${itemId} Credits Pack`,
        order_id: orderData.id,
        handler: async function (response: any) {
          setIsProcessing(itemId);
          try {
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
              toast({ title: "Success!", description: "Neural credits provisioned." });
              router.refresh();
              setTimeout(() => { window.location.reload(); }, 1000);
            } else {
              throw new Error("Verification failed.");
            }
          } catch (err: any) {
            toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
          } finally {
            setIsProcessing(null);
          }
        },
        prefill: {
          name: user.displayName || "Artist",
          email: user.email || "",
        },
        theme: { color: "#00ffff" },
        modal: { ondismiss: () => setIsProcessing(null) }
      };

      if (typeof (window as any).Razorpay === 'undefined') throw new Error("Razorpay script not loaded yet. Please try again in a moment.");
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (e: any) {
      toast({ title: "Payment Error", description: e.message, variant: "destructive" });
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-16 pb-32">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground leading-tight">Professional Neural Access</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Unlock high-fidelity synthesis and advanced vocal research tools.
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
                Recommended
              </div>
            )}
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <plan.icon className={`h-6 w-6 ${plan.color}`} />
                <CardTitle className="text-2xl font-headline font-bold">{plan.name}</CardTitle>
              </div>
              <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black">₹{plan.price}</span>
                <span className="text-muted-foreground text-sm">/ mo</span>
              </div>
              <div className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                {plan.credits} Neural Allocation
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
            <CardFooter className="p-8 pt-0 flex flex-col gap-3">
              <Button 
                onClick={() => handlePayment(plan.id, 'plan')}
                disabled={isProcessing === plan.id || plan.id === 'free'}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/10"
                variant={plan.popular ? 'default' : 'outline'}
              >
                {isProcessing === plan.id ? <Loader2 className="animate-spin h-5 w-5" /> : <><CreditCard className="mr-2 h-4 w-4"/> {plan.buttonText}</>}
              </Button>
              {plan.id !== 'free' && (
                <Button 
                    variant="ghost" 
                    className="w-full text-xs font-bold text-primary hover:bg-primary/10"
                    onClick={() => handleQrPayment(plan.id, plan.price, plan.name)}
                    disabled={isProcessing === `${plan.id}_qr`}
                >
                    {isProcessing === `${plan.id}_qr` ? <Loader2 className="animate-spin h-4 w-4" /> : <><QrCode className="mr-2 h-3 w-3" /> Pay via UPI QR</>}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <section className="max-w-4xl mx-auto px-4 pt-10">
        <div className="text-center space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                <QrCode className="h-3 w-3" /> UPI Supported
            </div>
            <h2 className="text-3xl font-bold font-headline">Credit Top-ups</h2>
            <p className="text-muted-foreground">Instant neural allocation for urgent research projects.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PACKS.map(pack => (
            <div key={pack.id} className="flex flex-col gap-2">
                <Button 
                    variant="outline" 
                    onClick={() => handlePayment(pack.id, 'pack')}
                    disabled={isProcessing === pack.id}
                    className="h-28 flex flex-col gap-1 rounded-2xl border-primary/10 hover:bg-primary/5 transition-all group relative overflow-hidden"
                >
                    {isProcessing === pack.id ? (
                        <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                        <>
                        <span className="text-3xl font-black text-primary group-hover:scale-110 transition-transform">₹{pack.price}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{pack.credits} Credits</span>
                        </>
                    )}
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary"
                    onClick={() => handleQrPayment(pack.id, pack.price.toString(), `${pack.credits} Credits`)}
                    disabled={isProcessing === `${pack.id}_qr`}
                >
                    {isProcessing === `${pack.id}_qr` ? <Loader2 className="animate-spin h-3 w-3" /> : "Scan QR"}
                </Button>
            </div>
          ))}
        </div>
      </section>

      {/* UPI QR Modal */}
      <Dialog open={!!qrImageUrl} onOpenChange={() => setQrImageUrl(null)}>
        <DialogContent className="sm:max-w-md bg-white text-black p-8 rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <QrCode className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black font-headline">Scan to Pay ₹{selectedPrice}</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium">
                Use any UPI app (GPay, PhonePe, etc.) to upgrade to {selectedItemName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="p-4 bg-gray-50 rounded-3xl border-2 border-gray-100 shadow-inner relative group">
                {qrImageUrl && <img src={qrImageUrl} alt="Razorpay QR Code" className="w-64 h-64 transition-transform group-hover:scale-[1.02]" />}
                <div className="absolute inset-0 border-4 border-primary/5 rounded-3xl pointer-events-none" />
            </div>
            <div className="space-y-2 text-center">
                <p className="text-sm font-bold text-primary flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 fill-primary" /> Credits update automatically
                </p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Verified Secure Neural Transaction
                </p>
            </div>
          </div>
          <Button onClick={() => setQrImageUrl(null)} variant="secondary" className="w-full h-12 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      <div className="text-center text-[10px] text-muted-foreground italic uppercase tracking-widest opacity-50 pb-20">
        * Neural allocations reset monthly. One-time packs do not expire.
      </div>
    </div>
  );
}
