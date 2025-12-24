
'use client';

import { useState, useCallback, useRef, Suspense, lazy, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, Sparkles, Square, Wand2 } from 'lucide-react';
import { generateMelody } from '@/ai/flows/generate-melody-flow';
import type { Note, Instrument } from '@/types';
import { getSampler, allSamplersLoaded } from '@/lib/samplers';
import { useToast } from '@/hooks/use-toast';

const Piano = lazy(() => import('@/components/Piano'));
const Guitar = lazy(() => import('@/components/Guitar'));
const Flute = lazy(() => import('@/components/Flute'));
const Saxophone = lazy(() => import('@/components/Saxophone'));
const Violin = lazy(() => import('@/components/Violin'));
const Xylophone = lazy(() => import('@/components/Xylophone'));
const DrumPad = lazy(() => import('@/components/DrumPad'));

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground">Warming up the instruments...</p>
    </div>
  );
}

const instrumentComponents: Record<Instrument, React.ElementType> = {
    piano: Piano,
    guitar: Guitar,
    flute: Flute,
    saxophone: Saxophone,
    violin: Violin,
    xylophone: Xylophone,
    drums: DrumPad,
}

type Mode = 'idle' | 'generating' | 'playing';

export default function ComposePage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<Mode>('idle');
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([]);
  const [currentInstrument, setCurrentInstrument] = useState<Instrument>('piano');
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  const cleanupAudio = useCallback(() => {
    // This is a more robust cleanup
    if (partRef.current) {
      partRef.current.stop(0);
      partRef.current.dispose();
      partRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setHighlightedKeys([]);

    // The sampler itself doesn't need to be disposed here if we are reusing it,
    // but we ensure all sounds are stopped.
    if (samplerRef.current && 'releaseAll' in samplerRef.current && typeof samplerRef.current.releaseAll === 'function' && !samplerRef.current.disposed) {
      (samplerRef.current as Tone.Sampler).releaseAll();
    }
  }, []);

  // Effect for initial load and cleanup on unmount
  useEffect(() => {
    const loadInitialInstrument = async () => {
      setIsInstrumentReady(false);
      await Tone.start();
      // Pre-load piano by default
      samplerRef.current = getSampler('piano');
      await allSamplersLoaded('piano');
      setIsInstrumentReady(true);
    };
    loadInitialInstrument();

    // This is the key cleanup function that runs only on unmount
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const stopPlayback = useCallback(() => {
    cleanupAudio();
    setMode("idle");
  }, [cleanupAudio]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please describe the melody you want to create.',
      });
      return;
    }

    if (mode === 'playing') {
      stopPlayback();
    }

    setMode('generating');
    setGeneratedNotes([]);
    setIsInstrumentReady(false);

    try {
      const result = await generateMelody({ prompt });
      
      if (result && result.notes && result.notes.length > 0) {
        const isInstrumentValid = result.instrument && Object.keys(instrumentComponents).includes(result.instrument);
        const selectedInstrument = isInstrumentValid ? result.instrument : 'piano';
        
        setCurrentInstrument(selectedInstrument);
        setGeneratedNotes(result.notes);
        
        // Don't clean up here, getSampler handles instance management
        samplerRef.current = getSampler(selectedInstrument);
        await allSamplersLoaded(selectedInstrument);
        
        toast({
            title: "Melody Generated!",
            description: `Your new melody is ready to be played on the ${selectedInstrument}.`,
        });
        
      } else {
        toast({
            variant: "destructive",
            title: "Could not generate melody",
            description: "The AI could not create a melody from your prompt. Try being more specific.",
        });
      }
    } catch (error) {
      console.error('Melody generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An error occurred while generating the melody. Please try again.',
      });
    } finally {
      setMode('idle');
      setIsInstrumentReady(true);
    }
  };
  
  const playMelody = useCallback(() => {
    const currentSampler = samplerRef.current;
    if (!currentSampler || generatedNotes.length === 0 || !isInstrumentReady) {
        toast({ title: "Instrument not ready", description: "Please wait for the instrument to load."});
        return;
    };
    
    if (mode === 'playing') {
      stopPlayback();
      return;
    }
    
    setMode('playing');

    // Ensure any previous part is disposed of before creating a new one
    if (partRef.current) {
      partRef.current.dispose();
    }

    partRef.current = new Tone.Part((time, note) => {
        // Check sampler exists and is ready to be played
        if ('triggerAttackRelease' in currentSampler && !currentSampler.disposed) {
            currentSampler.triggerAttackRelease(note.key, note.duration, time);
        }
        
        // Schedule visual updates with Tone.Draw
        Tone.Draw.schedule(() => {
            setHighlightedKeys(current => [...current, note.key]);
        }, time);

        // Schedule key highlight removal
        const releaseTime = time + Tone.Time(note.duration).toSeconds() * 0.9;
        Tone.Draw.schedule(() => {
             setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== note.key));
        }, releaseTime);

    }, generatedNotes).start(0);

    // Make sure the last note has time to play
    const lastNote = generatedNotes[generatedNotes.length - 1];
    const totalDuration = lastNote.time + Tone.Time(lastNote.duration).toSeconds();
    partRef.current.loop = false;
    
    Tone.Transport.start();

    // Schedule the stop event on the Transport itself
    Tone.Transport.scheduleOnce(() => {
        stopPlayback();
    }, totalDuration + 0.5);

  }, [generatedNotes, stopPlayback, toast, mode, isInstrumentReady]);

  
  const isUIReady = isInstrumentReady && mode !== 'generating';
  const InstrumentComponent = instrumentComponents[currentInstrument];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" />
          Magic
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Describe the music you want to create, and let AI bring it to life.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Melody</CardTitle>
          <CardDescription>
            Ask for a song like "play the theme from Titanic" or describe a mood like "a happy, fast-paced piano tune".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., a simple and cheerful nursery rhyme..."
            className="min-h-[100px]"
            disabled={mode === 'generating'}
          />
          <Button onClick={handleGenerate} disabled={mode === 'generating' || !prompt.trim()} size="lg" className="w-full">
            {mode === 'generating' && <Loader2 className="animate-spin mr-2" />}
            {mode !== 'generating' && <Sparkles className="mr-2 h-5 w-5" />}
            Generate Melody
          </Button>
        </CardContent>
      </Card>
      
      {(generatedNotes.length > 0 || mode === 'generating') && (
        <Card>
            <CardHeader>
                <CardTitle>Your AI-Generated Melody</CardTitle>
                <CardDescription>
                  {mode === 'generating' ? 'The AI is composing your melody...' : `Press play to hear the result on the ${currentInstrument}.`}
                </CardDescription>
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
                    {!isUIReady ? <InstrumentLoader /> : (
                        <Suspense fallback={<InstrumentLoader />}>
                            {InstrumentComponent ? <InstrumentComponent highlightedKeys={highlightedKeys} disabled={true} /> : <p>Could not load instrument.</p>}
                        </Suspense>
                    )}
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
