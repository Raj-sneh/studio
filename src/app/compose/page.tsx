
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, ChevronLeft } from 'lucide-react';

export default function ComposePage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <Card className="max-w-lg text-center p-6">
        <CardHeader className="p-0">
          <div className="flex justify-center mb-4">
            <Bot className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="font-headline text-3xl">AI Composer - Under Calibration</CardTitle>
          <CardDescription className="pt-2 text-lg">
            My creative circuits are currently undergoing a deep-learning cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <p className="text-muted-foreground">
            This module is being enhanced to orchestrate magnificent new melodies. Please return shortly to witness its full potential.
          </p>
          <Button onClick={() => router.back()} className="mt-8" size="lg">
            <ChevronLeft />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
