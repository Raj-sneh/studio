'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Music, BookOpen, Wand2, Sparkles, User } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AnimatedMusicBackground } from '@/components/AnimatedMusicBackground';

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
          <Sparkles className="h-3 w-3" /> Developed by SKV
        </div>
        <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-tight">
          Sargam AI: The <span className="text-primary">Virtual Piano</span> & AI Tutor
        </h1>
        <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Created by <span className="text-foreground font-semibold">Sneh Kumar Verma</span>, Sargam AI is your intelligent music workstation. Practice on a professional virtual piano, follow guided lessons, or compose unique melodies with our advanced AI studio.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 px-4 max-w-7xl mx-auto">
        <Link href="/practice" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={practiceImg?.imageUrl || ''} 
                alt="Practice Virtual Piano" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="piano practice"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Music className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">Virtual Piano Practice</CardTitle>
              <CardDescription className="text-base leading-relaxed">Play our high-quality Virtual Grand Piano. Record your sessions and refine your skills in a stress-free environment designed for musicians.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/lessons" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={learnImg?.imageUrl || ''} 
                alt="Music Learning AI" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="music lesson"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <BookOpen className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">AI Piano Tutor</CardTitle>
              <CardDescription className="text-base leading-relaxed">Learn classic and modern songs with real-time feedback from the Sargam AI tutor. Follow the glowing keys and track your musical progress.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/suite" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={magicImg?.imageUrl || ''} 
                alt="AI Music Suite" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="AI music"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Wand2 className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">SKV AI Creative Studio</CardTitle>
              <CardDescription className="text-base leading-relaxed">Compose unique piano melodies or generate vocal tracks from your lyrics using our professional AI performance studio built by SKV.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      {/* About Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-headline font-bold">About the Developer</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Sargam AI is a passion project by <span className="text-primary font-semibold">Sneh Kumar Verma</span>, designed to bridge the gap between technology and musical education. As an AI piano tutor, this platform leverages state-of-the-art models to provide a seamless <span className="text-foreground font-medium">virtual piano</span> experience for learners worldwide.
          </p>
        </div>
      </section>

      {/* Footer Info Section */}
      <section className="text-center py-20 px-4">
        <p className="text-muted-foreground max-w-2xl mx-auto italic text-lg leading-relaxed">
          "Music is the language of the soul. Let Sargam AI be your companion in mastering it. Open up your creative space and let the notes flow."
        </p>
      </section>
    </div>
  );
}
