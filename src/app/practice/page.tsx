

'use client';

import { useState, lazy, Suspense, useCallback } from 'react';
import { Loader2, Music4, History, Play } from 'lucide-react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Instrument } from '@/types';
import { getSampler } from '@/lib/samplers';

const Piano = lazy(() => import('@/components/Piano'));
const Guitar = lazy(() => import('@/components/Guitar'));
const DrumKit = lazy(() => import('@/components/DrumKit'));

type RecordedNote = {
  note: string;
  time: number;
  instrument: Instrument;
  duration: string;
};

const instruments: Instrument[] = ['piano', 'guitar', 'drums'];
const instrumentComponents: Record<Instrument, React.ElementType> = {
  piano: Piano,
  guitar: Guitar,
  drums: DrumKit,
};
const instrumentDescriptions: Record<Instrument, string> = {
  piano: 'Use your mouse or keyboard to play the classic piano.',
  guitar: 'Strum chords or pick individual notes on the acoustic guitar.',
  drums: 'Use your keyboard or mouse to play the virtual drum kit.',
};

function InstrumentLoader({ instrument }: { instrument: Instrument }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-muted rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground capitalize">Loading {instrument} Samples...</p>
    </div>
  );
}

export default function PracticePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [activeInstrument, setActiveInstrument] = useState<Instrument>('piano');

  const handleNotePlay = (note: string) => {
    if (isRecording) {
      const duration = '8n'; // Simplified duration for free play
      setRecordedNotes((prev) => [
        ...prev,
        { note, time: Date.now() - startTime, instrument: activeInstrument, duration },
      ]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      setStartTime(Date.now());
      setIsRecording(true);
    }
  };

  const playRecording = useCallback(async () => {
    if (recordedNotes.length === 0) return;
    
    await Tone.start();

    const samplers: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
    const instrumentsInRecording = new Set(recordedNotes.map((n) => n.instrument));
    
    for (const inst of instrumentsInRecording) {
      samplers[inst] = await getSampler(inst);
    }

    const now = Tone.now();
    recordedNotes.forEach((noteEvent) => {
      const sampler = samplers[noteEvent.instrument];
      if (sampler && !sampler.disposed && 'triggerAttackRelease' in sampler) {
        sampler.triggerAttackRelease(noteEvent.note, noteEvent.duration, now + noteEvent.time / 1000);
      }
    });
  }, [recordedNotes]);
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Practice Mode</h1>
        <p className="mt-2 text-lg text-muted-foreground">Select an instrument and play freely.</p>
      </div>

      <Tabs
        defaultValue="piano"
        className="w-full"
        onValueChange={(val) => setActiveInstrument(val as Instrument)}
      >
        <TabsList className="grid w-full grid-cols-3">
          {instruments.map((inst) => (
            <TabsTrigger key={inst} value={inst} className="capitalize">
              {inst}
            </TabsTrigger>
          ))}
        </TabsList>

        {instruments.map((inst) => {
          const InstrumentComponent = instrumentComponents[inst];
          return (
            <TabsContent key={inst} value={inst}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">Virtual {inst}</CardTitle>
                  <CardDescription>{instrumentDescriptions[inst]}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Suspense fallback={<InstrumentLoader instrument={inst} />}>
                      <div className="min-h-[300px] flex items-center justify-center">
                        <InstrumentComponent onNotePlay={handleNotePlay} />
                      </div>
                    </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2">
              <Music4 className="h-5 w-5 text-primary" />
              <span className="font-semibold">Recording Controls</span>
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  REC
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={toggleRecording} variant={isRecording ? 'destructive' : 'secondary'}>
                {isRecording ? 'Stop' : (
                  <div className="flex items-center">
                    <div className="h-4 w-4 mr-2 rounded-full bg-red-500" />
                    Record
                  </div>
                )}
              </Button>
              <Button onClick={playRecording} disabled={isRecording || recordedNotes.length === 0}>
                 <Play className="mr-2 h-4 w-4" />
                 Playback
              </Button>
              <Button
                onClick={() => setRecordedNotes([])}
                variant="ghost"
                size="icon"
                disabled={recordedNotes.length === 0}
              >
                <History className="h-4 w-4" />
                <span className="sr-only">Clear recording</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
