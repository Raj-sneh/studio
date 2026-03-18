'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Music, BookOpen, Wand2, Sparkles } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AnimatedMusicBackground } from '@/components/AnimatedMusicBackground';
import { PulseRunner } from '@/components/suite/PulseRunner';

export default function LandingPage() {
  const practiceImg = PlaceHolderImages.find(img => img.id === 'dashboard-practice');
  const learnImg = PlaceHolderImages.find(img => img.id === 'dashboard-learn');
  const magicImg = PlaceHolderImages.find(img => img.id === 'dashboard-magic');

  return (
    <div className="relative space-y-32 pb-32">
      <AnimatedMusicBackground />
      
      {/* Hero Section */}
      <section className="text-center space-y-10 pt-20 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-bounce">
          <Sparkles className="h-3 w-3" /> Professional Music Engine
        </div>
        <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-tight">
          Master the Piano with <span className="text-primary">AI Intelligence</span>
        </h1>
        <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Sargam AI is your personal music workstation. Practice freely, follow guided lessons, or create unique melodies with our advanced AI studio.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 px-4 max-w-7xl mx-auto">
        <Link href="/practice" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={practiceImg?.imageUrl || ''} 
                alt="Practice Piano" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="piano practice"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Music className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">Free Practice Room</CardTitle>
              <CardDescription className="text-base leading-relaxed">Play our high-quality Virtual Grand Piano. Record your sessions and refine your skills in a stress-free environment.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/lessons" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={learnImg?.imageUrl || ''} 
                alt="Music Lessons" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="music lesson"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <BookOpen className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">Interactive Lessons</CardTitle>
              <CardDescription className="text-base leading-relaxed">Learn classic and modern songs with real-time feedback. Follow the glowing keys and track your progress.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/suite" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={magicImg?.imageUrl || ''} 
                alt="AI Studio" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="AI music"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Wand2 className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">AI Creative Studio</CardTitle>
              <CardDescription className="text-base leading-relaxed">Compose unique piano melodies or generate vocal tracks from your lyrics using our professional AI performance studio.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      {/* Pulse Runner Game Section */}
      <section className="max-w-7xl mx-auto px-4">
          <PulseRunner />
      </section>

      {/* Footer Info Section */}
      <section className="text-center py-20 px-4">
        <p className="text-muted-foreground max-w-2xl mx-auto italic text-lg leading-relaxed">
          "Music is the language of the soul. Let AI be your companion in mastering it. Open up your creative space and let the notes flow."
        </p>
      </section>
    </div>
  );
}
