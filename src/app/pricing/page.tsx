
'use client';

import { Check, Zap, Sparkles, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
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
    price: '₹99',
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
    price: '₹299',
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

export default function PricingPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (planId === 'free') return;

    try {
      // In a real app, this would redirect to Razorpay or Stripe
      // For this prototype, we call our backend directly
      const res = await fetch('http://127.0.0.1:1000/credits/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, plan: planId })
      });

      if (res.ok) {
        toast({ title: "Plan Upgraded!", description: `You are now on the ${planId} plan.` });
        router.refresh();
      }
    } catch (e) {
      toast({ title: "Error", description: "Payment processing failed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-16 pb-20">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="font-headline text-5xl font-bold tracking-tight">Flexible Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Empower your musical journey with neural innovation. Choose the plan that fits your creative scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col h-full border-primary/10 bg-card/50 backdrop-blur-sm transition-all hover:-translate-y-2 hover:shadow-2xl ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <plan.icon className={`h-6 w-6 ${plan.color}`} />
                <CardTitle className="text-2xl font-headline">{plan.name}</CardTitle>
              </div>
              <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              <div className="mt-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <div className="mt-2 text-sm font-bold text-primary uppercase tracking-wider">
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
                onClick={() => handleUpgrade(plan.id)}
                className="w-full h-12 rounded-xl font-bold text-lg"
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Credit Packs Section */}
      <section className="max-w-4xl mx-auto px-4 pt-10">
        <div className="text-center space-y-4 mb-10">
          <h2 className="text-3xl font-bold font-headline">Need more credits?</h2>
          <p className="text-muted-foreground">Instant credit top-ups for your urgent projects.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Button variant="outline" className="h-24 flex flex-col rounded-2xl border-primary/10 hover:bg-primary/5">
             <span className="text-lg font-black text-primary">₹10</span>
             <span className="text-xs text-muted-foreground">20 Credits</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col rounded-2xl border-primary/10 hover:bg-primary/5 ring-2 ring-primary/20">
             <span className="text-lg font-black text-primary">₹50</span>
             <span className="text-xs text-muted-foreground">120 Credits</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col rounded-2xl border-primary/10 hover:bg-primary/5">
             <span className="text-lg font-black text-primary">₹100</span>
             <span className="text-xs text-muted-foreground">300 Credits</span>
          </Button>
        </div>
      </section>

      <div className="text-center text-xs text-muted-foreground italic">
        * Credits reset at 00:00 UTC every day. Unused daily credits do not carry over.
      </div>
    </div>
  );
}
