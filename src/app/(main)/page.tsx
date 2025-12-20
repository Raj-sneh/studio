
'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Music, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const practiceImage = PlaceHolderImages.find(img => img.id === 'dashboard-practice');
  const teacherImage = PlaceHolderImages.find(img => img.id === 'dashboard-teacher');
  const { user, isUserLoading } = useUser();

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        {isUserLoading ? (
            <Skeleton className="h-16 w-16 rounded-full" />
        ) : (
            <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user-avatar/100/100"} alt={user?.displayName || "User"} />
                <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'G'}</AvatarFallback>
            </Avatar>
        )}
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">Welcome to Socio</h1>
        <p className="text-lg text-muted-foreground">What would you like to do today?</p>
      </div>

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
