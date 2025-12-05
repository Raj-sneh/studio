
"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, History, Music4 } from "lucide-react";
import * as Tone from "tone";
import Piano from "@/components/Piano";
import Guitar from "@/components/Guitar";
import DrumPad from "@/components/DrumPad";
import Violin from "@/components/Violin";
import Xylophone from "@/components/Xylophone";
import Flute from "@/components/Flute";
import Saxophone from "@/components/Saxophone";
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

type RecordedNote = {
    note: string;
    time: number;
    instrument: Instrument;
};

const instruments: Instrument[] = ['piano', 'guitar', 'drums', 'violin', 'xylophone', 'flute', 'saxophone'];

const getSamplerForInstrument = (instrument: Instrument): Tone.Sampler => {
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2F";
    const apiKey = "alt=media"; // Firebase Storage requires this for direct downloads

    let urls: { [note: string]: string } = {};
    switch (instrument) {
        case 'piano':
            urls = {
                'A0': `A0.mp3`, 'C1': `C1.mp3`, 'D#1': `Ds1.mp3`, 'F#1': `Fs1.mp3`, 'A1': `A1.mp3`,
                'C2': `C2.mp3`, 'D#2': `Ds2.mp3`, 'F#2': `Fs2.mp3`, 'A2': `A2.mp3`, 'C3': `C3.mp3`,
                'D#3': `Ds3.mp3`, 'F#3': `Fs3.mp3`, 'A3': `A3.mp3`, 'C4': `C4.mp3`, 'D#4': `Ds4.mp3`,
                'F#4': `Fs4.mp3`, 'A4': `A4.mp3`, 'C5': `C5.mp3`, 'D#5': `Ds5.mp3`, 'F#5': `Fs5.mp3`,
                'A5': `A5.mp3`, 'C6': `C6.mp3`, 'D#6': `Ds6.mp3`, 'F#6': `Fs6.mp3`, 'A6': `A6.mp3`,
                'C7': `C7.mp3`, 'D#7': `Ds7.mp3`, 'F#7': `Fs7.mp3`, 'A7': `A7.mp3`, 'C8': `C8.mp3`
            };
            return new Tone.Sampler({ urls, baseUrl: `${baseUrl}${instrument}%2F?${apiKey}` }).toDestination();
        case 'guitar':
             urls = {
                'E2': 'E2.mp3', 'A2': 'A2.mp3', 'D3': 'D3.mp3', 'G3': 'G3.mp3', 'B3': 'B3.mp3', 'E4': 'E4.mp3'
            };
            return new Tone.Sampler({ urls, baseUrl: `${baseUrl}${instrument}-acoustic%2F?${apiKey}` }).toDestination();
        case 'drums':
            // Drums use specific files per sound, not notes
            return new Tone.Sampler({
                urls: {
                    'C4': 'kick.mp3',
                    'D4': 'snare.mp3',
                    'E4': 'hihat.mp3',
                },
                baseUrl: `${baseUrl}drums%2F?${apiKey}`
            }).toDestination();
        case 'violin':
            urls = { 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'E4': 'E4.mp3', 'G4': 'G4.mp3' };
            return new Tone.Sampler({ urls, baseUrl: `${baseUrl}violin%2F?${apiKey}` }).toDestination();
        case 'xylophone':
            urls = { 'C5': 'C5.mp3' };
             return new Tone.Sampler({ urls, baseUrl: `${baseUrl}xylophone%2F?${apiKey}` }).toDestination();
        case 'flute':
            urls = { 'C5': 'C5.mp3' };
            return new Tone.Sampler({ urls, baseUrl: `${baseUrl}flute%2F?${apiKey}` }).toDestination();
        case 'saxophone':
            urls = { 'C5': 'C5.mp3' };
            return new Tone.Sampler({ urls, baseUrl: `${baseUrl}saxophone%2F?${apiKey}` }).toDestination();
        default:
             urls = { 'C4': 'C4.mp3' };
            return new Tone.Sampler({ urls, baseUrl: `${baseUrl}piano%2F?${apiKey}` }).toDestination();
    }
};

export default function PracticePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [activeInstrument, setActiveInstrument] = useState<Instrument>('piano');

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

        return () => {
            eventTypes.forEach(type => {
                window.removeEventListener(type, startAudio, options);
            });
        };
    }, []);

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

        const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};

        const loadAndPlay = async () => {
            // Pre-load all necessary samplers
            const instrumentsInRecording = new Set(recordedNotes.map(n => n.instrument));
            const loadingPromises: Promise<void>[] = [];

            instrumentsInRecording.forEach(instrument => {
                const sampler = getSamplerForInstrument(instrument);
                samplers[instrument] = sampler;
                loadingPromises.push(Tone.loaded());
            });

            await Promise.all(loadingPromises);

            // Play notes
            recordedNotes.forEach(noteEvent => {
                setTimeout(() => {
                    const sampler = samplers[noteEvent.instrument];
                    if (sampler) {
                        if (Array.isArray(noteEvent.note)) { // Chord
                            sampler.triggerAttackRelease(noteEvent.note, "1n");
                        } else { // Single note
                            sampler.triggerAttackRelease(noteEvent.note, "8n");
                        }
                    }
                }, noteEvent.time);
            });

            const totalTime = recordedNotes.length > 0 ? recordedNotes[recordedNotes.length - 1].time : 0;
            setTimeout(() => {
                setIsPlaying(false);
                Object.values(samplers).forEach(sampler => sampler?.dispose());
            }, totalTime + 1000);
        };
        
        loadAndPlay();
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold tracking-tight">Practice Mode</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select an instrument and play freely.</p>
            </div>

            <Tabs defaultValue="piano" className="w-full" onValueChange={(value) => setActiveInstrument(value as Instrument)}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
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
                            <Piano onNotePlay={handleNotePlay} />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="guitar">
                     <Card>
                        <CardHeader>
                            <CardTitle>Virtual Guitar</CardTitle>
                            <CardDescription>Click the chords to play, or pick individual notes on the fretboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Guitar onNotePlay={handleNotePlay} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="drums">
                     <Card>
                        <CardHeader>
                            <CardTitle>Drum Pad</CardTitle>
                            <CardDescription>Click the pads to play drum sounds.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DrumPad onNotePlay={handleNotePlay} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="violin">
                     <Card>
                        <CardHeader>
                            <CardTitle>Violin</CardTitle>
                            <CardDescription>A virtual violin. Play notes or practice scales.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Violin onNotePlay={handleNotePlay} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="xylophone">
                     <Card>
                        <CardHeader>
                            <CardTitle>Xylophone</CardTitle>
                            <CardDescription>Play the colorful xylophone bars.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Xylophone onNotePlay={handleNotePlay} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="flute">
                     <Card>
                        <CardHeader>
                            <CardTitle>Flute</CardTitle>
                            <CardDescription>Practice with a virtual flute sound.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Flute onNotePlay={handleNotePlay} />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="saxophone">
                     <Card>
                        <CardHeader>
                            <CardTitle>Saxophone</CardTitle>
                            <CardDescription>Practice with a virtual saxophone sound.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Saxophone onNotePlay={handleNotePlay} />
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

    