
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { getSampler } from "@/lib/samplers";
import { Loader2 } from "lucide-react";

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
    const samplerRef = useRef<Tone.Sampler | Tone.Synth | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentOctave, setCurrentOctave] = useState(3);
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const [activeMouseNote, setActiveMouseNote] = useState<string | null>(null);

    useEffect(() => {
        getSampler('piano').then(loadedSampler => {
            samplerRef.current = loadedSampler;
            setIsLoading(false);
        });
        return () => {
          samplerRef.current?.dispose();
        }
    }, []);

    const playNote = useCallback(async (fullNote: string | null) => {
        if (!fullNote || !samplerRef.current || disabled || isLoading || samplerRef.current.disposed) return;
        
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        if ('triggerAttack' in samplerRef.current) {
            samplerRef.current.triggerAttack(fullNote, Tone.now());
        }

        onNotePlay?.(fullNote);
        setPressedKeys(prev => new Set(prev).add(fullNote));
    }, [disabled, onNotePlay, isLoading]);

    const stopNote = useCallback((fullNote: string | null) => {
        if (!fullNote || !samplerRef.current || samplerRef.current.disposed) return;

        setPressedKeys(prev => {
            if (prev.has(fullNote)) {
                if ('triggerRelease' in samplerRef.current!) {
                    samplerRef.current.triggerRelease(fullNote);
                }
                const newSet = new Set(prev);
                newSet.delete(fullNote);
                return newSet;
            }
            return prev;
        });
    }, [disabled, isLoading]);
    
    useEffect(() => {
        const getNoteFromKey = (key: string) => {
            const note = keyMap[key.toLowerCase()];
            if (note) {
                let octave = currentOctave;
                if (['k', 'o', 'l', 'p'].includes(key.toLowerCase())) {
                    octave++;
                }
                return `${note}${octave}`;
            }
            return null;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (disabled || event.repeat || isLoading) return;
            
            const fullNote = getNoteFromKey(event.key);
            if (fullNote) {
                playNote(fullNote);
            }

            if (event.key === 'z') changeOctave(-1);
            if (event.key === 'x') changeOctave(1);
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (disabled || isLoading) return;
            const fullNote = getNoteFromKey(event.key);
            if (fullNote) {
                stopNote(fullNote);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [playNote, stopNote, currentOctave, disabled, isLoading]);

    const handleMouseUp = () => {
        if (activeMouseNote) {
            stopNote(activeMouseNote);
            setActiveMouseNote(null);
        }
    };
    
    const handleMouseLeave = () => {
        if (activeMouseNote) {
            stopNote(activeMouseNote);
            setActiveMouseNote(null);
        }
    };

    const changeOctave = (direction: number) => {
        setCurrentOctave(prev => Math.max(1, Math.min(6, prev + direction)));
    };

    const pianoKeys = Array.from({ length: octaves }, (_, i) => i + startOctave)
        .flatMap(octave => notes.map(note => ({ note, octave })));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-muted rounded-lg w-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground capitalize">Loading Piano Samples...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex p-4 bg-card rounded-lg shadow-inner overflow-x-auto">
                <div 
                  className="flex relative select-none"
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                    {pianoKeys.map(({ note, octave }) => {
                        const isBlack = note.includes("#");
                        const fullNote = `${note}${octave}`;

                        return (
                            <div
                                key={fullNote}
                                onMouseDown={() => {
                                    playNote(fullNote);
                                    setActiveMouseNote(fullNote);
                                }}
                                onTouchStart={(e) => { e.preventDefault(); playNote(fullNote); }}
                                onTouchEnd={(e) => { e.preventDefault(); stopNote(fullNote); }}
                                className={cn(
                                    "relative cursor-pointer transition-colors duration-100 flex items-end justify-center pb-2 font-medium",
                                    isBlack
                                        ? "bg-gray-800 text-white w-6 h-24 border-2 border-gray-900 rounded-b-md z-10 -ml-3 -mr-3"
                                        : "bg-white text-gray-800 w-10 h-36 border-2 border-gray-300 rounded-b-lg",
                                    (highlightedKeys.includes(fullNote) || pressedKeys.has(fullNote)) && (isBlack ? "bg-primary" : "bg-primary/50"),
                                    !pressedKeys.has(fullNote) && (isBlack ? "hover:bg-primary" : "hover:bg-primary/20"),
                                    (disabled || isLoading) && "opacity-60 cursor-not-allowed"
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
