
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { Wind } from "lucide-react";

interface FluteProps {
  onNotePlay?: (note: string) => void;
  highlightedKeys?: string[];
  disabled?: boolean;
}

export default function Flute({
  onNotePlay,
  highlightedKeys = [],
  disabled = false,
}: FluteProps) {
  const synth = useRef<Tone.PolySynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeSynth = async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
      }
      synth.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.5 },
      }).toDestination();
      setIsLoaded(true);
    };
    initializeSynth();
    return () => {
      synth.current?.dispose();
    };
  }, []);

  const playNote = useCallback((note: string) => {
    if (!synth.current || disabled || !isLoaded) return;
    synth.current.triggerAttackRelease(note, "8n", Tone.now());
    onNotePlay?.(note);
  }, [disabled, onNotePlay, isLoaded]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Flute...</p></div>;
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-8 text-center">
      <Wind className={cn("h-24 w-24 text-primary transition-transform duration-100", highlightedKeys.length > 0 && "scale-110")} />
      <h3 className="text-xl font-semibold mt-4">Flute</h3>
      <p className="text-muted-foreground mt-2">
        A beautiful woodwind instrument. Use an external app or a real instrument for practice.
      </p>
      <div className="mt-4 text-2xl font-bold text-primary h-8">
        {highlightedKeys.length > 0 ? highlightedKeys[highlightedKeys.length - 1] : '...'}
      </div>
    </div>
  );
}
