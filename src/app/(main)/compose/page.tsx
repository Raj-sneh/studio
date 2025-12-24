
'use client';

import { useState, useCallback, useRef, Suspense, lazy, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, Sparkles, Square, Wand2 } from 'lucide-react';
import { generateMelody } from '@/ai/flows/generate-melody-flow';
import type { Note, Instrument } from '@/types';
import { createSampler } from '@/lib/samplers';
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
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
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
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  // Stop playback and clean up Tone.js resources
  const stopPlayback = useCallback(() => {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }
    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }
    setHighlightedKeys([]);
    if (mode === 'playing') {
      setMode("idle");
    }
  }, [mode]);

  // General cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (samplerRef.current) {
        samplerRef.current.dispose();
      }
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
    
    stopPlayback();
    setMode('generating');
    setGeneratedNotes([]);

    try {
      const result = await generateMelody({ prompt });
      
      const newInstrument = result?.instrument && instrumentComponents[result.instrument] ? result.instrument : 'piano';
      
      if (!result?.notes || result.notes.length === 0) {
        toast({
            variant: "destructive",
            title: "Could not generate melody",
            description: "The AI could not create a melody from your prompt. Try being more specific.",
        });
        setCurrentInstrument('piano'); // Reset to default
        setMode('idle');
        return;
      }
      
      // Dispose old sampler if it exists and the instrument is changing
      if (samplerRef.current && newInstrument !== currentInstrument) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }

      setCurrentInstrument(newInstrument);
      setGeneratedNotes(result.notes);
      
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
      setCurrentInstrument('piano'); // Reset to a known good state
    } finally {
      setMode('idle');
    }
  };
  
  const playMelody = useCallback(async () => {
    if (generatedNotes.length === 0 || mode === 'playing') return;
    
    stopPlayback();
    setMode('playing');

    try {
        // Load the sampler if it doesn't exist or has been disposed
        if (!samplerRef.current || samplerRef.current.disposed) {
             samplerRef.current = await createSampler(currentInstrument);
        }
        
        const sampler = samplerRef.current;

        partRef.current = new Tone.Part((time, note) => {
            if ('triggerAttackRelease' in sampler && !sampler.disposed) {
                sampler.triggerAttackRelease(note.key, note.duration, time);
            }
            
            // Schedule UI updates with Tone.Draw
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
        
        await Tone.start();
        Tone.Transport.start();

        // Schedule the stop action
        Tone.Transport.scheduleOnce(() => {
            stopPlayback();
        }, totalDuration + 0.5);

    } catch (error) {
        console.error("Playback failed:", error);
        toast({
            title: "Playback Failed",
            description: "Could not play the melody. The instrument might be loading.",
            variant: "destructive"
        });
        setMode("idle");
    }
  }, [generatedNotes, currentInstrument, mode, stopPlayback, toast]);
  
  const isGenerating = mode === 'generating';
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
            disabled={isGenerating}
          />
          <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} size="lg" className="w-full">
            {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Generate Melody
          </Button>
        </CardContent>
      </Card>
      
      {(generatedNotes.length > 0 || isGenerating) && (
        <Card>
            <CardHeader>
                <CardTitle>Your AI-Generated Melody</CardTitle>
                <CardDescription>
                  {isGenerating ? 'The AI is composing your melody...' : `Press play to hear the result on the ${currentInstrument}.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {mode !== 'playing' ? (
                     <Button onClick={playMelody} disabled={isGenerating || generatedNotes.length === 0} size="lg" className="w-full">
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
                    {isGenerating ? <InstrumentLoader /> : (
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
