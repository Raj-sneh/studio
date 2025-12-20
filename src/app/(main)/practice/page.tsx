
"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Play, Pause, Square, History, Music4, Loader2 } from "lucide-react";
import * as Tone from "tone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Instrument } from "@/types";
import { getSampler, allSamplersLoaded } from "@/lib/samplers";

const Piano = lazy(() => import("@/components/Piano"));

type RecordedNote = {
    note: string;
    time: number;
    instrument: Instrument;
};

const instruments: Instrument[] = ['piano'];

function InstrumentLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading Instrument...</p>
        </div>
    )
}

export default function PracticePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [activeInstrument, setActiveInstrument] = useState<Instrument>('piano');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const startAudio = async () => {
            await Tone.start();
            console.log("Audio context started for practice mode");
        };

        const eventTypes: ('click' | 'keydown')[] = ['click', 'keydown'];
        const options = { once: true };
        
        eventTypes.forEach(type => {
            window.addEventListener(type, startAudio, options);
        });

        const loadInstrument = async () => {
            setIsLoading(true);
            try {
                // Now we only get the sampler for the active instrument
                getSampler(activeInstrument);
                await allSamplersLoaded();
            } catch (error) {
                console.error("Failed to load sampler:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInstrument();

        return () => {
            eventTypes.forEach(type => {
                window.removeEventListener(type, startAudio, options);
            });
        };
    }, [activeInstrument]);

    const handleNotePlay = (note: string) => {
        if (isRecording) {
            setRecordedNotes(prev => [...prev, { note, time: Date.now() - startTime, instrument: activeInstrument }]);
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

    const playRecording = () => {
        if (recordedNotes.length === 0 || isPlaying) return;
        setIsPlaying(true);

        const instrumentsInRecording = new Set(recordedNotes.map(n => n.instrument));
        const samplers: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
        instrumentsInRecording.forEach(inst => {
            samplers[inst] = getSampler(inst);
        });

        // Play notes
        const now = Tone.now();
        recordedNotes.forEach(noteEvent => {
            const sampler = samplers[noteEvent.instrument];
            if (sampler) {
                const duration = Array.isArray(noteEvent.note) ? "1n" : "8n";
                sampler.triggerAttackRelease(noteEvent.note, duration, now + noteEvent.time / 1000);
            }
        });

        const totalTime = recordedNotes.length > 0 ? recordedNotes[recordedNotes.length - 1].time : 0;
        setTimeout(() => {
            setIsPlaying(false);
        }, totalTime + 1000);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Getting things ready...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold tracking-tight">Practice Mode</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select an instrument and play freely.</p>
            </div>

            <Tabs defaultValue="piano" className="w-full" onValueChange={(value) => setActiveInstrument(value as Instrument)}>
                <TabsList className="grid w-full grid-cols-1">
                    {instruments.map(inst => (
                        <TabsTrigger key={inst} value={inst} className="capitalize">{inst}</TabsTrigger>
                    ))}
                </TabsList>
                <TabsContent value="piano">
                    <Card>
                        <CardHeader>
                            <CardTitle>Virtual Piano</CardTitle>
                            <CardDescription>Use your mouse or keyboard to play notes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Suspense fallback={<InstrumentLoader />}>
                                <Piano onNotePlay={handleNotePlay} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Card>
                <CardContent className="p-4">
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-card">
                        <div className="flex items-center gap-2">
                             <Music4 className="h-5 w-5 text-primary" />
                            <span className="font-semibold">Recording Controls</span>
                            {isRecording && <Badge variant="destructive" className="animate-pulse">REC</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "secondary"}>
                                {isRecording ? <Square className="mr-2 h-4 w-4" /> : <div className="h-4 w-4 mr-2 rounded-full bg-red-500" />}
                                {isRecording ? "Stop" : "Record"}
                            </Button>
                            <Button onClick={playRecording} disabled={isRecording || isPlaying || recordedNotes.length === 0}>
                                {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                                {isPlaying ? "Playing..." : "Playback"}
                            </Button>
                             <Button onClick={() => setRecordedNotes([])} variant="ghost" size="icon" disabled={recordedNotes.length === 0}>
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
