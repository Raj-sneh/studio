'use client';

import { Check, Zap, Sparkles, Rocket, Gift, Heart, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '0',
    description: 'Perfect for beginners exploring sound.',
    icon: Zap,
    credits: 'Unlimited Neural Access',
    features: [
      'Standard Quality Audio',
      'Virtual Piano Access',
      'Community Support'
    ],
    buttonText: 'Active for Everyone',
    color: 'text-muted-foreground'
  },
  {
    id: 'creator',
    name: 'Open Creator',
    price: '0',
    description: 'Unleash your full potential without limits.',
    icon: Sparkles,
    credits: 'Unlimited Neural Access',
    popular: true,
    features: [
      'Pro Quality Synthesis',
      'Save Unlimited Melodies',
      'Custom Voice Cloning',
      'AI Animation Rendering'
    ],
    buttonText: 'Now Free for All',
    color: 'text-primary'
  },
  {
    id: 'pro',
    name: 'Open Pro',
    price: '0',
    description: 'The definitive music research suite.',
    icon: Rocket,
    credits: 'Unlimited Neural Access',
    features: [
      'Ultra HD Audio Quality',
      'Advanced Voice Replacement',
      'Early access to Neural Models',
      'API Access Preview'
    ],
    buttonText: 'Unlocked for All',
    color: 'text-secondary'
  }
];

export default function PricingPage() {
  return (
    <div className="space-y-16 pb-32">
      <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
            <Gift className="h-3 w-3" /> Open Research Initiative
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground leading-tight">Sargam AI is Now <span className="text-primary">Fully Free</span></h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          We have unlocked all neural research tools for the community. Experience high-fidelity synthesis, 3D rendering, and voice cloning without cost.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col h-full border-primary/10 bg-card/50 backdrop-blur-md transition-all hover:-translate-y-2 ${plan.popular ? 'border-primary shadow-2xl shadow-primary/10' : ''}`}
          >
            <CardHeader className="p-8">
              <div className="flex items-center gap-2 mb-2">
                <plan.icon className={`h-6 w-6 ${plan.color}`} />
                <CardTitle className="text-2xl font-headline font-bold">{plan.name}</CardTitle>
              </div>
              <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black">₹{plan.price}</span>
                <span className="text-muted-foreground text-sm">/ forever</span>
              </div>
              <div className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
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
                asChild
                className="w-full h-12 rounded-xl font-bold shadow-lg"
                variant={plan.popular ? 'default' : 'outline'}
              >
                <Link href="/suite">{plan.buttonText}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <section className="max-w-4xl mx-auto px-4">
          <div className="p-10 rounded-[2.5rem] bg-muted/20 border border-primary/10 flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary fill-primary" />
              </div>
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-headline">Support Neural Innovation</h2>
                  <p className="text-muted-foreground max-w-xl mx-auto italic">
                      While Sargam AI is free, the high-performance GPUs required for these models are not. If you find these tools valuable, consider sharing your creations on social media and tagging @sargamskv.in to support our research.
                  </p>
              </div>
              <div className="flex gap-4">
                  <Button asChild variant="outline" className="rounded-xl px-8 border-primary/20">
                      <Link href="/profile/support">Contact Research Support</Link>
                  </Button>
                  <Button asChild className="rounded-xl px-8 shadow-xl shadow-primary/20">
                      <Link href="/suite">Enter Creative Studio</Link>
                  </Button>
              </div>
          </div>
      </section>

      <div className="text-center text-[10px] text-muted-foreground italic uppercase tracking-widest opacity-50 pb-20">
        * All neural research tools are provided as-is under the Open Research Protocol.
      </div>
    </div>
  );
}
