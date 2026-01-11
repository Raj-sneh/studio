
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

/**
 * The entry point for the /compose route.
 * It uses a loader to dynamically import the client-side composer page,
 * which cannot be rendered on the server due to its use of browser APIs for audio.
 */
export default function ComposePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" />
          Magic Composer
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Describe the music you want to create, and let AI bring it to life.
        </p>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Coming Soon!</CardTitle>
            <CardDescription>The AI Magic Composer is currently in development. Check back soon to generate your own melodies.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">This feature will allow you to type a prompt and have our AI generate a unique piece of music for you to play and practice.</p>
        </CardContent>
      </Card>
    </div>
  );
}
