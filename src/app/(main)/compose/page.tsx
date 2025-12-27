'use client';

import { useState, useCallback, useRef, Suspense, lazy, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Play, Sparkles, Square, Wand2 } from 'lucide-react';
import { generateMelody } from '@/ai/flows/generate-melody-flow';
import type { Note } from '@/types';
import { getSampler, allSamplersLoaded } from '@/lib/samplers';
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

export default function ComposePage() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<Mode>('idle');
  const [generatedNotes, setGeneratedNotes] = useState<Note[]>([]);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const noteTimeoutIds = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const loadAudio = async () => {
      if (isInstrumentReady) return;
      setIsInstrumentReady(false);
      await Tone.start();
      samplerRef.current = await getSampler('piano');
      await allSamplersLoaded();
      setIsInstrumentReady(true);
    };
    loadAudio();

    return () => {
      noteTimeoutIds.current.forEach(clearTimeout);
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
      }
      Tone.Transport.cancel();
    };
  }, []); // Empty dependency array ensures this runs only once

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
  
  const playMelody = useCallback(async () => {
    if (!samplerRef.current || generatedNotes.length === 0 || samplerRef.current.disposed) return;
    setMode('playing');

    noteTimeoutIds.current.forEach(clearTimeout);
    noteTimeoutIds.current = [];
    setHighlightedKeys([]);
    
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    
    const sampler = samplerRef.current;
    
    const noteEvents = generatedNotes.map(note => ({
        time: note.time,
        note: note.key,
        duration: note.duration,
    }));
    
    const part = new Tone.Part((time, event) => {
        sampler.triggerAttackRelease(event.note, event.duration, time);
        Tone.Draw.schedule(() => {
            setHighlightedKeys(current => [...current, event.note]);
        }, time);
        const releaseTime = time + Tone.Time(event.duration).toSeconds() * 0.9;
        Tone.Draw.schedule(() => {
            setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== event.note));
        }, releaseTime);
    }, noteEvents).start(0);

    const totalDuration = generatedNotes.reduce((max, note) => {
        const endTime = Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds();
        return Math.max(max, endTime);
    }, 0);
    
    Tone.Transport.start();

    const timeoutId = setTimeout(() => {
        setMode('idle');
        part.dispose();
    }, totalDuration * 1000 + 500);

    noteTimeoutIds.current.push(timeoutId);
    
  }, [generatedNotes]);

  const stopPlayback = () => {
    noteTimeoutIds.current.forEach(clearTimeout);
    noteTimeoutIds.current = [];
    setHighlightedKeys([]);
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    if(samplerRef.current && 'releaseAll' in samplerRef.current) {
        samplerRef.current.releaseAll();
    }
    setMode("idle");
  };
  
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
            {mode === 'generating' ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
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
                 <div className="min-h-[200px]">
                    <Suspense fallback={<InstrumentLoader />}>
                        <Piano highlightedKeys={highlightedKeys} disabled={true} />
                    </Suspense>
                </div>
            </CardContent>
        </Card>
      )}

      {!isInstrumentReady && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <InstrumentLoader />
        </div>
      )}
    </div>
  );
}
