
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
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  useEffect(() => {
    const loadAudio = async () => {
      setIsInstrumentReady(false);
      await Tone.start();
      // Pre-load piano by default
      samplerRef.current = getSampler('piano');
      await allSamplersLoaded('piano');
      setIsInstrumentReady(true);
    };
    loadAudio();

    return () => {
      // Cleanup on unmount
      if (partRef.current) {
        partRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (samplerRef.current && 'releaseAll' in samplerRef.current) {
        samplerRef.current.releaseAll();
      }
    };
  }, []);

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
        setInstrument(result.instrument || 'piano');
        setGeneratedNotes(result.notes);
        
        // Load the new instrument sampler if it's different
        setIsInstrumentReady(false);
        samplerRef.current = getSampler(result.instrument);
        await allSamplersLoaded(result.instrument);
        setIsInstrumentReady(true);
        
        toast({
            title: "Melody Generated!",
            description: `Your new melody is ready to be played on the ${result.instrument}.`,
        });

      } else {
        toast({
            title: "Could not generate melody",
            description: "The AI could not create a melody from your prompt. Try being more specific.",
            variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Melody generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: 'An error occurred while generating the melody. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMode('idle');
    }
  };
  
  const stopPlayback = useCallback(() => {
    if (partRef.current) {
        partRef.current.stop(0);
        partRef.current.dispose();
        partRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (samplerRef.current && 'releaseAll' in samplerRef.current) {
        (samplerRef.current as Tone.Sampler).releaseAll();
    }
    
    setHighlightedKeys([]);
    setMode("idle");
  }, []);

  const playMelody = useCallback(async () => {
    if (!samplerRef.current || generatedNotes.length === 0 || !(samplerRef.current instanceof Tone.Sampler && samplerRef.current.loaded)) {
        toast({ title: "Instrument not ready", description: "Please wait for the instrument to load."});
        return;
    };
    
    stopPlayback();
    setMode('playing');

    const sampler = samplerRef.current;

    partRef.current = new Tone.Part((time, note) => {
        sampler.triggerAttackRelease(note.key, note.duration, time);
        
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

    // Schedule the end of playback
    Tone.Transport.scheduleOnce(() => {
        stopPlayback();
    }, totalDuration + 0.5);

  }, [generatedNotes, stopPlayback, toast]);

  
  const isUIReady = isInstrumentReady && mode !== 'generating';
  const InstrumentComponent = instrumentComponents[instrument];

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
            {mode === 'generating' && <Loader2 className="animate-spin" />}
            {mode !== 'generating' && <Sparkles className="mr-2 h-5 w-5" />}
            Generate Melody
          </Button>
        </CardContent>
      </Card>
      
      {generatedNotes.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Your AI-Generated Melody</CardTitle>
                <CardDescription>Press play to hear the result on the {instrument}.</CardDescription>
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
                            <InstrumentComponent highlightedKeys={highlightedKeys} disabled={true} />
                        </Suspense>
                    )}
                </div>
            </CardContent>
        </Card>
      )}

      {mode === 'generating' && (
        <div className="flex justify-center">
            <InstrumentLoader />
        </div>
      )}
    </div>
  );
}
