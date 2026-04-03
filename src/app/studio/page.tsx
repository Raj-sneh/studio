
'use client';

import { SargamStudio } from '@/components/suite/SargamStudio';
import { Sparkles, MonitorPlay, Info } from 'lucide-react';

export default function StudioPage() {
  return (
    <div className="space-y-12 pb-24">
      {/* Page Header */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
          <Sparkles className="h-3 w-3" /> Prototyper AI Enabled
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <MonitorPlay className="h-10 w-10 text-primary" />
          Sargam Studio
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The Definitive AI Animation Maker. Transform your words into cinematic 2D and 3D animations using professional neural rendering.
        </p>
      </div>

      {/* Main Studio Interface */}
      <div className="max-w-7xl mx-auto">
        <div className="p-1 rounded-[3rem] bg-gradient-to-br from-primary/20 via-transparent to-primary/5 border border-primary/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          <div className="bg-card/40 backdrop-blur-xl rounded-[2.9rem] overflow-hidden relative z-10">
            <SargamStudio />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
        <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> How it works
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sargam Studio uses the latest Google Veo 3 neural models. Unlike simple video filters, our engine builds 3D worlds and 2D characters from scratch based on your text descriptions.
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Prototyper Mode
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a "Visual Protocol" (3D, Cinematic, Anime, etc.) to set the rendering style. Prototyper AI handles the lighting, motion blur, and physics simulation for you.
          </p>
        </div>
      </div>
    </div>
  );
}
