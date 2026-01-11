
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
    { note: 'G2', name: 'Crash', key: 'q', Icon: DrumIcons.CrashIcon, style: 'col-span-2' },
    { note: 'G#2', name: 'Ride', key: 'w', Icon: DrumIcons.RideIcon, style: 'col-span-2' },
    { note: 'D2', name: 'Hi-Hat', key: 'e', Icon: DrumIcons.HiHatClosedIcon, style: '' },
    { note: 'E2', name: 'Tom 1', key: 'a', Icon: DrumIcons.Tom1Icon, style: '' },
    { note: 'F2', name: 'Tom 2', key: 's', Icon: DrumIcons.Tom2Icon, style: '' },
    { note: 'F#2', name: 'Tom 3', key: 'd', Icon: DrumIcons.Tom3Icon, style: '' },
    { note: 'C2', name: 'Kick', key: 'z', Icon: DrumIcons.KickIcon, style: 'col-span-2' },
    { note: 'C#2', name: 'Snare', key: 'x', Icon: DrumIcons.SnareIcon, style: 'col-span-2' },
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
    
    if (sampler && 'triggerAttack' in sampler) {
      sampler.triggerAttack(note, Tone.now());
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
    <div className="w-full max-w-[280px] mx-auto p-1 select-none">
        <div className="grid grid-cols-4 gap-1.5">
            {drumPads.map(({ note, name, key, Icon, style }) => (
                <button
                    key={note}
                    onClick={() => playNote(note)}
                    disabled={disabled || isLoading}
                    className={cn(
                        "relative flex flex-col items-center justify-center aspect-square rounded-md border-2 bg-card text-card-foreground shadow-sm transition-all duration-100 ease-in-out hover:bg-accent hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed",
                        pressedPad === note ? 'bg-primary border-primary-foreground scale-95' : 'border-border',
                        style
                    )}
                >
                    <Icon className="h-4 w-4" />
                    <span className="text-[8px] font-semibold mt-0.5">{name}</span>
                    <kbd className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-muted text-muted-foreground rounded px-0.5 py-0.25">{key.toUpperCase()}</kbd>
                </button>
            ))}
        </div>
         <p className="text-center text-xs text-muted-foreground mt-2">Use your keyboard to play the drums.</p>
    </div>
  );
}
