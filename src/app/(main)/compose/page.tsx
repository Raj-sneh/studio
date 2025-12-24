
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
  
  const partRef = useRef<Tone.Part | null>(null);

  // This is the single source of truth for stopping audio and cleaning up.
  const stopPlayback = useCallback(() => {
    if (partRef.current) {
      partRef.current.stop(0);
      partRef.current.dispose(); // Fully remove the part
      partRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setHighlightedKeys([]);

    // Get the current sampler and release its notes. We don't dispose the sampler itself
    // as it's managed by the `getSampler` utility now.
    const sampler = getSampler(currentInstrument);
    if (sampler && 'releaseAll' in sampler && typeof sampler.releaseAll === 'function' && !sampler.disposed) {
      sampler.releaseAll();
    }
    setMode("idle");
  }, [currentInstrument]);
  
  // Effect for initial loading of the default instrument (piano).
  useEffect(() => {
    const loadInitialInstrument = async () => {
      setIsInstrumentReady(false);
      await Tone.start();
      getSampler('piano'); // This ensures the sampler is created
      await allSamplersLoaded('piano');
      setIsInstrumentReady(true);
    };
    loadInitialInstrument();
    
    return () => {
      // When the component unmounts for good, stop any lingering sound.
      stopPlayback();
    };
  }, [stopPlayback]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty',
        description: 'Please describe the melody you want to create.',
      });
      return;
    }
    
    // Always stop any ongoing playback before generating a new melody.
    if (mode === 'playing') {
      stopPlayback();
    }

    setMode('generating');
    setGeneratedNotes([]);
    setIsInstrumentReady(false);

    try {
      const result = await generateMelody({ prompt });
      
      if (!result || !result.notes || result.notes.length === 0) {
        toast({
            variant: "destructive",
            title: "Could not generate melody",
            description: "The AI could not create a melody from your prompt. Try being more specific.",
        });
        setMode('idle');
        setIsInstrumentReady(true); // Re-enable UI for another try with the current instrument
        return;
      }
      
      // Defensively check for a valid instrument, defaulting to piano.
      const isInstrumentValid = result.instrument && Object.keys(instrumentComponents).includes(result.instrument);
      const newInstrument = isInstrumentValid ? result.instrument : 'piano';
      
      setCurrentInstrument(newInstrument);
      setGeneratedNotes(result.notes);
      
      // Load the new instrument's samples. This will create if it doesn't exist or is disposed.
      getSampler(newInstrument);
      await allSamplersLoaded(newInstrument);
      
      toast({
          title: "Melody Generated!",
          description: `Your new melody is ready to be played on the ${newInstrument}.`,
      });
      
    } catch (error) {
      console.error('Melody generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An unexpected error occurred while generating the melody. Please try again.',
      });
    } finally {
      // Transition to idle and mark instrument as ready for playback.
      setMode('idle');
      setIsInstrumentReady(true);
    }
  };
  
  const playMelody = useCallback(() => {
    if (!isInstrumentReady || generatedNotes.length === 0 || mode === 'playing') return;
    
    const sampler = getSampler(currentInstrument);
    if (!sampler || ('loaded' in sampler && !sampler.loaded)) {
      toast({ title: "Cannot Play", description: "The instrument is still loading."});
      return;
    }

    // Ensure any previous part is fully cleaned up before creating a new one.
    if (partRef.current) {
        partRef.current.dispose();
    }
    setMode('playing');
    
    partRef.current = new Tone.Part((time, note) => {
        if ('triggerAttackRelease' in sampler && !sampler.disposed) {
            sampler.triggerAttackRelease(note.key, note.duration, time);
        }
        
        Tone.Draw.schedule(() => {
            setHighlightedKeys(current => [...current, note.key]);
        }, time);
        
        const releaseTime = time + Tone.Time(note.duration).toSeconds() * 0.9;
        Tone.Draw.schedule(() => {
             setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== note.key));
        }, releaseTime);

    }, generatedNotes).start(0);

    const lastNote = generatedNotes[generatedNotes.length - 1];
    const totalDuration = lastNote.time + Tone.Time(lastNote.duration).toSeconds();
    partRef.current.loop = false;
    
    Tone.Transport.start();

    Tone.Transport.scheduleOnce(() => {
        stopPlayback();
    }, totalDuration + 0.5);

  }, [generatedNotes, isInstrumentReady, mode, stopPlayback, toast, currentInstrument]);

  
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
