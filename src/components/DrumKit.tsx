
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';
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
  synthType: 'kick' | 'snare' | 'hihat' | 'tom' | 'crash';
};

const drumPads: DrumPad[] = [
    { note: 'G1', name: 'Crash', key: 'y', Icon: DrumIcons.CrashIcon, style: 'col-span-2', synthType: 'crash' },
    { note: 'A1', name: 'Ride', key: 'u', Icon: DrumIcons.RideIcon, style: 'col-span-2', synthType: 'crash' },

    { note: 'F#1', name: 'Hi-Hat (O)', key: 'q', Icon: DrumIcons.HiHatOpenIcon, style: 'col-span-1', synthType: 'hihat' },
    { note: 'C2', name: 'Hi-Hat (C)', key: 'w', Icon: DrumIcons.HiHatClosedIcon, style: 'col-span-1', synthType: 'hihat' },
    { note: 'D2', name: 'Snare', key: 'a', Icon: DrumIcons.SnareIcon, style: 'col-span-2', synthType: 'snare' },

    { note: 'G2', name: 'High Tom', key: 'e', Icon: DrumIcons.Tom1Icon, style: 'col-span-1', synthType: 'tom' },
    { note: 'F2', name: 'Mid Tom', key: 'r', Icon: DrumIcons.Tom2Icon, style: 'col-span-1', synthType: 'tom' },
    { note: 'C1', name: 'Kick', key: 's', Icon: DrumIcons.KickIcon, style: 'col-span-2', synthType: 'kick' },

    { note: 'E2', name: 'Low Tom', key: 'd', Icon: DrumIcons.Tom3Icon, style: 'col-span-2', synthType: 'tom' },
    { note: 'B1', name: 'Perc', key: 'f', Icon: DrumIcons.PercIcon, style: 'col-span-2', synthType: 'hihat' },
];

const keyMap: Record<string, string> = drumPads.reduce((acc, pad) => {
    acc[pad.key] = pad.note;
    return acc;
}, {} as Record<string, string>);

type DrumSynths = {
    kick: Tone.MembraneSynth,
    snare: Tone.NoiseSynth,
    hihat: Tone.MetalSynth,
    tom: Tone.MembraneSynth,
    crash: Tone.MetalSynth
};

export default function DrumKit({ onNotePlay, disabled = false }: DrumKitProps) {
  const synthsRef = useRef<DrumSynths | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pressedPad, setPressedPad] = useState<string | null>(null);

  useEffect(() => {
    const createSynths = async () => {
        await Tone.start();
        const kick = new Tone.MembraneSynth().toDestination();
        const snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
        }).toDestination();
        const hihat = new Tone.MetalSynth({
            frequency: 400,
            envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5,
        }).toDestination();
         const tom = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' },
        }).toDestination();
        const crash = new Tone.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 1.2, release: 1 },
            harmonicity: 5.1,
            modulationIndex: 64,
            resonance: 4000,
            octaves: 2.5
        }).toDestination();

        synthsRef.current = { kick, snare, hihat, tom, crash };
        setIsLoading(false);
    }
    createSynths();

    return () => {
        synthsRef.current?.kick.dispose();
        synthsRef.current?.snare.dispose();
        synthsRef.current?.hihat.dispose();
        synthsRef.current?.tom.dispose();
        synthsRef.current?.crash.dispose();
    }
  }, []);

  const playNote = useCallback((note: string) => {
    if (disabled || isLoading || !synthsRef.current) return;
    
    const pad = drumPads.find(p => p.note === note);
    if (!pad) return;

    const synths = synthsRef.current;
    const now = Tone.now();

    switch(pad.synthType) {
        case 'kick':
            synths.kick.triggerAttackRelease('C1', '8n', now);
            break;
        case 'snare':
            synths.snare.triggerAttackRelease('4n', now);
            break;
        case 'hihat':
            synths.hihat.triggerAttack(now);
            break;
        case 'tom':
            synths.tom.triggerAttackRelease(pad.note, '8n', now);
            break;
        case 'crash':
            synths.crash.triggerAttack(now);
            break;
    }

    onNotePlay?.(note);

    setPressedPad(note);
    setTimeout(() => setPressedPad(null), 100);
  }, [disabled, isLoading, onNotePlay]);
  
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
            <p className="mt-4 text-muted-foreground capitalize">Loading Drum Synths...</p>
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
