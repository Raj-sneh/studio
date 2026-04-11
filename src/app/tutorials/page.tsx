'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  MonitorPlay, 
  Mic2, 
  Music, 
  Sparkles, 
  BrainCircuit, 
  ArrowRight,
  GraduationCap,
  Info,
  CheckCircle2,
  ArrowRightCircle,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type TutorialDetail = {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  tag: string;
  imageId: string;
  steps: {
    title: string;
    text: string;
  }[];
};

const TUTORIALS: TutorialDetail[] = [
  {
    id: 'studio-guide',
    title: 'Mastering AI Studio',
    description: 'Learn how to use iterative narrative beats and visual persistence protocols to build complex cinematic stories.',
    icon: MonitorPlay,
    color: 'text-primary',
    tag: 'Advanced AI',
    imageId: 'tutorial-studio',
    steps: [
      { title: 'Base Concept', text: 'Start by describing your initial scene in detail. This establishes the environment and characters.' },
      { title: 'Art Protocols', text: 'Choose between 3D CGI, 2D Animation, or Cinematic styles to set the visual DNA of your video.' },
      { title: 'Iterative Beats', text: 'Use the Assistant prompt to add actions. The AI will preserve the first scene while adding new narrative layers.' },
      { title: 'Exporting', text: 'Once the neural engine finalizes the coherent frames, download your MP4 for professional use.' }
    ]
  },
  {
    id: 'vocal-suite-guide',
    title: 'The Neural Vocal Suite',
    description: 'A deep dive into high-fidelity Text-to-Speech and our signature Neural Voice Swap research tool.',
    icon: Mic2,
    color: 'text-secondary',
    tag: 'Vocal Design',
    imageId: 'tutorial-vocal',
    steps: [
      { title: 'Voice Selection', text: 'Select a neural profile from our library, ranging from the SKV Master to specialized Pro voices like Clara.' },
      { title: 'Speech Synthesis', text: 'Enter your script. The Director AI will automatically add natural pauses and expressive punctuation.' },
      { title: 'Neural Voice Swap', text: 'Upload a recording of your own voice. The engine will "skin" your performance with the target profile.' },
      { title: 'Fine Tuning', text: 'Adjust stability and similarity boost settings to match the emotional tone of your project.' }
    ]
  },
  {
    id: 'piano-practice-guide',
    title: 'Virtual Piano Mastery',
    description: 'Get the most out of our high-fidelity grand piano. Learn to record, play back, and use interactive lessons.',
    icon: Music,
    color: 'text-accent',
    tag: 'Music Basics',
    imageId: 'tutorial-piano',
    steps: [
      { title: 'Interface Setup', text: 'Use the zoom and rotate tools to adjust the keyboard to your screen size and playing preference.' },
      { title: 'Recording Sessions', text: 'Hit the record button to capture MIDI-accurate performances. Listen back instantly to find errors.' },
      { title: 'Interactive Lessons', text: 'Follow the glowing keys in our curated lessons. The engine waits for your input before advancing.' },
      { title: 'Panic Protocol', text: 'If audio loops occur, use the Panic Button to instantly clear the neural audio buffer.' }
    ]
  },
  {
    id: 'voice-cloner-guide',
    title: 'Voice Cloning 101',
    description: 'How to train your personal neural artist using expressive phonetic samples across multiple languages.',
    icon: BrainCircuit,
    color: 'text-primary',
    tag: 'Neural Training',
    imageId: 'tutorial-cloner',
    steps: [
      { title: 'Naming Your Artist', text: 'Give your neural clone a unique name. This profile will be saved to your private library.' },
      { title: 'Training Scripts', text: 'Read the generated phonetic scripts aloud. These are designed to capture 1,000+ vocal parameters.' },
      { title: 'Sample Collection', text: 'Upload or record multiple 10-second samples. Clean "dry" audio leads to higher-fidelity clones.' },
      { title: 'Finalizing', text: 'The engine processes your data to create a neural embedding. Your voice is now ready for TTS and Swap.' }
    ]
  },
  {
    id: 'melody-maker-guide',
    title: 'AI Composition Engine',
    description: 'Compose unique piano melodies using prompts and refine them with reinforcement learning feedback.',
    icon: Sparkles,
    color: 'text-secondary',
    tag: 'Composition',
    imageId: 'tutorial-melody',
    steps: [
      { title: 'Writing Prompts', text: 'Describe a mood rather than just notes. E.g., "A melancholic rainy day tune with high trills."' },
      { title: 'Initial Composition', text: 'Click Initialize. The AI will generate a unique piano track matching your description.' },
      { title: 'Reinforcement Loop', text: 'Rate the tune. If it is "Bad", tell the AI what to fix (e.g., "make it faster") to regenerate.' },
      { title: 'Performance Learning', text: 'Switch to Learn mode to practice the generated melody on the virtual piano.' }
    ]
  }
];

export default function TutorialsPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialDetail | null>(null);

  return (
    <div className="space-y-16 pb-32">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
          <GraduationCap className="h-3 w-3" /> Visual Onboarding
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground">Tutorial Hub</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Master the Sargam AI ecosystem with ready-made visual guides and step-by-step instructions.
        </p>
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
        {TUTORIALS.map((tut) => {
          const readyMadeImage = PlaceHolderImages.find(img => img.id === tut.imageId);

          return (
            <Card key={tut.id} className="group border-primary/10 bg-card/50 backdrop-blur-md overflow-hidden hover:border-primary/30 transition-all flex flex-col">
              <div className="relative aspect-video bg-muted/20 flex flex-col items-center justify-center border-b border-white/5 overflow-hidden cursor-pointer" onClick={() => setSelectedTutorial(tut)}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none z-10" />
                
                {/* Ready-Made Visual Content */}
                <Image 
                  src={readyMadeImage?.imageUrl || `https://picsum.photos/seed/${tut.id}/800/450`}
                  alt={tut.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  data-ai-hint="tutorial preview"
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm z-20">
                  <div className="flex flex-col items-center gap-2">
                    <PlayCircle className="h-12 w-12 text-primary fill-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">View Visual Guide</span>
                  </div>
                </div>

                <div className="absolute top-4 left-4 z-20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full backdrop-blur-md">
                    {tut.tag}
                  </span>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-2xl font-headline group-hover:text-primary transition-colors">{tut.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-2 line-clamp-2">{tut.description}</CardDescription>
              </CardHeader>
              
              <div className="p-6 pt-0 mt-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTutorial(tut)}
                  className="w-full rounded-xl border-primary/20 hover:bg-primary/5 font-bold group/btn h-12"
                >
                  Launch Visual Guide <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Visual Guide Dialog */}
      <Dialog open={!!selectedTutorial} onOpenChange={(open) => !open && setSelectedTutorial(null)}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-primary/20 rounded-[2.5rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedTutorial?.title || 'Tutorial Guide'}</DialogTitle>
            <DialogDescription>{selectedTutorial?.description || 'Learn how to use Sargam AI features.'}</DialogDescription>
          </DialogHeader>

          {selectedTutorial && (
            <>
              <div className="relative h-64 w-full shrink-0">
                <Image 
                  src={PlaceHolderImages.find(img => img.id === selectedTutorial.imageId)?.imageUrl || `https://picsum.photos/seed/${selectedTutorial.id}/1200/600`}
                  alt={selectedTutorial.title}
                  fill
                  className="object-cover"
                  data-ai-hint="visual guide header"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-6 left-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                    <selectedTutorial.icon className="h-3 w-3" /> Step-by-Step Mastery
                  </div>
                  <h2 className="text-4xl font-bold font-headline text-foreground">{selectedTutorial.title}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-10">
                  <p className="text-muted-foreground text-lg leading-relaxed italic border-l-4 border-primary/30 pl-6">
                    {selectedTutorial.description}
                  </p>

                  <div className="grid gap-8">
                    {selectedTutorial.steps.map((step, i) => (
                      <div key={i} className="flex gap-6 items-start group">
                        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-black text-primary group-hover:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        <div className="space-y-2 pt-1">
                          <h4 className="font-bold text-xl flex items-center gap-2">
                            {step.title}
                            <CheckCircle2 className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {step.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8">
                    <Card className="bg-primary/5 border-primary/10 rounded-3xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                          <Info className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Pro Tip for {selectedTutorial.tag}</p>
                          <p className="text-xs text-muted-foreground">Mastering these steps ensures you get the highest quality results from the Sargam AI neural engine.</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-card/50 flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setSelectedTutorial(null)} className="rounded-xl font-bold">Close Guide</Button>
                <Button asChild className="rounded-xl font-bold px-8 shadow-xl shadow-primary/20">
                  <Link href="/suite" onClick={() => setSelectedTutorial(null)}>
                    Open AI Suite <ArrowRightCircle className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Global Help Footer */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border/50 flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-xl shadow-primary/5">
            <Info className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold font-headline">Need Technical Assistance?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              Our guides are updated weekly to match the latest neural research parameters. For specific errors, please reach out to our research support.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
              <Link href="/profile/support" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Visit Support Portal</Link>
              <Link href="/blog" className="text-[10px] font-black uppercase tracking-widest text-secondary hover:underline">Explore Research Blog</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
