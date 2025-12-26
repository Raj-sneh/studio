
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const isMountedRef = useRef(true);

  const stopPlayback = useCallback(() => {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      Tone.Transport.cancel(0);
    }
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }
    setHighlightedKeys([]);
    if (mode === 'playing') {
      setMode("idle");
    }
  }, [mode]);

  useEffect(() => {
    isMountedRef.current = true;
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stopPlayback();
      if (samplerRef.current && 'dispose' in samplerRef.current && !samplerRef.current.disposed) {
        samplerRef.current.dispose();
      }
    };
  }, [stopPlayback]);
  
  useEffect(() => {
    let active = true;
    async function loadInstrument() {
      if (!isMountedRef.current) return;
      
      setMode('loadingInstrument');
      stopPlayback();

      try {
          const sampler = await getSampler(currentInstrument);
          if (active && isMountedRef.current) {
              if (samplerRef.current && 'dispose' in samplerRef.current && !samplerRef.current.disposed) {
                  samplerRef.current.dispose();
              }
              samplerRef.current = sampler;
              setMode('idle');
          } else if (sampler && 'dispose' in sampler && !sampler.disposed) {
              sampler.dispose();
          }
      } catch (error) {
          if (active && isMountedRef.current) {
              console.error(`Failed to load ${currentInstrument}`, error);
              toast({
                  title: "Instrument Error",
                  description: `Could not load the ${currentInstrument}. Please try another instrument or refresh.`,
                  variant: 'destructive',
              });
              setMode('idle');
          }
      }
    }

    loadInstrument();

    return () => {
        active = false;
    }
  }, [currentInstrument, toast]);


  const handleGenerate = async () => {
    if (!prompt.trim() || mode === 'generating' || mode === 'loadingInstrument') {
      return;
    }

    stopPlayback();
    setMode('generating');
    setGeneratedNotes([]);

    try {
      const result = await generateMelody({ prompt });
      
      if (!isMountedRef.current) return;

      if (!result || !result.notes || result.notes.length === 0) {
          toast({
              variant: "destructive",
              title: "Could not generate melody",
              description: "The AI could not create a melody from your prompt. Try being more specific or ask for a different song.",
          });
          setMode('idle');
          return;
      }
      setGeneratedNotes(result.notes);
      toast({
        title: "Melody Generated!",
        description: `Your new melody is ready to be played.`,
      });
    } catch (error) {
      console.error('Melody generation failed:', error);
      if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'An unexpected error occurred while generating the melody. Please try again.',
        });
      }
    } finally {
        if (isMountedRef.current) {
            setMode('idle');
        }
    }
  };
  
  const playMelody = useCallback(async () => {
    if (!samplerRef.current || samplerRef.current.disposed || generatedNotes.length === 0 || mode !== 'idle') {
      return;
    }
    
    setMode('playing');

    try {
        await Tone.start();
        const sampler = samplerRef.current;
        
        if (partRef.current) {
            partRef.current.dispose();
        }

        const noteEvents = generatedNotes.map(note => ({
            time: note.time,
            note: note.key,
            duration: note.duration
        }));

        partRef.current = new Tone.Part((time, event) => {
            if (sampler && 'triggerAttackRelease' in sampler && !sampler.disposed) {
                sampler.triggerAttackRelease(event.note, event.duration, time);
            }
            
            Tone.Draw.schedule(() => {
                if (isMountedRef.current) setHighlightedKeys(current => [...current, event.note]);
            }, time);
            
            const releaseTime = time + Tone.Time(event.duration).toSeconds() * 0.9;
            Tone.Draw.schedule(() => {
                 if (isMountedRef.current) setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== event.note));
            }, releaseTime);

        }, noteEvents).start(0);
        
        const lastNote = noteEvents[noteEvents.length - 1];
        if (lastNote) {
            const totalDuration = Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds();
            
            partRef.current.loop = false;
            Tone.Transport.start();

            Tone.Transport.scheduleOnce(() => {
                if (isMountedRef.current) {
                  setMode('idle');
                  setHighlightedKeys([]);
                }
            }, `+${totalDuration + 0.5}`);
        } else {
             if (isMountedRef.current) {
              setMode('idle');
            }
        }

    } catch (error) {
        console.error("Playback failed:", error);
        if (isMountedRef.current) {
          toast({
              title: "Playback Failed",
              description: "Could not play the melody. Please try generating it again.",
              variant: "destructive"
          });
          setMode("idle");
        }
    }
  }, [generatedNotes, mode, toast, stopPlayback]);
  
  const isBusy = mode === 'generating' || mode === 'loadingInstrument';
  const InstrumentComponent = instrumentComponents[currentInstrument];

  const getCardDescription = () => {
    if (mode === 'generating') return 'The AI is composing your melody...';
    if (generatedNotes.length > 0) return `Press play to hear the result.`;
    return 'Your generated melody will appear here.';
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
            Ask for a song like "play Sa Re Ga Ma Pa" or describe a mood like "a happy, fast-paced piano tune".
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
            {mode === 'generating' ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
            {mode === 'generating' ? 'Generating...' : 'Generate Melody'}
          </Button>
        </CardContent>
      </Card>
      
      {generatedNotes.length > 0 && mode !== 'generating' && (
        <Card>
            <CardHeader>
                <CardTitle>Your AI-Generated Melody</CardTitle>
                <CardDescription>
                  {getCardDescription()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {mode !== 'playing' ? (
                         <Button onClick={playMelody} disabled={isBusy || mode === 'playing' || generatedNotes.length === 0} size="lg" className="w-full">
                            <Play className="mr-2 h-5 w-5"/>
                            Play Melody
                        </Button>
                     ) : (
                        <Button onClick={stopPlayback} size="lg" className="w-full" variant="destructive">
                            <Square className="mr-2 h-5 w-5"/>
                            Stop
                        </Button>
                     )}
                     <Select value={currentInstrument} onValueChange={(val) => setCurrentInstrument(val as Instrument)} disabled={isBusy || mode === 'playing'}>
                        <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select Instrument" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(instrumentComponents).map(inst => (
                                <SelectItem key={inst} value={inst} className="capitalize">{inst}</SelectItem>
                            ))}
                        </SelectContent>
                     </Select>
                 </div>
                 <div className="min-h-[200px] flex items-center justify-center">
                    {mode === 'loadingInstrument' ? <InstrumentLoader instrument={currentInstrument} /> : (
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
