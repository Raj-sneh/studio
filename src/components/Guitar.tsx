
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GuitarProps {
  onNotePlay?: (note: string) => void;
  disabled?: boolean;
  highlightedKeys?: string[];
}

const strings = [
    { open: 'E4', color: 'bg-slate-300' },
    { open: 'B3', color: 'bg-slate-300' },
    { open: 'G3', color: 'bg-slate-400' },
    { open: 'D3', color: 'bg-slate-400' },
    { open: 'A2', color: 'bg-slate-500' },
    { open: 'E2', color: 'bg-slate-500' },
];

const fretMarkers = [3, 5, 7, 9, 12];

// Corrected chord voicings for a more realistic sound
const chords: Record<string, (string | null)[]> = {
    'G': ['G4', 'B3', 'G3', 'D3', 'B2', 'G2'],      // G Major
    'C': ['E4', 'C4', 'G3', 'E3', 'C3', null],      // C Major (low E muted)
    'D': ['F#4', 'D4', 'A3', 'D3', null, null],     // D Major (A, E muted)
    'Am': ['E4', 'C4', 'A3', 'E3', 'A2', null],     // A Minor (low E muted)
    'Em': ['E4', 'B3', 'G3', 'E3', 'B2', 'E2'],      // E Minor
    'E': ['E4', 'B3', 'G#3', 'E3', 'B2', 'E2'],     // E Major
    'F': ['F4', 'C4', 'A3', 'F3', 'C3', 'F2'],      // F Major (Barre chord)
};
const chordNames = Object.keys(chords);


export default function Guitar({ onNotePlay, disabled = false, highlightedKeys = [] }: GuitarProps) {
  const synthRef = useRef<Tone.PluckSynth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vibratingString, setVibratingString] = useState<number | null>(null);
  const [selectedChord, setSelectedChord] = useState<string>('G');

  useEffect(() => {
    getSampler('guitar').then(loadedSynth => {
      synthRef.current = loadedSynth as Tone.PluckSynth;
      setIsLoading(false);
    });
    
    return () => {
        synthRef.current?.dispose();
    }
  }, []);

  const playNote = useCallback((stringIndex: number) => {
    if (!synthRef.current || disabled || isLoading || synthRef.current.disposed) return;
    
    const note = chords[selectedChord][stringIndex];
    
    // If the note is null for a given chord, don't play anything (muted string)
    if (!note) return;
    
    synthRef.current.triggerAttack(note, Tone.now());

    onNotePlay?.(note);

    setVibratingString(stringIndex);
    setTimeout(() => setVibratingString(null), 300);
  }, [disabled, isLoading, onNotePlay, selectedChord]);

  const selectChord = (chordName: string) => {
    if (disabled || isLoading) return;
    setSelectedChord(chordName);
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-muted rounded-lg w-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-4 text-muted-foreground capitalize">Loading Guitar Synth...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gradient-to-b from-[#2a1a0e] to-[#1c1108] rounded-2xl shadow-lg border border-yellow-900/50 select-none">
      {/* Headstock Area */}
      <div className="bg-gradient-to-r from-yellow-900/80 via-yellow-800/70 to-yellow-900/80 p-3 rounded-t-lg shadow-inner-lg mb-2">
        <div className="flex justify-end items-center">
            <div className="flex gap-1.5 flex-wrap justify-end">
                {chordNames.map((chordName) => (
                    <button 
                        key={chordName} 
                        onClick={() => selectChord(chordName)}
                        disabled={disabled || isLoading}
                        className={cn(
                            "px-4 py-1.5 bg-slate-900/80 text-white font-sans font-semibold rounded-md border border-slate-700/80 shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            selectedChord === chordName && "bg-primary text-primary-foreground border-primary/50 ring-2 ring-primary"
                        )}
                    >
                        {chordName}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Fretboard */}
      <div className="relative overflow-hidden rounded-b-lg">
        {/* Guitar Body background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#6b462a] via-[#54351d] to-[#452813] z-0"></div>
        <div className="absolute right-[-20%] top-1/2 -translate-y-1/2 w-3/5 aspect-square rounded-full bg-gradient-radial from-[#1a100a] via-[#1a100a] to-transparent z-10"></div>
        
        {/* Strings */}
        <div className="relative z-30 flex flex-col justify-around h-64 p-4">
          {strings.map((string, index) => (
            <div
              key={index}
              onClick={() => playNote(index)}
              className={cn(
                "w-full h-0.5 transition-all duration-100 ease-in-out cursor-pointer group",
                string.color,
                disabled && "cursor-not-allowed",
                // Mute strings that are not part of the current chord
                chords[selectedChord][index] === null && "opacity-30 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-full h-full transform-gpu",
                !disabled && chords[selectedChord][index] !== null && "group-hover:scale-y-[3] group-hover:bg-yellow-300",
                vibratingString === index && "vibrating bg-yellow-400 scale-y-[2]"
              )}></div>
            </div>
          ))}
        </div>

        {/* Frets */}
        <div className="absolute inset-0 z-20 flex justify-between px-4 pointer-events-none">
          {Array.from({ length: 12 }, (_, i) => i).map(fret => (
            <div key={fret} className="h-full w-0.5 bg-slate-500/70" style={{ left: `${(fret / 12) * 100}%` }}></div>
          ))}
        </div>
        
        {/* Fret Markers */}
        <div className="absolute inset-0 z-20 pointer-events-none">
            {fretMarkers.map(marker => (
                 <div 
                    key={marker} 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-400/80 rounded-full shadow-inner"
                    style={{ left: `${((marker - 0.5) / 12) * 100}%` }}
                 ></div>
            ))}
        </div>
      </div>
    </div>
  );
}
