
'use client';

import { useEffect, useState, useCallback } from 'react';
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
    { note: 'E4', color: 'bg-slate-300' },
    { note: 'B3', color: 'bg-slate-300' },
    { note: 'G3', color: 'bg-slate-400' },
    { note: 'D3', color: 'bg-slate-400' },
    { note: 'A2', color: 'bg-slate-500' },
    { note: 'E2', color: 'bg-slate-500' },
];

const frets = Array.from({ length: 12 }, (_, i) => i);
const fretMarkers = [3, 5, 7, 9, 12];

const chords: Record<string, string[]> = {
    'C': ['C3', 'E3', 'G3'],
    'G': ['G2', 'B2', 'D3'],
    'A#': ['A#2', 'D3', 'F3'],
    'F': ['F2', 'A2', 'C3'],
    'G#': ['G#2', 'C3', 'D#3'],
    'Cm': ['C3', 'D#3', 'G3']
};
const chordNames = ['C', 'G', 'A#', 'F', 'G#', 'Cm'];


export default function Guitar({ onNotePlay, disabled = false, highlightedKeys = [] }: GuitarProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vibratingString, setVibratingString] = useState<number | null>(null);

  useEffect(() => {
    getSampler('guitar').then(loadedSampler => {
      setSampler(loadedSampler);
      setIsLoading(false);
    });
  }, []);

  const playNote = useCallback((note: string, stringIndex: number) => {
    if (!sampler || disabled || isLoading || sampler.disposed) return;
    
    if (sampler && 'triggerAttackRelease' in sampler) {
        sampler.triggerAttackRelease(note, '1n', Tone.now());
    }
    onNotePlay?.(note);

    setVibratingString(stringIndex);
    setTimeout(() => setVibratingString(null), 300);
  }, [sampler, disabled, isLoading, onNotePlay]);

  const playChord = useCallback((chordNotes: string[]) => {
    if (!sampler || disabled || isLoading || sampler.disposed) return;

    if (sampler && 'triggerAttackRelease' in sampler) {
        sampler.triggerAttackRelease(chordNotes, '1n', Tone.now());
    }
  }, [sampler, disabled, isLoading]);


  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center bg-muted rounded-lg w-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-4 text-muted-foreground capitalize">Loading Guitar Samples...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gradient-to-b from-[#2a1a0e] to-[#1c1108] rounded-2xl shadow-lg border border-yellow-900/50 select-none">
      {/* Headstock Area */}
      <div className="bg-gradient-to-r from-yellow-900/80 via-yellow-800/70 to-yellow-900/80 p-3 rounded-t-lg shadow-inner-lg mb-2">
        <div className="flex justify-end items-center">
            <div className="flex gap-1.5">
                {chordNames.map((chordName) => (
                    <button 
                        key={chordName} 
                        onClick={() => playChord(chords[chordName])}
                        disabled={disabled || isLoading}
                        className="px-4 py-1.5 bg-slate-900/80 text-white font-sans font-semibold rounded-md border border-slate-700/80 shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
              onClick={() => playNote(string.note, index)}
              className={cn(
                "w-full h-0.5 transition-all duration-100 ease-in-out cursor-pointer group",
                string.color,
                disabled && "cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-full h-full transform-gpu",
                !disabled && "group-hover:scale-y-[3] group-hover:bg-yellow-300",
                vibratingString === index && "vibrating bg-yellow-400 scale-y-[2]"
              )}></div>
            </div>
          ))}
        </div>

        {/* Frets */}
        <div className="absolute inset-0 z-20 flex justify-between px-4 pointer-events-none">
          {frets.map(fret => (
            <div key={fret} className="h-full w-0.5 bg-slate-500/70" style={{ left: `${(fret / frets.length) * 100}%` }}></div>
          ))}
        </div>
        
        {/* Fret Markers */}
        <div className="absolute inset-0 z-20 pointer-events-none">
            {fretMarkers.map(marker => (
                 <div 
                    key={marker} 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-400/80 rounded-full shadow-inner"
                    style={{ left: `${((marker - 0.5) / frets.length) * 100}%` }}
                 ></div>
            ))}
        </div>
      </div>
    </div>
  );
}
