
"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, History, Music4 } from "lucide-react";
import * as Tone from "tone";
import Piano from "@/components/Piano";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RecordedNote = {
    note: string;
    time: number;
};

export default function PracticePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
    const [startTime, setStartTime] = useState(0);

    // Ensure audio context is started on first user interaction
    useEffect(() => {
        const startAudio = async () => {
            await Tone.start();
            console.log("Audio context started for practice mode");
        };

        // Add a one-time event listener for the first user interaction
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
            setRecordedNotes(prev => [...prev, { note, time: Date.now() - startTime }]);
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
        
        // This is a placeholder for visual/audio playback
        // Since the Piano component itself produces sound, we don't need a separate synth here.
        // We just need to simulate the visual highlighting if desired.
        // For simplicity, we'll just log to console as before.

        recordedNotes.forEach(noteEvent => {
            setTimeout(() => {
                console.log(`Playing back: ${noteEvent.note}`);
                // To add visual feedback, you would need to pass highlighted notes to the Piano component
                // and manage their state here, similar to the lesson page.
            }, noteEvent.time);
        });

        const totalTime = recordedNotes.length > 0 ? recordedNotes[recordedNotes.length - 1].time : 0;
        setTimeout(() => {
            setIsPlaying(false);
        }, totalTime + 500);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="font-headline text-4xl font-bold tracking-tight">Practice Mode</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select an instrument and play freely.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Virtual Piano</CardTitle>
                    <CardDescription>Use your mouse or keyboard to play notes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Piano onNotePlay={handleNotePlay} />
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
