
'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, ListChecks, History } from 'lucide-react';
import Link from 'next/link';

export default function PianoDexterityExercises() {
  return (
    <article className="max-w-4xl mx-auto space-y-12 pb-32">
      <Link href="/blog">
        <Button variant="ghost" className="mb-8"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Learning Hub</Button>
      </Link>

      <header className="space-y-6">
        <h1 className="font-headline text-5xl font-bold leading-tight">10 Daily Exercises to Improve Finger Dexterity on a Digital Piano</h1>
        <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-accent mb-4 flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> Key Takeaways
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
            <li className="flex items-start gap-2"><span className="text-accent">•</span> Speed is a byproduct of control, not force.</li>
            <li className="flex items-start gap-2"><span className="text-accent">•</span> The 4th and 5th fingers are naturally the weakest and need specific focus.</li>
            <li className="flex items-start gap-2"><span className="text-accent">•</span> Practicing with a metronome is non-negotiable for dexterity.</li>
            <li className="flex items-start gap-2"><span className="text-accent">•</span> Rhythmic variation breaks physical plateaus.</li>
          </ul>
        </div>
      </header>

      <section className="prose prose-invert prose-accent max-w-none space-y-10 text-muted-foreground leading-relaxed">
        <h2 className="text-3xl font-bold text-foreground font-headline">The Mechanics of Digital Play</h2>
        <p>
          Unlike an acoustic piano, where you are moving a physical hammer to strike a string, a digital piano or a virtual keyboard often has a different "weight" and response time. To master dexterity on tools like <strong>Sargam AI</strong>, you must train your fingers to be independent, precise, and fast.
        </p>

        <div className="grid gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">1. Five-Finger Parallel Motion</h3>
            <p>Place both hands on the keys (Right hand on C4-G4, Left hand on C3-G3). Play up and down the five notes together perfectly in sync. <strong>Goal:</strong> Zero flamming (notes must sound at the exact same millisecond).</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">2. The "Spider" Independence Walk</h3>
            <p>Hold down all five notes (C-D-E-F-G) with both hands. While keeping four fingers depressed, lift only the 4th finger and tap it four times. Repeat for each finger. <strong>Focus:</strong> Do not let the other fingers pop up.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">3. C-E-D-F-E-G Thirds</h3>
            <p>Practice skipping a note. Instead of 1-2-3, play 1-3, 2-4, 3-5. This builds the specific lateral muscles in your hand that are rarely used in daily life.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">4. Contrary Motion Scales</h3>
            <p>Start with both thumbs on Middle C. Right hand moves up the scale, while the left hand moves down. This forces your brain to decouple the movements of your hands.</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">5. Rhythmic Displacement (The 3+1 Drill)</h3>
            <p>Play a standard five-finger pattern, but play the first three notes as 16th notes (fast) and the 4th note as a quarter note (held). Then shift the "hold" to the 3rd note, then the 2nd. This teaches your fingers to "burst" without losing control.</p>
          </div>
        </div>

        <div className="p-8 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/20 flex flex-col items-center text-center gap-4">
          <History className="h-10 w-10 text-primary" />
          <div>
            <p className="font-bold text-foreground text-lg mb-1">Track Your Progress</p>
            <p className="text-sm italic">
              Use the "Record" feature in the <strong>Sargam Practice Room</strong> while doing these drills. Playback your session at 50% speed. You will hear micro-timing errors that are invisible at full speed. Correcting these is the fastest way to professional-level dexterity.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground font-headline">Maintaining Momentum</h2>
        <p>
          Dexterity isn't just about speed; it's about the ability to play quietly (<em>pianissimo</em>) or loudly (<em>fortissimo</em>) with the same level of accuracy. As you practice on our virtual grand piano, pay attention to the "interactive feedback" glows. If you are hitting the wrong keys, slow down. Accuracy is the parent of speed.
        </p>
      </section>

      <footer className="pt-12 border-t border-border/10 text-center">
        <h2 className="text-2xl font-bold mb-4">Start Your Drills</h2>
        <Link href="/practice">
          <Button size="lg" className="rounded-full h-14 px-8 font-bold shadow-xl shadow-accent/20" variant="default" style={{ backgroundColor: 'hsl(var(--accent))', color: 'white' }}>
            Open Practice Room <Zap className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </footer>
    </article>
  );
}
