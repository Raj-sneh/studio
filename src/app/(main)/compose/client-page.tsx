
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, Square, Wand2 } from 'lucide-react';
import type { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';

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

type Mode = 'idle' | 'playing';

export default function ComposePage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('idle');
  const [playedNotes, setPlayedNotes] = useState<Note[]>([]);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  
  const samplerRef = useRef<Tone.Sampler | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const transportTimeRef = useRef(0);

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
    setMode("idle");
  }, []);

  useEffect(() => {
    let active = true;
    const loadAudio = async () => {
      setIsInstrumentReady(false);
      try {
        await Tone.start();
        const sampler = new Tone.Sampler({
            urls: {
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
        }).toDestination();
        
        await Tone.loaded();
        if (active) {
          samplerRef.current = sampler;
          setIsInstrumentReady(true);
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
      sampler.triggerAttackRelease(event.key, event.duration, time);
      
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
  
  const isUIReady = isInstrumentReady;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8 text-primary" />
          Piano Composer
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Play on the piano to compose your own melody.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Your Composition</CardTitle>
            <CardDescription>Press play to hear what you've played on the piano below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             {mode !== 'playing' ? (
                 <Button onClick={playMelody} disabled={!isUIReady || playedNotes.length === 0} size="lg" className="w-full">
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
                  disabled={mode === 'playing'}
                />
            </div>
        </CardContent>
      </Card>

      {!isInstrumentReady && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <InstrumentLoader />
        </div>
      )}
    </div>
  );
}
