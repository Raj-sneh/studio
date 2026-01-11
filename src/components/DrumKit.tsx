
'use client';

import { useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import * as DrumIcons from '@/components/icons/drums';

interface DrumKitProps {
  onNotePlay?: (note: string) => void;
  disabled?: boolean;
}

type DrumPad = {
  note: string;
  name: string;
  key: string;
  Icon: React.ElementType;
  style: string;
};

const drumPads: DrumPad[] = [
    { note: 'G1', name: 'Crash', key: 'y', Icon: DrumIcons.CrashIcon, style: 'col-span-2' },
    { note: 'A1', name: 'Ride', key: 'u', Icon: DrumIcons.RideIcon, style: 'col-span-2' },

    { note: 'F#1', name: 'Hi-Hat (O)', key: 'q', Icon: DrumIcons.HiHatOpenIcon, style: 'col-span-1' },
    { note: 'C2', name: 'Hi-Hat (C)', key: 'w', Icon: DrumIcons.HiHatClosedIcon, style: 'col-span-1' },
    { note: 'D2', name: 'Snare', key: 'a', Icon: DrumIcons.SnareIcon, style: 'col-span-2' },

    { note: 'G2', name: 'High Tom', key: 'e', Icon: DrumIcons.Tom1Icon, style: 'col-span-1' },
    { note: 'F2', name: 'Mid Tom', key: 'r', Icon: DrumIcons.Tom2Icon, style: 'col-span-1' },
    { note: 'C1', name: 'Kick', key: 's', Icon: DrumIcons.KickIcon, style: 'col-span-2' },

    { note: 'E2', name: 'Low Tom', key: 'd', Icon: DrumIcons.Tom3Icon, style: 'col-span-2' },
    { note: 'B1', name: 'Perc', key: 'f', Icon: DrumIcons.PercIcon, style: 'col-span-2' },
];


const keyMap: Record<string, string> = drumPads.reduce((acc, pad) => {
    acc[pad.key] = pad.note;
    return acc;
}, {} as Record<string, string>);

export default function DrumKit({ onNotePlay, disabled = false }: DrumKitProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pressedPad, setPressedPad] = useState<string | null>(null);

  useEffect(() => {
    getSampler('drums').then(loadedSampler => {
      setSampler(loadedSampler);
      setIsLoading(false);
    });
  }, []);

  const playNote = useCallback((note: string) => {
    if (!sampler || disabled || isLoading || sampler.disposed) return;
    
    // Use triggerAttackRelease for both Sampler and Synth compatibility
    if (sampler && 'triggerAttackRelease' in sampler) {
      sampler.triggerAttackRelease(note, '8n', Tone.now());
    }
    onNotePlay?.(note);

    setPressedPad(note);
    setTimeout(() => setPressedPad(null), 100);
  }, [sampler, disabled, isLoading, onNotePlay]);
  
  useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
          if(disabled || isLoading) return;
          const note = keyMap[event.key.toLowerCase()];
          if(note) {
              event.preventDefault();
              playNote(note);
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playNote, disabled, isLoading]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] text-center bg-muted rounded-lg w-full">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-4 text-muted-foreground capitalize">Loading Drum Kit...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-1 select-none">
        <div className="grid grid-cols-4 gap-2">
            {drumPads.map(({ note, name, key, Icon, style }) => (
                <button
                    key={note}
                    onMouseDown={() => playNote(note)}
                    disabled={disabled || isLoading}
                    className={cn(
                        "relative flex flex-col items-center justify-center aspect-square rounded-md border-2 bg-card text-card-foreground shadow-sm transition-all duration-100 ease-in-out hover:bg-accent hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed",
                        pressedPad === note ? 'bg-primary border-primary-foreground scale-95' : 'border-border',
                        style
                    )}
                >
                    <Icon className="h-8 w-8" />
                    <span className="text-[10px] font-semibold mt-1 truncate">{name}</span>
                    <kbd className="absolute bottom-1 right-1 text-[10px] font-mono bg-muted text-muted-foreground rounded px-1 py-0.5">{key.toUpperCase()}</kbd>
                </button>
            ))}
        </div>
         <p className="text-center text-xs text-muted-foreground mt-3">Use your keyboard to play the drums.</p>
    </div>
  );
}
