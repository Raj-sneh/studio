
'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, Wand2, Music4, Disc, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ComposeWithVirtualInstruments() {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-32">
      <Link href="/blog">
        <Button variant="ghost" className="mb-8"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Learning Hub</Button>
      </Link>

      <header className="space-y-6">
        <h1 className="font-headline text-5xl font-bold leading-tight">How to Use Virtual Instruments to Compose Your First Song</h1>
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Key Takeaways
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Songwriting is a top-down process: Mood &rarr; Structure &rarr; Melody.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> AI prompts can serve as your "Virtual Co-Writer."</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Synchronization between vocals and BGM is the key to professional sound.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Iterate frequently—don't try to make the first draft perfect.</li>
          </ul>
        </div>
      </header>

      <section className="prose prose-invert prose-primary max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <h2 className="text-3xl font-bold text-foreground font-headline">The Democratization of Composition</h2>
        <p>
          There was a time when composing a song required a multi-million dollar studio and a team of engineers. Today, with <strong>Sargam AI</strong>, you have a professional-grade workstation in your pocket. The challenge is no longer access to tools; it's the creative process itself.
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">Step 1: Establishing the Mood (The Prompt)</h2>
        <p>
          Start with your "Melody Maker" (AI Composer). Instead of writing notes, write a <em>feeling</em>. 
          <br /><br />
          <strong>Bad Prompt:</strong> "A song with piano."
          <br />
          <strong>Good Prompt:</strong> "A melancholic rainy-day piano melody with slow intervals and high-register trills."
          <br /><br />
          By being descriptive, you guide the AI to generate a midi-like structure that matches your emotional intent.
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">Step 2: Building the Foundation (The BGM)</h2>
        <p>
          Once you have a melody or a vocal idea, you need an accompaniment. Our <strong>BGM Composer</strong> uses neural analysis to "listen" to your vocal rhythm. If you upload a recording of yourself humming or singing, the AI analyzes the BPM (Beats Per Minute) and suggests a piano track that breathes with your performance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
          <div className="p-6 rounded-3xl bg-muted/20 border border-primary/10">
            <Music4 className="h-8 w-8 text-primary mb-4" />
            <h4 className="font-bold text-foreground mb-2">Melody Maker</h4>
            <p className="text-xs">Best for: Finding the "Hook" or the main theme of your song.</p>
          </div>
          <div className="p-6 rounded-3xl bg-muted/20 border border-secondary/10">
            <Disc className="h-8 w-8 text-secondary mb-4" />
            <h4 className="font-bold text-foreground mb-2">BGM Composer</h4>
            <p className="text-xs">Best for: Creating a rich, synchronized environment for your vocals.</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground font-headline">Step 3: Refining with AI Assistant</h2>
        <p>
          Don't work in a vacuum. If you're stuck on a chord progression or need help with lyrics, use the <strong>SKV AI Assistant</strong>. Ask it technical questions like: 
          <em>"What are three emotional piano chords that fit a G Major melody?"</em> or 
          <em>"Can you write a poem about artificial life to use as lyrics for my new song?"</em>
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">Step 4: The Vocal Finalization</h2>
        <p>
          Finally, use the <strong>Vocal Studio</strong> to turn your text lyrics into high-fidelity speech or use <strong>Voice Swap</strong> to give your composition a unique character. By combining your custom melody, AI-synced BGM, and a neural voice clone, you have a complete, professional-grade production.
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">Conclusion</h2>
        <p>
          Your first song doesn't have to be a masterpiece. The goal is to finish. Each completed track in your <strong>Generation History</strong> is a stepping stone to your unique musical identity.
        </p>
      </section>

      <footer className="pt-12 border-t border-border/10 text-center">
        <h2 className="text-2xl font-bold mb-4">Start Your Composition</h2>
        <Link href="/suite">
          <Button size="lg" className="rounded-full h-14 px-8 font-bold shadow-xl shadow-primary/20">
            Enter AI Creative Studio <Wand2 className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </footer>
    </article>
  );
}
