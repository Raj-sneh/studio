
"use client";

import { useCallback, useState, useEffect } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { getSampler } from "@/lib/samplers";
import { Loader2, AlertTriangle } from "lucide-react";

const notes = ["C", "D", "E", "F", "G", "A", "B", "C"];
const colors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-400",
  "bg-green-500",
  "bg-sky-500",
  "bg-blue-600",
  "bg-purple-600",
  "bg-red-600",
];

interface XylophoneProps {
    octaves?: number;
    startOctave?: number;
    onNotePlay?: (note: string) => void;
    highlightedKeys?: string[];
    disabled?: boolean;
}

type LoadingState = 'loading' | 'ready' | 'error';

export default function Xylophone({
    octaves = 1,
    startOctave = 4,
    onNotePlay,
    highlightedKeys = [],
    disabled = false,
}: XylophoneProps) {
    const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>('loading');
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        let isMounted = true;
        setLoadingState('loading');

        getSampler('xylophone')
            .then(loadedSampler => {
                if (isMounted) {
                    setSampler(loadedSampler);
                    setLoadingState('ready');
                }
            })
            .catch(error => {
                console.error("Failed to load xylophone sampler:", error);
                if (isMounted) {
                    setLoadingState('error');
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const playNote = useCallback(async (note: string, octave: number) => {
        if (loadingState !== 'ready' || !sampler || disabled || sampler.disposed) return;
        
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        const fullNote = `${note}${octave}`;
        if ('triggerAttackRelease' in sampler) {
            sampler.triggerAttackRelease(fullNote, "8n", Tone.now());
        }
        onNotePlay?.(fullNote);
        setPressedKeys(prev => new Set(prev).add(fullNote));
        setTimeout(() => {
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(fullNote);
                return newSet;
            });
        }, 200);
    }, [disabled, onNotePlay, sampler, loadingState]);
    
    const xylophoneKeys = Array.from({ length: octaves }, (_, i) => i + startOctave)
        .flatMap((octave, octaveIndex) => notes.map((note, index) => {
            const finalOctave = note === "C" && index > 0 ? octave + 1 : octave;
            return { note, octave: finalOctave, color: colors[index % colors.length] }
        }));

    if (loadingState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-muted rounded-lg w-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground capitalize">Loading Xylophone Samples...</p>
            </div>
        );
    }

    if (loadingState === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-destructive/20 text-destructive-foreground rounded-lg w-full">
                <AlertTriangle className="h-8 w-8" />
                <p className="mt-4 font-semibold">Failed to load instrument</p>
                <p className="text-sm text-destructive-foreground/80">Please try refreshing the page.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-yellow-900/80 rounded-lg">
            <div className="flex flex-col space-y-1 select-none w-full max-w-lg">
                {xylophoneKeys.map(({ note, octave, color }, index) => {
                    const fullNote = `${note}${octave}`;
                    const isHighlighted = highlightedKeys.includes(fullNote) || pressedKeys.has(fullNote);
                    const barLength = 95 - index * 6;

                    const handleClick = () => {
                        playNote(note, octave);
                    };

                    return (
                        <div
                            key={`${note}${octave}`}
                            onClick={handleClick}
                            className={cn(
                                "relative cursor-pointer transition-all duration-100 flex items-center justify-center h-12 rounded-md border-2 border-black/50 text-white font-bold shadow-md",
                                color,
                                isHighlighted ? "scale-105 border-white shadow-lg shadow-white/50" : "hover:scale-[1.02]",
                                (disabled || loadingState !== 'ready') && "opacity-60 cursor-not-allowed"
                            )}
                            style={{ width: `${barLength}%`, marginLeft: `${(100 - barLength) / 2}%` }}
                        >
                            <span>{note}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
