
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";

// Standard tuning for a 6-string guitar
const openStrings = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

// All notes in chromatic scale
const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const chords: Record<string, (string | null)[]> = {
    'Am': ['E4', 'C4', 'A3', 'E3', 'A2', null],
    'C':  ['E4', 'C4', 'G3', 'E3', 'C3', null],
    'Dm': ['F4', 'D4', 'A3', 'D3', null, null],
    'D':  ['F#4', 'D4', 'A3', 'D3', null, null],
    'Em': ['E4', 'B3', 'G3', 'E3', 'B2', 'E2'],
    'E':  ['E4', 'B3', 'G#3', 'E3', 'B2', 'E2'],
    'Bm': [null, 'D4', 'B3', 'F#3', 'B2', null]
};

const getNoteAt = (stringIndex: number, fret: number): string => {
    if (fret === 0) return openStrings[stringIndex];
    const openNote = openStrings[stringIndex];
    const openNoteName = openNote.slice(0, -1);
    const openOctave = parseInt(openNote.slice(-1));

    const openNoteIndex = allNotes.indexOf(openNoteName.replace('♯', '#'));
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
    const [activeChord, setActiveChord] = useState<string | null>(null);


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

    const playChord = useCallback(async (chordName: string) => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        if (!synth.current || disabled || !isLoaded) return;
        const chordNotes = chords[chordName].filter(n => n !== null) as string[];
        synth.current.triggerAttackRelease(chordNotes, '1n');
        setActiveChord(chordName);
        onNotePlay?.(chordName);
        setTimeout(() => setActiveChord(null), 500);
    }, [disabled, onNotePlay, isLoaded]);


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
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#3a2e20] rounded-lg p-4 select-none">
            <div className="w-full max-w-4xl mb-4">
                <div className="flex items-center gap-1 p-2 bg-[#d2a36b] rounded-t-md border-b-4 border-black/20">
                    <Button variant="ghost" size="icon" className="hover:bg-black/10">
                        <Settings className="h-6 w-6 text-black/70" />
                    </Button>
                    {Object.keys(chords).map(chordName => (
                        <Button
                            key={chordName}
                            onClick={() => playChord(chordName)}
                            variant={activeChord === chordName ? "secondary" : "default"}
                            className={cn("text-lg font-bold border-2 border-b-4", 
                                activeChord === chordName 
                                ? "bg-amber-400 border-amber-500/50 text-black"
                                : "bg-neutral-800 border-neutral-900/50 text-white hover:bg-neutral-700"
                            )}
                        >
                            {chordName}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="relative w-full max-w-4xl bg-yellow-900/50 p-2 rounded-lg border-2 border-yellow-900/80">
                {/* Frets */}
                {Array.from({ length: frets + 1 }).map((_, fretIndex) => (
                    <div
                        key={fretIndex}
                        className="absolute top-0 bottom-0 bg-gray-400"
                        style={{
                            left: `${(fretIndex / (frets + 1)) * 100}%`,
                            width: fretIndex === 0 ? '6px' : '2px', // Nut is thicker
                            zIndex: 1,
                        }}
                    />
                ))}

                {/* Fret Markers */}
                {[3, 5, 7, 9, 12].map(fret => (
                    <div
                        key={fret}
                        className={cn(
                            "absolute left-0 right-0 h-4 w-4 bg-gray-300/70 rounded-full z-0",
                            fret === 12 ? "top-1/4 -translate-y-1/2" : "top-1/2 -translate-y-1/2"
                        )}
                        style={{ left: `calc(${((fret - 0.5) / (frets + 1)) * 100}%)`}} />
                ))}
                 { [12].map(fret => (
                     <div key={fret} className="absolute left-0 right-0 bottom-1/4 translate-y-1/2 h-4 w-4 bg-gray-300/70 rounded-full z-0" style={{ left: `calc(${((fret - 0.5) / (frets+1)) * 100}%)` }} />
                 ))}


                {/* Strings */}
                <div className="relative flex flex-col justify-between h-40 py-2">
                    {openStrings.map((openNote, stringIndex) => (
                        <div key={stringIndex} className="relative w-full flex items-center group">
                             <div className="w-full bg-gradient-to-r from-yellow-500 to-amber-300" style={{ height: `${1.5 + stringIndex * 0.5}px` }}/>
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
                                            left: `calc(${((fretIndex + 0.5) / (frets+1)) * 100}%)`,
                                        }}
                                        onMouseDown={() => playNote(note)}
                                        onMouseUp={() => stopNote(note)}
                                        onMouseLeave={() => stopNote(note)}
                                        onTouchStart={(e) => { e.preventDefault(); playNote(note); }}
                                        onTouchEnd={(e) => { e.preventDefault(); stopNote(note); }}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full transition-all",
                                             isHighlighted ? 'bg-primary scale-110' : ''
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

    