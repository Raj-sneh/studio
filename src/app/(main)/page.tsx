
'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Music, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { AIBot } from "@/components/AIBot";

export default function DashboardPage() {
  const practiceImage = PlaceHolderImages.find(img => img.id === 'dashboard-practice');
  const magicImage = PlaceHolderImages.find(img => img.id === 'dashboard-magic');

  return (
    <div className="space-y-8">
      <AIBot />
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Welcome to Socio</h1>
        <p className="mt-2 text-lg text-muted-foreground">The AI-powered music learning companion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Magic Composer */}
        <Card className="overflow-hidden group hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="p-0">
            {magicImage && (
              <div className="aspect-[16/10] overflow-hidden">
                <Image
                  src={magicImage.imageUrl}
                  alt={magicImage.description}
                  width={600}
                  height={375}
                  data-ai-hint={magicImage.imageHint}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <div className="p-6">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Wand2 className="text-accent" />
                Magic Composer
              </CardTitle>
              <CardDescription className="pt-2">
                Describe music and let our AI bring it to life in an instant.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Link href="/compose">
              <Button className="w-full">
                Create with AI <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Practice Mode */}
        <Card className="overflow-hidden group hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="p-0">
            {practiceImage && (
              <div className="aspect-[16/10] overflow-hidden">
                <Image
                  src={practiceImage.imageUrl}
                  alt={practiceImage.description}
                  width={600}
                  height={375}
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
                Hone your skills, play freely, and record your musical ideas.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Link href="/practice">
              <Button className="w-full" variant="secondary">
                Start Practicing <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
