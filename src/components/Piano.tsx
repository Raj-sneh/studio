
"use client";

import { useEffect, useState, useCallback } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { getSampler } from "@/lib/samplers";

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
    octaves = 7,
    startOctave = 1,
    onNotePlay,
    highlightedKeys = [],
    disabled = false,
}: PianoProps) {
    const sampler = getSampler('piano');
    const [currentOctave, setCurrentOctave] = useState(3);
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    const playNote = useCallback(async (note: string, octave: number) => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        if (!sampler || disabled || !sampler.loaded) return;
        const fullNote = `${note}${octave}`;
        
        sampler.triggerAttack(fullNote, Tone.now());

        onNotePlay?.(fullNote);
        setPressedKeys(prev => new Set(prev).add(fullNote));
    }, [disabled, onNotePlay, sampler]);

    const stopNote = useCallback((note: string, octave: number) => {
        if (!sampler || disabled || !sampler.loaded) return;
        const fullNote = `${note}${octave}`;
        sampler.triggerRelease([fullNote], Tone.now() + 0.1);
        setPressedKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(fullNote);
            return newSet;
        });
    }, [disabled, sampler]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (disabled || event.repeat) return;
            const note = keyMap[event.key.toLowerCase()];
            if (note) {
                let octave = currentOctave;
                if (['k', 'o', 'l', 'p'].includes(event.key.toLowerCase())) {
                    octave++;
                }
                const fullNote = `${note}${octave}`;
                if (!pressedKeys.has(fullNote)) {
                    playNote(note, octave);
                }
            }
            if (event.key === 'z') changeOctave(-1);
            if (event.key === 'x') changeOctave(1);
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (disabled) return;
            const note = keyMap[event.key.toLowerCase()];
            if (note) {
                let octave = currentOctave;
                if (['k', 'o', 'l', 'p'].includes(event.key.toLowerCase())) {
                    octave++;
                }
                stopNote(note, octave);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playNote, stopNote, currentOctave, disabled, pressedKeys]);

    const changeOctave = (direction: number) => {
        setCurrentOctave(prev => Math.max(1, Math.min(6, prev + direction)));
    };

    const pianoKeys = Array.from({ length: octaves }, (_, i) => i + startOctave)
        .flatMap(octave => notes.map(note => ({ note, octave })));

    if (!sampler.loaded) {
        return <div className="flex items-center justify-center h-40 bg-muted rounded-lg"><p>Loading Piano Samples...</p></div>;
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex p-4 bg-card rounded-lg shadow-inner overflow-x-auto">
                <div className="flex relative select-none">
                    {pianoKeys.map(({ note, octave }) => {
                        const isBlack = note.includes("#");
                        const fullNote = `${note}${octave}`;

                        return (
                            <div
                                key={`${note}${octave}`}
                                onMouseDown={() => playNote(note, octave)}
                                onMouseUp={() => stopNote(note, octave)}
                                onMouseLeave={() => stopNote(note, octave)}
                                onTouchStart={(e) => { e.preventDefault(); playNote(note, octave); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopNote(note, octave); }}
                                className={cn(
                                    "relative cursor-pointer transition-colors duration-100 flex items-end justify-center pb-2 font-medium",
                                    isBlack
                                        ? "bg-gray-800 text-white w-6 h-24 border-2 border-gray-900 rounded-b-md z-10 -ml-3 -mr-3"
                                        : "bg-white text-gray-800 w-10 h-36 border-2 border-gray-300 rounded-b-lg",
                                    (highlightedKeys.includes(fullNote) || pressedKeys.has(fullNote)) && (isBlack ? "bg-primary" : "bg-primary/50"),
                                    !pressedKeys.has(fullNote) && (isBlack ? "hover:bg-primary" : "hover:bg-primary/20"),
                                    disabled && "opacity-60 cursor-not-allowed"
                                )}
                            >
                                <span className={cn("text-xs", isBlack && "text-gray-300")}>{note}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
             <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <p>Use keyboard keys [A-L] to play. [Z] and [X] to change octave.</p>
                <div className="flex items-center gap-2">
                    <span>Keyboard Octave: {currentOctave}</span>
                    <button onClick={() => changeOctave(-1)} className="px-2 py-1 bg-muted rounded">&lt;</button>
                    <button onClick={() => changeOctave(1)} className="px-2 py-1 bg-muted rounded">&gt;</button>
                </div>
            </div>
        </div>
    );
}

    