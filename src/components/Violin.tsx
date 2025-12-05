
"use client";

import { useEffect, useCallback } from "react";
import * as Tone from "tone";
import { Music2 } from "lucide-react";
import { getSampler } from "@/lib/samplers";

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
  const sampler = getSampler('violin');

  const playNote = useCallback((note: string) => {
    if (!sampler || disabled || !sampler.loaded) return;
    sampler.triggerAttackRelease(note, "1n", Tone.now());
    onNotePlay?.(note);
  }, [disabled, onNotePlay, sampler]);

   // Placeholder effect to trigger sounds for highlighted keys
  useEffect(() => {
    if (highlightedKeys.length > 0 && !disabled) {
      const lastNote = highlightedKeys[highlightedKeys.length - 1];
      playNote(lastNote);
    }
  }, [highlightedKeys, disabled, playNote]);


  if (!sampler.loaded) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Violin Samples...</p></div>;
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-8 text-center">
      <Music2 className="h-24 w-24 text-primary" />
      <h3 className="text-xl font-semibold mt-4">Violin</h3>
      <p className="text-muted-foreground mt-2">
        A fretless wonder! Use an external app or a real instrument for practice.
      </p>
      <div className="mt-4 text-2xl font-bold text-primary h-8">
        {highlightedKeys.length > 0 ? highlightedKeys[highlightedKeys.length - 1] : '...'}
      </div>
    </div>
  );
}

    