'use client';

import { Check, Zap, Sparkles, Rocket, Gift, Heart, ShieldCheck, Eye, EyeOff, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useState } from 'react';
import { RewardedAdModal } from "@/components/RewardedAdModal";

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '0',
    description: 'Explore neural basics with ad-supported access.',
    icon: Zap,
    credits: '10 Starter Credits',
    features: [
      'Standard Quality Audio',
      'Virtual Piano Access',
      'Earn Credits via Sponsorship',
      'Ad-Supported Freemium',
      'Community Support'
    ],
    buttonText: 'Current Plan',
    color: 'text-muted-foreground'
  },
  {
    id: 'creator',
    name: 'Elite Creator',
    price: '99',
    description: 'Remove limits and ads for smooth creation.',
    icon: Sparkles,
    credits: '1,000 Neural Credits',
    popular: true,
    features: [
      'Ads-Free Experience',
      'Pro Quality Synthesis',
      'Save Unlimited Melodies',
      'Custom Voice Cloning',
      'AI Animation Rendering'
    ],
    buttonText: 'Upgrade to Creator',
    color: 'text-primary'
  },
  {
    id: 'pro',
    name: 'Neural Pro',
    price: '299',
    description: 'The definitive music research suite.',
    icon: Rocket,
    credits: '5,000 Neural Credits',
    features: [
      'Ads-Free Experience',
      'Ultra HD Audio Quality',
      'Advanced Voice Replacement',
      'Early access to Neural Models',
      'Priority Synthesis Queue'
    ],
    buttonText: 'Get Pro Access',
    color: 'text-secondary'
  }
];

export default function PricingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);
  const [isRewardedOpen, setIsRewardedOpen] = useState(false);

  return (
    <div className="space-y-16 pb-32">
      <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
            <ShieldCheck className="h-3 w-3" /> Secure Neural Subscription
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground leading-tight">Elevate Your <span className="text-primary">Creative DNA</span></h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Choose a plan that fits your rhythm. Stay on our Free ad-supported tier or upgrade for an uninterrupted, ads-free experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {PLANS.map((plan) => {
          const isCurrentPlan = profile?.plan === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col h-full border-primary/10 bg-card/50 backdrop-blur-md transition-all hover:-translate-y-2 ${plan.popular ? 'border-primary shadow-2xl shadow-primary/10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-xl">
                  Most Popular
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
                  <span className="text-muted-foreground text-sm">/ month</span>
                </div>
                <div className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 w-fit px-3 py-1 rounded-full border border-primary/20">
                  {plan.credits}
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-8 pt-0">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      {feature.includes('Ads-Free') ? <EyeOff className="h-4 w-4 text-primary mt-0.5" /> : feature.includes('Ad-Supported') ? <Eye className="h-4 w-4 text-muted-foreground mt-0.5" /> : feature.includes('Earn Credits') ? <PlayCircle className="h-4 w-4 text-primary mt-0.5" /> : <Check className="h-4 w-4 text-primary mt-0.5" />}
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  asChild={!isCurrentPlan || plan.id !== 'free'}
                  className="w-full h-12 rounded-xl font-bold shadow-lg"
                  variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'secondary'}
                  disabled={isCurrentPlan && plan.id !== 'free'}
                  onClick={() => {
                    if (plan.id === 'free' && isCurrentPlan) setIsRewardedOpen(true);
                  }}
                >
                  {isCurrentPlan && plan.id === 'free' ? (
                    <span>Earn Free Credits</span>
                  ) : (
                    <Link href={plan.id === 'free' ? '/suite' : '/profile/billing'}>
                      {isCurrentPlan ? 'Your Active Plan' : plan.buttonText}
                    </Link>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <section className="max-w-4xl mx-auto px-4">
          <div className="p-10 rounded-[2.5rem] bg-muted/20 border border-primary/10 flex flex-col items-center text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary fill-primary" />
              </div>
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-headline">Support Neural Innovation</h2>
                  <p className="text-muted-foreground max-w-xl mx-auto italic">
                      Every subscription fuels our research into more complex neural models. Join our community of creators today.
                  </p>
              </div>
          </div>
      </section>

      <RewardedAdModal 
        isOpen={isRewardedOpen}
        onOpenChange={setIsRewardedOpen}
        currentCredits={profile?.credits ?? 0}
      />
    </div>
  );
}
