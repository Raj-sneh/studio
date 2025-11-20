
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Gem, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    priceSuffix: '/ month',
    features: ['Practice Mode', 'Limited AI feedback', 'Ads included'],
    cta: 'Current Plan',
    isCurrent: true,
  },
  {
    name: 'Premium',
    price: '$9.99',
    priceSuffix: '/ month',
    features: ['Unlimited AI Teacher lessons', 'In-depth performance analysis', 'Ad-free experience', 'Priority support'],
    cta: 'Upgrade to Premium',
    isCurrent: false,
    isFeatured: true,
  },
];

export default function PricingPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user || !firestore) {
      toast({ title: 'You must be logged in to upgrade.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const userDocRef = doc(firestore, 'users', user.uid);
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

    try {
      updateDocumentNonBlocking(userDocRef, {
        subscriptionTier: 'premium',
        subscriptionUntil: subscriptionEndDate.toISOString(),
      });

      toast({
        title: 'Upgrade Successful!',
        description: 'Welcome to Premium! All features are now unlocked.',
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => router.push('/dashboard'), 1500);

    } catch (error: any) {
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Unlock Your Potential</h1>
        <p className="mt-2 text-lg text-muted-foreground">Choose the plan that's right for you and start mastering music today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={cn('flex flex-col', tier.isFeatured && 'border-primary ring-2 ring-primary shadow-lg shadow-primary/10')}
          >
            <CardHeader className="relative">
              {tier.isFeatured && (
                <div className="absolute top-0 right-4 -mt-4">
                  <div className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    <Star className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}
              <CardTitle className="font-headline text-3xl">{tier.name}</CardTitle>
              <CardDescription className="text-4xl font-bold">
                {tier.price}
                <span className="text-lg font-normal text-muted-foreground">{tier.priceSuffix}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {tier.name === 'Premium' ? (
                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? 'Upgrading...' : tier.cta}
                </Button>
              ) : (
                <Button className="w-full h-12 text-lg" variant="outline" disabled>
                  {tier.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
