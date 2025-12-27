'use client';

import { useState, useCallback, useRef, Suspense, lazy, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, Sparkles, Square, Wand2 } from 'lucide-react';
import { generateMelody } from '@/ai/flows/generate-melody-flow';
import type { Note } from '@/types';
import { getSampler } from '@/lib/samplers';
import { useToast } from '@/hooks/use-toast';

const Piano = lazy(() => import('@/components/Piano'));

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground">Loading Instrument...</p>
    </div>
  );
}

type Mode = 'idle' | 'generating' | 'playing';

// The notes for "Sa Re Ga Ma Pa Dha Ni Sa"
const sargamNotes: Note[] = [
  { key: 'C4', duration: '4n', time: '0:0:0' },
  { key: 'D4', duration: '4n', time: '0:1:0' },
  { key: 'E4', duration: '4n', time: '0:2:0' },
  { key: 'F4', duration: '4n', time: '0:3:0' },
  { key: 'G4', duration: '4n', time: '1:0:0' },
  { key: 'A4', duration: '4n', time: '1:1:0' },
  { key: 'B4', duration: '4n', time: '1:2:0' },
  { key: 'C5', duration: '2n', time: '1:3:0' },
];


export default function ComposePage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<Mode>('idle');
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([]);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  // This useEffect hook runs only once on mount to initialize the instrument.
  // It is the correct and stable way to handle asynchronous setup.
  useEffect(() => {
    let active = true;
    const loadAudio = async () => {
      // Set loading state for the UI
      setIsInstrumentReady(false);
      try {
        // Start Tone.js context and get the piano sampler
        await Tone.start();
        const sampler = await getSampler('piano');
        if (active) {
          samplerRef.current = sampler;
          setIsInstrumentReady(true);
          // *** TEST CODE: Load the sargam notes automatically ***
          // setGeneratedNotes(sargamNotes);
        }
      } catch (error) {
        console.error("Failed to load instrument:", error);
        toast({
          title: "Instrument Failed to Load",
          description: "There was an issue loading the piano sound. Please refresh.",
          variant: "destructive"
        });
      }
    };
    
    loadAudio();

    return () => {
      active = false;
      // Clean up Tone.js resources on unmount
      partRef.current?.dispose();
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
    };
  }, [toast]); // Dependency array includes toast to satisfy the linter, but it's stable.

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please describe the melody you want to create.',
        variant: 'destructive',
      });
      return;
    }
    setMode('generating');
    setGeneratedNotes([]);

    try {
      const result = await generateMelody({ prompt });
      if (result.notes && result.notes.length > 0) {
        setGeneratedNotes(result.notes);
        toast({
            title: "Melody Generated!",
            description: "Your new melody is ready to be played.",
        });
      } else {
        toast({
            title: "Could not generate melody",
            description: "The AI could not create a melody from your prompt. Try being more specific.",
            variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('An error occurred during melody generation:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'An unknown error occurred. Please check the console (F12) for more details.',
        variant: 'destructive',
      });
    } finally {
      setMode('idle');
    }
  };
  
  // This function uses Tone.Part for reliable scheduling, fixing the previous re-render bugs.
  const playMelody = useCallback(() => {
    if (!samplerRef.current || generatedNotes.length === 0 || samplerRef.current.disposed) {
      return;
    }
    setMode('playing');
    
    // Ensure any previous playback is stopped and cleaned up
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    partRef.current?.dispose();
    setHighlightedKeys([]);
    
    const sampler = samplerRef.current;
    
    // Map the notes into a format that Tone.Part understands
    const noteEvents = generatedNotes.map(note => ({
        time: note.time,
        note: note.key,
        duration: note.duration,
    }));
    
    // Create a new Tone.Part. This is the correct way to schedule a sequence of notes.
    partRef.current = new Tone.Part((time, event) => {
      // Play the audio note
      if (sampler && 'triggerAttackRelease' in sampler && !sampler.disposed) {
        sampler.triggerAttackRelease(event.note, event.duration, time);
      }
      
      // Schedule the UI update (highlighting) to sync with the audio context time.
      // This prevents React re-renders from interfering with audio.
      Tone.Draw.schedule(() => {
        setHighlightedKeys(current => [...current, event.note]);
      }, time);

      // Schedule the key to be un-highlighted just before it ends
      const releaseTime = time + Tone.Time(event.duration).toSeconds() * 0.95;
      Tone.Draw.schedule(() => {
        setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== event.note));
      }, releaseTime);

    }, noteEvents).start(0);

    // Calculate the total duration of the melody to schedule the stop event
    const totalDuration = noteEvents.reduce((max, note) => {
        const endTime = Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds();
        return Math.max(max, endTime);
    }, 0);
    
    Tone.Transport.start();

    // Schedule the UI to return to 'idle' state after the melody has finished playing.
    Tone.Transport.scheduleOnce(() => {
        setMode('idle');
        setHighlightedKeys([]);
    }, totalDuration + 0.2); // Add a small buffer
    
  }, [generatedNotes]);

  const stopPlayback = () => {
    setHighlightedKeys([]);
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    partRef.current?.dispose();
    // Ensure any "stuck" notes are released immediately
    if(samplerRef.current && 'releaseAll' in samplerRef.current) {
        samplerRef.current.releaseAll();
    }
    setMode("idle");
  };
  
  // UI is ready only when the instrument is loaded and we are not in the middle of generating.
  const isUIReady = isInstrumentReady && mode !== 'generating';

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

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Melody</CardTitle>
          <CardDescription>
            Use descriptive words like "a happy, fast-paced piano tune" or "a slow, sad melody in a minor key".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A simple and cheerful nursery rhyme..."
            className="min-h-[100px]"
            disabled={!isUIReady}
          />
          <Button onClick={handleGenerate} disabled={!isUIReady || !prompt.trim()} size="lg" className="w-full">
            {mode === 'generating' ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {mode === 'generating' ? 'Generating...' : 'Generate Melody'}
          </Button>
        </CardContent>
      </Card>
      
      {generatedNotes.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Your AI-Generated Melody</CardTitle>
                <CardDescription>Press play to hear the result, or see it on the piano below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {mode !== 'playing' ? (
                     <Button onClick={playMelody} disabled={!isUIReady} size="lg" className="w-full">
                        <Play className="mr-2 h-5 w-5"/>
                        Play Melody
                    </Button>
                 ) : (
                    <Button onClick={stopPlayback} size="lg" className="w-full" variant="destructive">
                        <Square className="mr-2 h-5 w-5"/>
                        Stop
                    </Button>
                 )}
                 <div className="min-h-[200px] flex items-center justify-center">
                    <Suspense fallback={<InstrumentLoader />}>
                        <Piano highlightedKeys={highlightedKeys} disabled={true} />
                    </Suspense>
                </div>
            </CardContent>
        </Card>
      )}

      {/* Show a full-page loader only during the initial instrument setup */}
      {!isInstrumentReady && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <InstrumentLoader />
        </div>
      )}
    </div>
  );
}
