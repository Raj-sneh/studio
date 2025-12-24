
'use client';

import { useState, useCallback, useRef, Suspense, lazy, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, Sparkles, Square, Wand2 } from 'lucide-react';
import { generateMelody } from '@/ai/flows/generate-melody-flow';
import type { Note, Instrument } from '@/types';
import { getSampler } from '@/lib/samplers';
import { useToast } from '@/hooks/use-toast';

const Piano = lazy(() => import('@/components/Piano'));
const Guitar = lazy(() => import('@/components/Guitar'));
const Flute = lazy(() => import('@/components/Flute'));
const Saxophone = lazy(() => import('@/components/Saxophone'));
const Violin = lazy(() => import('@/components/Violin'));
const Xylophone = lazy(() => import('@/components/Xylophone'));
const DrumPad = lazy(() => import('@/components/DrumPad'));

function InstrumentLoader({ instrument }: { instrument?: Instrument }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground capitalize">
        {instrument ? `Loading ${instrument} Samples...` : 'Warming up the instruments...'}
      </p>
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

type Mode = 'idle' | 'generating' | 'playing' | 'loadingInstrument';

export default function ComposePage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<Mode>('idle');
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([]);
  const [currentInstrument, setCurrentInstrument] = useState<Instrument>('piano');
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  const stopPlayback = () => {
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
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim() || mode === 'generating') {
      toast({
        variant: 'destructive',
        title: 'Prompt is empty or generation is in progress',
        description: 'Please describe the melody you want to create.',
      });
      return;
    }
    
    stopPlayback();
    setMode('generating');
    setGeneratedNotes([]);

    try {
      const result = await generateMelody({ prompt });
      
      if (!result?.notes || result.notes.length === 0) {
        toast({
            variant: "destructive",
            title: "Could not generate melody",
            description: "The AI could not create a melody from your prompt. Try being more specific.",
        });
        setMode('idle');
        return;
      }
      
      const newInstrument = result?.instrument && instrumentComponents[result.instrument] ? result.instrument : 'piano';
      
      setMode('loadingInstrument');
      setCurrentInstrument(newInstrument);
      setGeneratedNotes(result.notes);
      
      getSampler(newInstrument).then(newSampler => {
        setSampler(newSampler);
        setMode('idle');
        toast({
            title: "Melody Generated!",
            description: `Your new melody is ready to be played on the ${newInstrument}.`,
        });
      });
      
    } catch (error) {
      console.error('Melody generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'An unexpected error occurred while generating the melody. Please try again.',
      });
      setMode('idle');
    }
  };
  
  const playMelody = async () => {
    if (!sampler || sampler.disposed || generatedNotes.length === 0 || mode !== 'idle') {
      toast({
        title: "Cannot play melody",
        description: "The instrument is not ready or a melody hasn't been generated.",
        variant: "destructive"
      });
      return;
    }
    
    stopPlayback();
    setMode('playing');

    try {
        partRef.current = new Tone.Part((time, note) => {
            if (sampler && 'triggerAttackRelease' in sampler && !sampler.disposed) {
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
        
        await Tone.start();
        Tone.Transport.start();

        Tone.Transport.scheduleOnce(() => {
            stopPlayback();
        }, totalDuration + 0.5);

    } catch (error) {
        console.error("Playback failed:", error);
        toast({
            title: "Playback Failed",
            description: "Could not play the melody. Please try generating it again.",
            variant: "destructive"
        });
        setMode("idle");
    }
  };
  
  const isBusy = mode === 'generating' || mode === 'loadingInstrument';
  const InstrumentComponent = instrumentComponents[currentInstrument];

  const getCardDescription = () => {
    if (mode === 'generating') return 'The AI is composing your melody...';
    if (mode === 'loadingInstrument') return `Loading ${currentInstrument} samples...`;
    return `Press play to hear the result on the ${currentInstrument}.`;
  };

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
            disabled={isBusy}
          />
          <Button onClick={handleGenerate} disabled={isBusy || !prompt.trim()} size="lg" className="w-full">
            {isBusy ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
            {mode === 'generating' ? 'Generating...' : (mode === 'loadingInstrument' ? 'Loading...' : 'Generate Melody')}
          </Button>
        </CardContent>
      </Card>
      
      {(generatedNotes.length > 0 || isBusy) && (
        <Card>
            <CardHeader>
                <CardTitle>Your AI-Generated Melody</CardTitle>
                <CardDescription>
                  {getCardDescription()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {mode !== 'playing' ? (
                     <Button onClick={playMelody} disabled={isBusy || generatedNotes.length === 0} size="lg" className="w-full">
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
                    {isBusy ? <InstrumentLoader instrument={currentInstrument} /> : (
                        <Suspense fallback={<InstrumentLoader instrument={currentInstrument} />}>
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
