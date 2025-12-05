
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
  const sampler = useRef<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeSampler = async () => {
      sampler.current = new Tone.Sampler({
        urls: { 'C5': 'C5.mp3' },
        baseUrl: 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fflute%2F?alt=media',
        release: 1,
      }).toDestination();
      await Tone.loaded();
      setIsLoaded(true);
    };
    initializeSampler();
    return () => {
      sampler.current?.dispose();
    };
  }, []);

  const playNote = useCallback((note: string) => {
    if (!sampler.current || disabled || !isLoaded) return;
    sampler.current.triggerAttackRelease(note, "8n", Tone.now());
    onNotePlay?.(note);
  }, [disabled, onNotePlay, isLoaded]);

   // Placeholder effect to trigger sounds for highlighted keys
  useEffect(() => {
    if (highlightedKeys.length > 0 && !disabled) {
      const lastNote = highlightedKeys[highlightedKeys.length - 1];
      playNote(lastNote);
    }
  }, [highlightedKeys, disabled, playNote]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Flute Samples...</p></div>;
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

    