
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { lessons } from "@/lib/lessons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Guitar, Drum, Music2 as Violin, Piano as PianoIcon, Wind, Lollipop, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Instrument, UserProfile } from "@/types";
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const instrumentIcons: Record<Instrument, React.ElementType> = {
  piano: PianoIcon,
  guitar: Guitar,
  drums: Drum,
  violin: Violin,
  xylophone: Lollipop,
  flute: Wind,
  saxophone: Wind,
};

const instrumentOrder: Instrument[] = ['piano', 'guitar', 'drums', 'violin', 'xylophone', 'flute', 'saxophone'];

export default function LessonsPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const isPremium = userProfile?.subscriptionTier === 'premium';

  const handleLessonClick = (e: React.MouseEvent, lessonId: string) => {
    if (!isPremium) {
      e.preventDefault();
      setShowUpgradeDialog(true);
    } else {
      router.push(`/lessons/${lessonId}`);
    }
  };

  const groupedLessons = lessons.reduce((acc, lesson) => {
    (acc[lesson.instrument] = acc[lesson.instrument] || []).push(lesson);
    return acc;
  }, {} as Record<Instrument, typeof lessons>);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">AI Teacher Lessons</h1>
        <p className="mt-2 text-lg text-muted-foreground">Choose a lesson to start learning with AI feedback.</p>
      </div>

      {instrumentOrder.map(instrument => {
        const lessonsForInstrument = groupedLessons[instrument];
        if (!lessonsForInstrument) return null;
        const Icon = instrumentIcons[instrument];

        return (
          <div key={instrument} className="space-y-6">
            <div className="flex items-center gap-3">
              <Icon className="h-8 w-8 text-primary" />
              <h2 className="font-headline text-3xl font-bold capitalize">{instrument} Lessons</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessonsForInstrument.map((lesson) => {
                const image = PlaceHolderImages.find(img => img.id === lesson.imageId);
                return (
                  <Card key={lesson.id} className="flex flex-col overflow-hidden group hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
                    <CardHeader className="p-0">
                      {image && (
                        <div className="aspect-video overflow-hidden relative">
                          <Image
                            src={image.imageUrl}
                            alt={image.description}
                            width={600}
                            height={400}
                            data-ai-hint={image.imageHint}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex-1">
                        <Badge variant="outline">{lesson.difficulty}</Badge>
                        <CardTitle className="font-headline text-xl mt-4">{lesson.title}</CardTitle>
                      </div>
                      <div className="mt-6">
                        <Link href={`/lessons/${lesson.id}`} passHref onClick={(e) => handleLessonClick(e, lesson.id)}>
                          <Button className="w-full">
                            Start Lesson
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )
      })}

      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl flex items-center gap-2">
              <Gem className="text-primary" />
              Upgrade to Premium
            </AlertDialogTitle>
            <AlertDialogDescription>
              To access AI-powered lessons, you need to upgrade to a Premium account. Unlock all features and accelerate your learning!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/pricing')}>Upgrade Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
