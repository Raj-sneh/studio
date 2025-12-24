
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
      <p className="mt-4 text-muted-foreground">Warming up the instruments...</p>
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
  const partRef = useRef<Tone.Part | null>(null);

  useEffect(() => {
    const loadAudio = async () => {
      setIsInstrumentReady(false);
      await Tone.start();
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
  
  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }
    
    if (samplerRef.current && 'releaseAll' in samplerRef.current) {
        (samplerRef.current as Tone.Sampler).releaseAll();
    }
    
    setHighlightedKeys([]);
    setMode("idle");
  }, []);

  const playMelody = useCallback(async () => {
    if (!samplerRef.current || generatedNotes.length === 0 || !(samplerRef.current instanceof Tone.Sampler && samplerRef.current.loaded)) return;
    
    stopPlayback();
    
    setMode('playing');

    const sampler = samplerRef.current;

    partRef.current = new Tone.Part((time, note) => {
        sampler.triggerAttackRelease(note.key, note.duration, time);
        
        Tone.Draw.schedule(() => {
            setHighlightedKeys(current => [...current, note.key]);
        }, time);

        Tone.Draw.schedule(() => {
             setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== note.key));
        }, time + Tone.Time(note.duration).toSeconds());

    }, generatedNotes).start(0);

    const lastNote = generatedNotes[generatedNotes.length - 1];
    const totalDuration = lastNote.time + Tone.Time(lastNote.duration).toSeconds();
    partRef.current.loop = false;
    
    Tone.Transport.start();

    // Schedule the end of playback
    Tone.Transport.scheduleOnce(() => {
        setMode("idle");
    }, totalDuration + 0.5);

  }, [generatedNotes, stopPlayback]);

  
  const isUIReady = isInstrumentReady && mode !== 'generating';

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
            disabled={!isUIReady}
          />
          <Button onClick={handleGenerate} disabled={!isUIReady || !prompt.trim()} size="lg" className="w-full">
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
        <div className="flex justify-center">
            <InstrumentLoader />
        </div>
      )}
    </div>
  );
}
