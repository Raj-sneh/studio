

'use client';

import { useState, useCallback, useRef, useEffect, useTransition } from 'react';
import * as Tone from 'tone';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Square, Wand2 } from 'lucide-react';
import type { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { composeMelodyFlow } from '@/ai/flows/compose-melody-flow';

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground">Loading Instrument...</p>
    </div>
  );
}

const Piano = dynamic(() => import('@/components/Piano'), {
    ssr: false,
    loading: () => <InstrumentLoader />
});

type Mode = 'idle' | 'playing' | 'generating';

export default function ComposePage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('idle');
  const [prompt, setPrompt] = useState('');
  const [playedNotes, setPlayedNotes] = useState<Note[]>([]);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  const [isGenerating, startGenerationTransition] = useTransition();
  
  const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  const stopPlayback = useCallback(() => {
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    partRef.current?.dispose();
    setHighlightedKeys([]);
    if(samplerRef.current && 'releaseAll' in samplerRef.current) {
        samplerRef.current.releaseAll();
    }
    if (mode === 'playing') {
      setMode("idle");
    }
  }, [mode]);

  useEffect(() => {
    let active = true;
    const loadAudio = async () => {
      setIsInstrumentReady(false);
      try {
        await Tone.start();
        const sampler = new Tone.Synth().toDestination();
        
        // Since Synth loads instantly, no need for Tone.loaded()
        if (active) {
          samplerRef.current = sampler;
          setIsInstrumentReady(true);
        }
      } catch (error) {
        console.error("Failed to load instrument:", error);
        toast({
          title: "Instrument Failed to Load",
          description: "There was an issue loading the synthesizer. Please refresh.",
          variant: "destructive"
        });
      }
    };
    
    loadAudio();

    return () => {
      active = false;
      stopPlayback();
      samplerRef.current?.dispose();
    };
  }, [toast, stopPlayback]);

  const handleNotePlay = (noteKey: string) => {
    const time = Tone.Transport.seconds.toFixed(2);
    setPlayedNotes(prev => [...prev, { key: noteKey, duration: '8n', time: `0:0:${time}` }]);
  };
  
  const playMelody = useCallback(() => {
    if (!samplerRef.current || playedNotes.length === 0 || samplerRef.current.disposed) {
      return;
    }
    stopPlayback();
    setMode('playing');
    
    const sampler = samplerRef.current;
    
    const events = playedNotes.map(note => ({
        time: note.time,
        key: note.key,
        duration: note.duration
    }));

    partRef.current = new Tone.Part((time, event) => {
      if ('triggerAttackRelease' in sampler) {
        sampler.triggerAttackRelease(event.key, event.duration, time);
      }
      
      const keysToHighlight = Array.isArray(event.key) ? event.key : [event.key];
      
      Tone.Draw.schedule(() => {
          setHighlightedKeys(current => [...current, ...keysToHighlight]);
      }, time);
      
      const releaseTime = time + Tone.Time(event.duration).toSeconds() * 0.95;
      Tone.Draw.schedule(() => {
          setHighlightedKeys(currentKeys => currentKeys.filter(k => !keysToHighlight.includes(k)));
      }, releaseTime);

    }, events).start(0);

    let maxTime = 0;
    playedNotes.forEach(note => {
        const endTime = Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds();
        if (endTime > maxTime) {
            maxTime = endTime;
        }
    });

    Tone.Transport.start();

    Tone.Transport.scheduleOnce(() => {
        setMode('idle');
        setHighlightedKeys([]);
    }, maxTime + 0.2);
    
  }, [playedNotes, stopPlayback]);

  const handleGenerateMelody = () => {
    if (!prompt) {
      toast({
        title: "Prompt is empty",
        description: "Please enter a description for the melody you want to create.",
        variant: "destructive"
      });
      return;
    }
    
    stopPlayback();
    setMode('generating');

    startGenerationTransition(async () => {
      try {
        const generatedNotes = await composeMelodyFlow(prompt);
        setPlayedNotes(generatedNotes);
        toast({
          title: "Melody Generated!",
          description: "Your new melody is ready. Press play to hear it."
        });
      } catch (error) {
        console.error("Melody generation failed:", error);
        toast({
          title: "Generation Failed",
          description: "Could not generate melody from the prompt. Please try again.",
          variant: "destructive"
        });
      } finally {
        setMode('idle');
      }
    });
  };
  
  const isUIReady = isInstrumentReady;
  const isBusy = mode === 'playing' || mode === 'generating' || isGenerating;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" />
          AI Composer
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Describe a melody or play on the piano to compose.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>AI Melody Generation</CardTitle>
            <CardDescription>Describe the melody you want to create, e.g., "a happy, upbeat tune in C major".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
              placeholder="A slow, melancholic melody in A minor..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isBusy}
          />
          <Button onClick={handleGenerateMelody} disabled={!isUIReady || isBusy} size="lg" className="w-full">
            {isBusy && mode === 'generating' ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin"/>
            ) : (
              <Wand2 className="mr-2 h-5 w-5"/>
            )}
            Generate Melody
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Your Composition</CardTitle>
            <CardDescription>The generated or played melody will appear here. Press play to listen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             {mode !== 'playing' ? (
                 <Button onClick={playMelody} disabled={!isUIReady || playedNotes.length === 0 || isBusy} size="lg" className="w-full">
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
                <Piano 
                  highlightedKeys={highlightedKeys} 
                  onNotePlay={handleNotePlay}
                  disabled={isBusy}
                />
            </div>
        </CardContent>
      </Card>

      {(!isInstrumentReady || (isBusy && mode === 'generating')) && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 flex-col">
            {isBusy && mode === 'generating' ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-lg">Generating melody...</p>
              </>
            ) : (
              <InstrumentLoader />
            )}
        </div>
      )}
    </div>
  );
}
