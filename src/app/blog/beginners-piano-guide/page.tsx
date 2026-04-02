'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle2, Music, Info } from 'lucide-react';
import Link from 'next/link';

export default function BeginnersPianoGuide() {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-32">
      <Link href="/blog">
        <Button variant="ghost" className="mb-8"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Learning Hub</Button>
      </Link>

      <header className="space-y-6">
        <h1 className="font-headline text-5xl font-bold leading-tight">A Complete Guide to Learning Piano for Absolute Beginners</h1>
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Key Takeaways
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Proper posture is the foundation of speed and accuracy.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> The C Major scale is the starting point for all Western music.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Virtual pianos are valid, professional-grade practice tools.</li>
            <li className="flex items-start gap-2"><span className="text-primary">•</span> Consistency over duration is the secret to muscle memory.</li>
          </ul>
        </div>
      </header>

      <section className="prose prose-invert prose-primary max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <h2 className="text-3xl font-bold text-foreground font-headline">The Philosophy of the First Note</h2>
        <p>
          Learning the piano is often compared to learning a new language. You aren't just memorizing where keys are; you are learning to translate internal emotion into external vibration. For an absolute beginner, the initial hurdle isn't the difficulty of the music—it's the overwhelming nature of the interface. With 88 keys staring back at you, it’s easy to feel lost. However, once you understand the repeating pattern of 12 notes, the keyboard becomes a manageable landscape.
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">1. Understanding Your Workspace: The 88-Key Layout</h2>
        <p>
          A standard piano has 52 white keys and 36 black keys. Notice the pattern of the black keys: they always appear in groups of two and three. This is your roadmap.
        </p>
        <h3 className="text-xl font-bold text-foreground">Finding "Middle C"</h3>
        <p>
          Look for a group of two black keys. The white key directly to the left of these two black keys is always <strong>C</strong>. "Middle C" is generally the C located in the very center of your keyboard. In music production software and on the <strong>Sargam AI Virtual Piano</strong>, this is often labeled as <strong>C4</strong>.
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">2. The Foundation: Posture and Hand Positioning</h2>
        <p>
          Before you play a single note, you must sit correctly. If you are using a digital piano or our virtual studio, ensure your screen is at eye level to avoid neck strain.
        </p>
        <ul className="space-y-4">
          <li><strong>The "Claw" Shape:</strong> Your hands should never be flat. Imagine you are holding a tennis ball or an orange. Your fingers should be curved, striking the keys with the very tips (except for the thumb, which uses the side).</li>
          <li><strong>Weight vs. Force:</strong> Never "hit" the keys. Instead, use the weight of your arm to drop into the note. This allows for a richer tone and prevents fatigue.</li>
        </ul>

        <div className="p-8 bg-muted/30 rounded-3xl border border-primary/10 flex gap-6 items-start italic">
          <Info className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-bold text-foreground not-italic mb-2">Sargam AI Tip:</p>
            When practicing on our virtual keyboard, use the "Zoom" slider to adjust the key size to match your natural finger span on the screen. This helps build "visual muscle memory" that translates well to physical keyboards.
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground font-headline">3. Your First Scale: The C Major</h2>
        <div className="space-y-4">
          <p>
            The C Major scale consists of eight notes: C, D, E, F, G, A, B, and C. On the piano, these are all white keys. 
          </p>
          <h3 className="text-xl font-bold text-foreground">The "Thumb Tuck" Technique</h3>
          <p>
            To play a full scale smoothly, you cannot simply move your hand side-to-side. You must learn the thumb tuck:
          </p>
          <ol className="mt-2 space-y-2 list-decimal list-inside ml-4">
            <li>Play C, D, and E with your thumb, index, and middle fingers (fingers 1, 2, and 3).</li>
            <li>While holding the E, tuck your thumb (finger 1) underneath your middle finger to reach the F.</li>
            <li>Continue the scale naturally.</li>
          </ol>
        </div>

        <h2 className="text-3xl font-bold text-foreground font-headline">4. The Importance of Virtual Practice</h2>
        <p>
          In the modern era, you don't need a $10,000 grand piano to start. Tools like the <strong>Sargam AI Practice Room</strong> allow you to understand intervals, practice rhythms, and record your sessions for review. Virtual practice removes the barrier to entry, allowing you to learn the "logic" of music before investing in heavy hardware.
        </p>

        <h2 className="text-3xl font-bold text-foreground font-headline">5. Establishing a Daily Routine</h2>
        <p>
          Five minutes of focused practice every day is vastly superior to one hour of practice once a week. Your brain processes musical patterns during sleep. By touching the keys every day, you reinforce the neural pathways required for finger independence.
        </p>
        <p>
          Start with our "Sargam Practice" lesson in the <strong>Lessons</strong> section. It’s designed specifically to walk you through basic intervals with real-time feedback.
        </p>
      </section>

      <footer className="pt-12 border-t border-border/10 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to try your first note?</h2>
        <Link href="/practice">
          <Button size="lg" className="rounded-full h-14 px-8 font-bold shadow-xl shadow-primary/20">
            Open Virtual Piano <Music className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </footer>
    </article>
  );
}
