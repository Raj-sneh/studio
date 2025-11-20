
'use client';
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Music, BrainCircuit, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import type { UserProfile } from '@/types';
import { doc } from "firebase/firestore";
import { useState } from "react";

const AdPlaceholder = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="relative bg-muted/50 p-4 rounded-lg border border-dashed border-border text-center">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setIsOpen(false)}>
        <X className="h-4 w-4" />
      </Button>
      <p className="text-sm text-muted-foreground">Ad Placeholder</p>
      <p className="font-semibold">Upgrade to Premium to remove ads!</p>
       <Link href="/pricing">
          <Button size="sm" className="mt-2">Upgrade</Button>
       </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const practiceImage = PlaceHolderImages.find(img => img.id === 'dashboard-practice');
  const teacherImage = PlaceHolderImages.find(img => img.id === 'dashboard-teacher');

  const isPremium = userProfile?.subscriptionTier === 'premium';


  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Welcome to Socio</h1>
        <p className="mt-2 text-lg text-muted-foreground">What would you like to do today?</p>
      </div>

      {!isPremium && <AdPlaceholder />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden group hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="p-0">
            {practiceImage && (
              <div className="aspect-video overflow-hidden">
                <Image
                  src={practiceImage.imageUrl}
                  alt={practiceImage.description}
                  width={600}
                  height={400}
                  data-ai-hint={practiceImage.imageHint}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-6">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Music className="text-accent" />
                Practice Mode
              </CardTitle>
              <CardDescription className="pt-2">
                Hone your skills on various instruments. Play freely, record your sessions, and master your craft.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/practice">
              <Button className="w-full" variant="secondary">
                Start Practicing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden group hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="p-0">
            {teacherImage && (
              <div className="aspect-video overflow-hidden">
                <Image
                  src={teacherImage.imageUrl}
                  alt={teacherImage.description}
                  width={600}
                  height={400}
                  data-ai-hint={teacherImage.imageHint}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-6">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BrainCircuit className="text-accent" />
                AI Teacher
              </CardTitle>
              <CardDescription className="pt-2">
                Take on guided lessons. Get real-time feedback and analysis from our AI to accelerate your learning.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/lessons">
              <Button className="w-full">
                Browse Lessons <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
