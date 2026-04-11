'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlayCircle, 
  MonitorPlay, 
  Mic2, 
  Music, 
  Sparkles, 
  BrainCircuit, 
  ArrowRight,
  GraduationCap,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TUTORIALS = [
  {
    id: 'studio-guide',
    title: 'Mastering AI Studio',
    description: 'Learn how to use iterative narrative beats and visual persistence protocols to build complex cinematic stories.',
    icon: MonitorPlay,
    color: 'text-primary',
    tag: 'Advanced AI',
    steps: [
      'Establishing your base visual concept',
      'Using Art Protocols (3D vs 2D)',
      'Adding iterative scene instructions',
      'Maintaining narrative persistence'
    ]
  },
  {
    id: 'vocal-suite-guide',
    title: 'The Neural Vocal Suite',
    description: 'A deep dive into high-fidelity Text-to-Speech and our signature Neural Voice Swap research tool.',
    icon: Mic2,
    color: 'text-secondary',
    tag: 'Vocal Design',
    steps: [
      'Choosing the right neural voice profile',
      'Optimizing text for expressive speech',
      'Uploading audio for Neural Voice Swap',
      'Understanding Speech-to-Speech (STS)'
    ]
  },
  {
    id: 'piano-practice-guide',
    title: 'Virtual Piano Mastery',
    description: 'Get the most out of our high-fidelity grand piano. Learn to record, play back, and use interactive lessons.',
    icon: Music,
    color: 'text-accent',
    tag: 'Music Basics',
    steps: [
      'Calibrating your audio engine',
      'Recording and listening to sessions',
      'Following glowing keys in lessons',
      'Using the piano zoom and rotate tools'
    ]
  },
  {
    id: 'voice-cloner-guide',
    title: 'Voice Cloning 101',
    description: 'How to train your personal neural artist using expressive phonetic samples across multiple languages.',
    icon: BrainCircuit,
    color: 'text-primary',
    tag: 'Neural Training',
    steps: [
      'Naming your neural artist',
      'Recording phonetic training scripts',
      'Processing high-quality vocal samples',
      'Adding your clone to the Studio'
    ]
  },
  {
    id: 'melody-maker-guide',
    title: 'AI Composition Engine',
    description: 'Compose unique piano melodies using prompts and refine them with reinforcement learning feedback.',
    icon: Sparkles,
    color: 'text-secondary',
    tag: 'Composition',
    steps: [
      'Writing effective descriptive prompts',
      'Initializing the neural composition',
      'Using Reinforcement Logs to refine tunes',
      'Learning your new melody step-by-step'
    ]
  }
];

export default function TutorialsPage() {
  return (
    <div className="space-y-16 pb-32">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
          <GraduationCap className="h-3 w-3" /> Visual Onboarding
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground">Tutorial Hub</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Master the Sargam AI ecosystem with our step-by-step visual guides and neural research protocols.
        </p>
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
        {TUTORIALS.map((tut) => (
          <Card key={tut.id} className="group border-primary/10 bg-card/50 backdrop-blur-md overflow-hidden hover:border-primary/30 transition-all flex flex-col">
            <div className="relative aspect-video bg-muted/20 flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              <tut.icon className={cn("h-16 w-16 mb-4 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700", tut.color)} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <PlayCircle className="h-12 w-12 text-primary fill-primary/20" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Initialize Guide</span>
                </div>
              </div>
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                  {tut.tag}
                </span>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-headline group-hover:text-primary transition-colors">{tut.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-2">{tut.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">What you will learn:</p>
                <ul className="grid grid-cols-1 gap-2">
                  {tut.steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-muted-foreground italic">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <Button variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-primary/5 font-bold group/btn">
                Launch Tutorial <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Global Help Footer */}
      <div className="max-w-4xl mx-auto">
        <div className="p-8 rounded-[2.5rem] bg-muted/20 border border-border/50 flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-xl shadow-primary/5">
            <Info className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold font-headline">Need Technical Assistance?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              Our tutorials cover 90% of user queries. For specific neural errors or credit management issues, please visit our support portal or contact the developer directly.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
              <Link href="/profile/support" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest">Visit Support Portal</Link>
              <Link href="/blog" className="p-0 h-auto font-black uppercase text-[10px] tracking-widest text-secondary">Explore Research Blog</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
