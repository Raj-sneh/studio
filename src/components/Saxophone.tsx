
"use client";

import { useEffect, useCallback, useState } from "react";
import * as Tone from "tone";
import { cn } from "@/lib/utils";
import { Wind } from "lucide-react";
import { getSampler } from "@/lib/samplers";

interface SaxophoneProps {
  onNotePlay?: (note: string) => void;
  highlightedKeys?: string[];
  disabled?: boolean;
}

export default function Saxophone({
  onNotePlay,
  highlightedKeys = [],
  disabled = false,
}: SaxophoneProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);

  useEffect(() => {
    const loadSampler = async () => {
      const s = await getSampler('saxophone');
      setSampler(s);
    }
    loadSampler();
  }, []);

  const playNote = useCallback((note: string) => {
    if (!sampler || disabled || !('loaded' in sampler && sampler.loaded) || sampler.disposed) return;
    if ('triggerAttackRelease' in sampler) {
      sampler.triggerAttackRelease(note, "8n", Tone.now());
    }
    onNotePlay?.(note);
  }, [disabled, onNotePlay, sampler]);

   // Placeholder effect to trigger sounds for highlighted keys
  useEffect(() => {
    if (highlightedKeys.length > 0 && !disabled && sampler) {
      const lastNote = highlightedKeys[highlightedKeys.length - 1];
      playNote(lastNote);
    }
  }, [highlightedKeys, disabled, playNote, sampler]);

  if (!sampler) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Saxophone Samples...</p></div>;
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-8 text-center">
      <Wind className={cn("h-24 w-24 text-primary transition-transform duration-100", highlightedKeys.length > 0 && "scale-110")} />
      <h3 className="text-xl font-semibold mt-4">Saxophone</h3>
      <p className="text-muted-foreground mt-2">
        A soulful reed instrument. Use an external app or a real instrument for practice.
      </p>
      <div className="mt-4 text-2xl font-bold text-primary h-8">
        {highlightedKeys.length > 0 ? highlightedKeys[highlightedKeys.length - 1] : '...'}
      </div>
    </div>
  );
}
