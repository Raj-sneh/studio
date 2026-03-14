'use client';

import { useState, lazy, Suspense, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Music4, History, Play, StopCircle } from 'lucide-react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Instrument } from '@/types';
import { getSampler, type CachedSampler } from '@/lib/samplers';

const Piano = lazy(() => import('@/components/Piano'));

type RecordedNote = {
  note: string;
  time: number;
  instrument: Instrument;
  duration: string;
};

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-muted rounded-lg w-full">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground">Getting the piano ready...</p>
    </div>
  );
}

function PracticeModeContent() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const startTimeRef = useRef(0);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  
  const handleNotePlay = (note: string) => {
    setHighlightedKeys([note]);
    setTimeout(() => setHighlightedKeys([]), 200);

    if (isRecording) {
      setRecordedNotes((prev) => [
        ...prev,
        { note, time: Date.now() - startTimeRef.current, instrument: 'piano', duration: '8n' },
      ]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      startTimeRef.current = Date.now();
      setIsRecording(true);
    }
  };

  const stopAllSounds = async () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    try {
        const sampler = await getSampler('piano');
        if (sampler instanceof Tone.Sampler || sampler instanceof Tone.PolySynth) {
            sampler.releaseAll();
        }
    } catch (e) {}
    
    setHighlightedKeys([]);
    setIsRecording(false);
  };

  const playRecording = useCallback(async () => {
    if (recordedNotes.length === 0) return;
    
    await Tone.start();
    const sampler = await getSampler('piano');

    const now = Tone.now();
    recordedNotes.forEach((noteEvent) => {
      if (!sampler || sampler.disposed) return;
      if (sampler instanceof Tone.Sampler || sampler instanceof Tone.PolySynth) {
        sampler.triggerAttackRelease(noteEvent.note, noteEvent.duration, now + noteEvent.time / 1000);
      }
    });
  }, [recordedNotes]);
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Practice Room</h1>
        <p className="mt-2 text-lg text-muted-foreground">Play the Grand Piano freely.</p>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle>Virtual Grand Piano</CardTitle>
          <CardDescription>Play the Salamander Grand Piano samples.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Suspense fallback={<InstrumentLoader />}>
              <div className="min-h-[300px] flex items-center justify-center p-2 bg-muted/20 rounded-xl border shadow-inner">
                <Piano onNotePlay={handleNotePlay} highlightedKeys={highlightedKeys} />
              </div>
            </Suspense>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-primary/5">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Music4 className="h-5 w-5 text-primary" />
                    Record & Listen
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={toggleRecording} variant={isRecording ? 'destructive' : 'default'} className="flex-1">
                        {isRecording ? (
                            <><StopCircle className="mr-2 h-4 w-4 animate-pulse" /> Stop</>
                        ) : (
                            <><div className="h-3 w-3 mr-2 rounded-full bg-red-500" /> Record</>
                        )}
                    </Button>
                    <Button onClick={playRecording} disabled={isRecording || recordedNotes.length === 0} variant="secondary" className="flex-1">
                        <Play className="mr-2 h-4 w-4" /> Playback
                    </Button>
                    <Button
                        onClick={() => setRecordedNotes([])}
                        variant="outline"
                        size="icon"
                        disabled={recordedNotes.length === 0}
                        title="Clear recording"
                    >
                        <History className="h-4 w-4" />
                    </Button>
                </div>
                {isRecording && (
                    <p className="text-[10px] text-destructive font-bold uppercase tracking-widest mt-2 animate-pulse text-center">Recording now...</p>
                )}
            </CardContent>
        </Card>

        <Card className="bg-muted/10 border-dashed border-2">
            <CardHeader>
                <CardTitle className="text-lg">Panic Button</CardTitle>
                <CardDescription>Click this if any sound won't stop playing.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={stopAllSounds} variant="destructive" className="w-full">
                    <StopCircle className="mr-2 h-4 w-4" /> Stop All Sounds
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PracticeLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function PracticePage() {
  return (
      <Suspense fallback={<PracticeLoader />}>
          <PracticeModeContent />
      </Suspense>
  );
}
