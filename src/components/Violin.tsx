"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { Music2 } from "lucide-react";

interface ViolinProps {
  onNotePlay?: (note: string) => void;
  highlightedKeys?: string[];
  disabled?: boolean;
}

export default function Violin({
  onNotePlay,
  highlightedKeys = [],
  disabled = false,
}: ViolinProps) {
  const synth = useRef<Tone.PolySynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeSynth = async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
      }
      synth.current = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 3/2,
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 1.5 },
        modulationEnvelope: { attack: 0.5, decay: 0.01, sustain: 1, release: 0.5 }
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
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Violin...</p></div>;
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-8 text-center">
      <Music2 className="h-24 w-24 text-primary" />
      <h3 className="text-xl font-semibold mt-4">Violin</h3>
      <p className="text-muted-foreground mt-2">
        A fretless wonder! Use an external app or a real instrument for practice.
      </p>
      <div className="mt-4 text-2xl font-bold text-primary">
        {highlightedKeys.length > 0 ? highlightedKeys[highlightedKeys.length - 1] : '...'}
      </div>
    </div>
  );
}
