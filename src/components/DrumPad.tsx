'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { cn } from '@/lib/utils';
import { Drum } from 'lucide-react';

const drumMap: { [key: string]: { name: string, note: string } } = {
  'C4': { name: 'Kick', note: 'C1' },
  'D4': { name: 'Snare', note: 'D1' },
  'E4': { name: 'Hi-Hat', note: 'F#1' },
};

interface DrumPadProps {
  onNotePlay?: (note: string) => void;
  highlightedKeys?: string[];
  disabled?: boolean;
}

export default function DrumPad({
  onNotePlay,
  highlightedKeys = [],
  disabled = false,
}: DrumPadProps) {
  const synth = useRef<Tone.MembraneSynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeSynth = async () => {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      synth.current = new Tone.MembraneSynth().toDestination();
      setIsLoaded(true);
    };
    initializeSynth();
    return () => {
      synth.current?.dispose();
    };
  }, []);

  const playNote = useCallback((noteKey: string) => {
    if (!synth.current || disabled || !isLoaded) return;
    const drumSound = drumMap[noteKey];
    if (drumSound) {
      synth.current.triggerAttackRelease(drumSound.note, '8n', Tone.now());
      onNotePlay?.(noteKey);
    }
  }, [disabled, onNotePlay, isLoaded]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Drum Pad...</p></div>;
  }

  return (
    <div className="flex items-center justify-center h-full w-full bg-card rounded-lg p-4 select-none">
      <div className="grid grid-cols-3 gap-4">
        {Object.keys(drumMap).map((noteKey) => {
          const isHighlighted = highlightedKeys.includes(noteKey);
          return (
            <div
              key={noteKey}
              onClick={() => playNote(noteKey)}
              className={cn(
                'w-32 h-32 rounded-lg bg-muted border-4 border-muted-foreground flex flex-col items-center justify-center cursor-pointer transition-all duration-100',
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105',
                isHighlighted ? 'bg-primary border-primary-foreground scale-105' : ''
              )}
            >
              <Drum className="h-10 w-10" />
              <span className="mt-2 font-semibold text-lg">{drumMap[noteKey].name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
