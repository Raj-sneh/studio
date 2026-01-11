
'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Music, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AIBot from "@/components/AIBot";

export default function DashboardPage() {
  const practiceImage = PlaceHolderImages.find(img => img.id === 'dashboard-practice');
  const magicImage = PlaceHolderImages.find(img => img.id === 'dashboard-magic');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Welcome to Sargam by SKV</h1>
        <p className="mt-2 text-lg text-muted-foreground">The AI-powered music learning companion.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/practice">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Practice</CardTitle>
              <Music className="w-6 h-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Hone your skills with interactive exercises and receive instant feedback.</p>
              {practiceImage && 
                <Image 
                  src={practiceImage.imageUrl}
                  alt={practiceImage.description}
                  width={400}
                  height={200}
                  className="rounded-md object-cover w-full h-48"
                  priority
                />
              }
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <Link href="/compose">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>AI Composer</CardTitle>
              <Wand2 className="w-6 h-6 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Generate unique melodies and chord progressions with the power of AI.</p>
              {magicImage && 
                <Image 
                  src={magicImage.imageUrl}
                  alt={magicImage.description}
                  width={400}
                  height={200}
                  className="rounded-md object-cover w-full h-48"
                />
              }
            </CardContent>
          </Link>
        </Card>
      </div>

      <div className="text-center">
        <Link href="/lessons">
          <Button size="lg">
            Explore Lessons <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && <AIBot />}
    </div>
  );
}
