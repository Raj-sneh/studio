
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";

// Standard tuning for a 6-string guitar
const openStrings = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

// All notes in chromatic scale
const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const getNoteAt = (stringIndex: number, fret: number): string => {
    if (fret === 0) return openStrings[stringIndex];
    const openNote = openStrings[stringIndex];
    const openNoteName = openNote.slice(0, -1).replace('#', '♯');
    const openOctave = parseInt(openNote.slice(-1));

    const openNoteIndex = allNotes.indexOf(openNoteName);
    const newNoteIndex = (openNoteIndex + fret) % 12;
    const octaveOffset = Math.floor((openNoteIndex + fret) / 12);
    
    const newNoteName = allNotes[newNoteIndex];
    const newOctave = openOctave + octaveOffset;
    
    return `${newNoteName}${newOctave}`;
};

// Create a mapping from note name to string/fret positions
const notePositions: { [note: string]: { string: number; fret: number }[] } = {};
for (let s = 0; s < 6; s++) {
    for (let f = 0; f < 13; f++) { // up to 12 frets
        const note = getNoteAt(s, f);
        if (!notePositions[note]) {
            notePositions[note] = [];
        }
        notePositions[note].push({ string: s, fret: f });
    }
}

interface GuitarProps {
    frets?: number;
    onNotePlay?: (note: string) => void;
    highlightedNotes?: string[];
    disabled?: boolean;
}

export default function Guitar({
    frets = 12,
    onNotePlay,
    highlightedNotes = [],
    disabled = false,
}: GuitarProps) {
    const synth = useRef<Tone.PolySynth | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [pressedNotes, setPressedNotes] = useState<Set<string>>(new Set());

    useEffect(() => {
        const initializeSynth = async () => {
            synth.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'fatsawtooth' },
                envelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 1.2 },
            }).toDestination();
            await Tone.loaded();
            setIsLoaded(true);
        };
        initializeSynth();
        return () => {
            synth.current?.dispose();
        };
    }, []);

    const playNote = useCallback(async (note: string) => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        if (!synth.current || disabled || !isLoaded) return;
        synth.current.triggerAttack(note, Tone.now());
        onNotePlay?.(note);
        setPressedNotes(prev => new Set(prev).add(note));
    }, [disabled, onNotePlay, isLoaded]);

    const stopNote = useCallback((note: string) => {
        if (!synth.current || disabled || !isLoaded) return;
        synth.current.triggerRelease([note], Tone.now());
        setPressedNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(note);
            return newSet;
        });
    }, [disabled, isLoaded]);

    const highlightedPositions = useMemo(() => {
        const positions = new Set<string>();
        highlightedNotes.forEach(note => {
            const pos = notePositions[note];
            // Prefer lower frets for highlighting
            const sortedPos = pos?.sort((a,b) => a.fret - b.fret);
            if (sortedPos && sortedPos[0]) { 
                positions.add(`${sortedPos[0].string}-${sortedPos[0].fret}`);
            }
        });
        return positions;
    }, [highlightedNotes]);

    if (!isLoaded) {
        return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Guitar...</p></div>;
    }

    return (
        <div className="flex items-center justify-center h-full w-full bg-card rounded-lg p-4 select-none">
            <div className="relative w-full max-w-4xl bg-yellow-900/50 p-2 rounded-lg border-2 border-yellow-900/80">
                {/* Frets */}
                {Array.from({ length: frets + 1 }).map((_, fretIndex) => (
                    <div
                        key={fretIndex}
                        className="absolute top-0 bottom-0 bg-yellow-700/80"
                        style={{
                            left: `${(fretIndex / frets) * 100}%`,
                            width: fretIndex === 0 ? '6px' : '2px', // Nut is thicker
                            zIndex: 1,
                        }}
                    />
                ))}

                {/* Fret Markers */}
                {[3, 5, 7, 9].map(fret => (
                    <div key={fret} className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-yellow-200/50 rounded-full z-0" style={{ left: `calc(${((fret - 0.5) / frets) * 100}%)`}} />
                ))}
                 <div className="absolute left-0 right-0 top-1/4 -translate-y-1/2 h-3 w-3 bg-yellow-200/50 rounded-full z-0" style={{ left: `calc(${((12 - 0.5) / frets) * 100}%)` }} />
                 <div className="absolute left-0 right-0 bottom-1/4 translate-y-1/2 h-3 w-3 bg-yellow-200/50 rounded-full z-0" style={{ left: `calc(${((12 - 0.5) / frets) * 100}%)` }} />


                {/* Strings */}
                <div className="relative flex flex-col justify-between h-36 py-1">
                    {openStrings.map((openNote, stringIndex) => (
                        <div key={stringIndex} className="relative w-full flex items-center group" style={{ height: `${2 + stringIndex * 0.5}px` }}>
                             <div className="w-full bg-gray-400 h-full"/>
                             {/* Fretted notes */}
                            {Array.from({ length: frets }).map((_, fretIndex) => {
                                const note = getNoteAt(stringIndex, fretIndex + 1);
                                const positionId = `${stringIndex}-${fretIndex + 1}`;
                                const isHighlighted = highlightedPositions.has(positionId);

                                return (
                                    <div
                                        key={fretIndex}
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all z-20",
                                            !disabled && 'hover:bg-primary/20'
                                        )}
                                        style={{
                                            left: `calc(${((fretIndex + 0.5) / frets) * 100}%)`,
                                        }}
                                        onMouseDown={() => playNote(note)}
                                        onMouseUp={() => stopNote(note)}
                                        onMouseLeave={() => stopNote(note)}
                                        onTouchStart={(e) => { e.preventDefault(); playNote(note); }}
                                        onTouchEnd={(e) => { e.preventDefault(); stopNote(note); }}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full transition-all",
                                             isHighlighted ? 'bg-primary scale-110' : 'bg-transparent'
                                        )}></div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
