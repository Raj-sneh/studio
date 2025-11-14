"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const keyMap: { [key: string]: string } = {
    'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E', 'f': 'F',
    't': 'F#', 'g': 'G', 'y': 'G#', 'h': 'A', 'u': 'A#', 'j': 'B',
    'k': 'C', 'o': 'C#', 'l': 'D', 'p': 'D#'
};

interface PianoProps {
    octaves?: number;
    startOctave?: number;
    onNotePlay?: (note: string) => void;
    highlightedKeys?: string[];
    disabled?: boolean;
}

export default function Piano({
    octaves = 2,
    startOctave = 3,
    onNotePlay,
    highlightedKeys = [],
    disabled = false,
}: PianoProps) {
    const synth = useRef<Tone.Synth | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentOctave, setCurrentOctave] = useState(startOctave);

    useEffect(() => {
        synth.current = new Tone.Synth({
            oscillator: { type: "triangle8" },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1,
            },
        }).toDestination();
        Tone.context.lookAhead = 0;
        setIsLoaded(true);

        return () => {
            synth.current?.dispose();
        };
    }, []);

    const playNote = useCallback((note: string, octave: number) => {
        if (synth.current && !disabled) {
            const fullNote = `${note}${octave}`;
            synth.current.triggerAttackRelease(fullNote, "8n");
            onNotePlay?.(fullNote);
        }
    }, [disabled, onNotePlay]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (disabled) return;
            const note = keyMap[event.key];
            if (note) {
                let octave = currentOctave;
                if (['k', 'o', 'l', 'p'].includes(event.key)) {
                    octave++;
                }
                playNote(note, octave);
            }
            if (event.key === 'z') changeOctave(-1);
            if (event.key === 'x') changeOctave(1);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [playNote, currentOctave, disabled]);

    const changeOctave = (direction: number) => {
        setCurrentOctave(prev => Math.max(1, Math.min(6, prev + direction)));
    };

    const pianoKeys = Array.from({ length: octaves }, (_, i) => i + currentOctave)
        .flatMap(octave => notes.map(note => ({ note, octave })));

    if (!isLoaded) {
        return <div className="flex items-center justify-center h-40 bg-muted rounded-lg"><p>Loading Piano...</p></div>;
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-center p-4 bg-card rounded-lg shadow-inner">
                <div className="flex relative select-none">
                    {pianoKeys.map(({ note, octave }, index) => {
                        const isBlack = note.includes("#");
                        const fullNote = `${note}${octave}`;

                        return (
                            <div
                                key={`${note}${octave}`}
                                onMouseDown={() => playNote(note, octave)}
                                className={cn(
                                    "cursor-pointer transition-colors duration-100",
                                    isBlack
                                        ? "bg-gray-800 text-white w-6 h-24 border-2 border-gray-900 rounded-b-md z-10 -ml-3 -mr-3 hover:bg-primary"
                                        : "bg-white text-gray-800 w-10 h-36 border-2 border-gray-300 rounded-b-lg hover:bg-primary/20",
                                    highlightedKeys.includes(fullNote) && (isBlack ? "bg-primary" : "bg-primary/50"),
                                    disabled && "opacity-60 cursor-not-allowed"
                                )}
                            >
                            </div>
                        );
                    })}
                </div>
            </div>
             <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <p>Use keyboard keys [A-L] to play. [Z] and [X] to change octave.</p>
                <div className="flex items-center gap-2">
                    <span>Octave: {currentOctave}</span>
                    <button onClick={() => changeOctave(-1)} className="px-2 py-1 bg-muted rounded">&lt;</button>
                    <button onClick={() => changeOctave(1)} className="px-2 py-1 bg-muted rounded">&gt;</button>
                </div>
            </div>
        </div>
    );
}
