"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";

const notes = ["C", "D", "E", "F", "G", "A", "B"];
const colors = [
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-purple-400",
];

interface XylophoneProps {
    octaves?: number;
    startOctave?: number;
    onNotePlay?: (note: string) => void;
    highlightedKeys?: string[];
    disabled?: boolean;
}

export default function Xylophone({
    octaves = 2,
    startOctave = 4,
    onNotePlay,
    highlightedKeys = [],
    disabled = false,
}: XylophoneProps) {
    const synth = useRef<Tone.PolySynth | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        const initializeSynth = async () => {
            if (Tone.context.state !== 'running') {
              await Tone.start();
            }
            
            synth.current = new Tone.PolySynth(Tone.MetalSynth, {
              frequency: 200,
              envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
              harmonicity: 5.1,
              modulationIndex: 32,
              resonance: 4000,
              octaves: 1.5,
            }).toDestination();
            
            setIsLoaded(true);
        }
        
        initializeSynth();

        return () => {
            synth.current?.dispose();
        };
    }, []);

    const playNote = useCallback((note: string, octave: number) => {
        if (!synth.current || disabled || !isLoaded) return;
        const fullNote = `${note}${octave}`;
        synth.current.triggerAttackRelease(fullNote, "8n", Tone.now());
        onNotePlay?.(fullNote);
        setPressedKeys(prev => new Set(prev).add(fullNote));
        setTimeout(() => {
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(fullNote);
                return newSet;
            });
        }, 200);
    }, [disabled, onNotePlay, isLoaded]);
    
    const xylophoneKeys = Array.from({ length: octaves }, (_, i) => i + startOctave)
        .flatMap(octave => notes.map((note, index) => ({ note, octave, color: colors[index % colors.length] })));

    if (!isLoaded) {
        return <div className="flex items-center justify-center h-40 bg-muted rounded-lg"><p>Loading Xylophone...</p></div>;
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex flex-col space-y-1 select-none">
                {xylophoneKeys.map(({ note, octave, color }, index) => {
                    const fullNote = `${note}${octave}`;
                    const isHighlighted = highlightedKeys.includes(fullNote) || pressedKeys.has(fullNote);
                    const barLength = 100 - index * 2;

                    return (
                        <div
                            key={`${note}${octave}`}
                            onClick={() => playNote(note, octave)}
                            className={cn(
                                "relative cursor-pointer transition-all duration-100 flex items-center justify-center h-10 rounded-md border-2 border-gray-800 text-white font-bold",
                                color,
                                isHighlighted ? "scale-105 border-white shadow-lg" : "hover:scale-102",
                                disabled && "opacity-60 cursor-not-allowed"
                            )}
                            style={{ width: `${barLength}%`, marginLeft: `${index}%` }}
                        >
                            <span>{note}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
