'use client';

import { useEffect, useState, ComponentType } from 'react';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';
import { cn } from '@/lib/utils';
import { KickIcon, SnareIcon, HiHatOpenIcon, HiHatClosedIcon, Tom1Icon, Tom2Icon, Tom3Icon, CrashIcon, RideIcon, PercIcon, CowbellIcon, ClapIcon } from '@/components/icons/drums';

interface DrumPadProps {
  onNotePlay?: (note: string) => void;
  disabled?: boolean;
}

const pads: { note: string; Icon: ComponentType<{ className?: string }>; color: string }[] = [
  { note: 'C1', Icon: KickIcon, color: 'bg-stone-700' },
  { note: 'D1', Icon: SnareIcon, color: 'bg-stone-700' },
  { note: 'E1', Icon: ClapIcon, color: 'bg-amber-400' },
  { note: 'F1', Icon: HiHatClosedIcon, color: 'bg-stone-700' },
  { note: 'G1', Icon: HiHatOpenIcon, color: 'bg-yellow-600' },
  { note: 'A1', Icon: Tom1Icon, color: 'bg-stone-700' },
  { note: 'B1', Icon: Tom2Icon, color: 'bg-stone-700' },
  { note: 'C2', Icon: Tom3Icon, color: 'bg-stone-700' },
  { note: 'D2', Icon: CowbellIcon, color: 'bg-yellow-600' },
  { note: 'E2', Icon: CrashIcon, color: 'bg-stone-700' },
  { note: 'F2', Icon: RideIcon, color: 'bg-yellow-600' },
  { note: 'G2', Icon: PercIcon, color: 'bg-stone-700' },
];

export default function DrumPad({ onNotePlay, disabled = false }: DrumPadProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);
  const [pressedNote, setPressedNote] = useState<string | null>(null);

  useEffect(() => {
    getSampler('drums').then(setSampler);
  }, []);

  const playNote = (note: string) => {
    if (sampler && 'triggerAttack' in sampler && !disabled) {
      sampler.triggerAttack(note, Tone.now());
      onNotePlay?.(note);
      setPressedNote(note);
      // Briefly show the pressed state
      setTimeout(() => setPressedNote(null), 150);
    }
  };

  return (
    <div className="w-full max-w-2xl p-4 bg-black/80 rounded-2xl shadow-lg border border-stone-800">
      <div className="grid grid-cols-4 gap-3">
        {pads.map(({ note, Icon, color }) => (
          <button 
            key={note} 
            onMouseDown={() => playNote(note)}
            disabled={disabled}
            className={cn(
              "aspect-video rounded-lg text-white font-bold text-center transition-all duration-100",
              "shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),_0_2px_4px_rgba(0,0,0,0.5)]",
              "border border-black/30",
              "flex items-center justify-center",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black",
              color,
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              pressedNote === note
                ? "bg-primary scale-95 shadow-inner"
                : "hover:bg-opacity-80 active:scale-95 active:shadow-inner"
            )}
          >
            <Icon className="w-1/2 h-1/2 text-stone-300/80 drop-shadow-lg" />
          </button>
        ))}
      </div>
    </div>
  );
}
