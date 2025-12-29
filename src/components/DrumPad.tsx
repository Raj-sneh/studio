'use client';

import { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';

interface DrumPadProps {
  onNotePlay?: (note: string) => void;
}

const pads = [
  { note: 'C1', label: 'Kick' },
  { note: 'C#1', label: 'Kick 2' },
  { note: 'D1', label: 'Snare' },
  { note: 'D#1', label: 'Snare 2' },
  { note: 'E1', label: 'Tom 1' },
  { note: 'F1', label: 'Tom 2' },
  { note: 'F#1', label: 'Tom 3' },
  { note: 'G1', label: 'Hi-Hat O' },
  { note: 'G#1', label: 'Hi-Hat C' },
  { note: 'A1', label: 'Crash' },
  { note: 'A#1', label: 'Ride' },
  { note: 'B1', label: 'Perc' },
];

export default function DrumPad({ onNotePlay }: DrumPadProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);

  useEffect(() => {
    getSampler('drums').then(setSampler);
  }, []);

  const playNote = (note: string) => {
    if (sampler && 'triggerAttack' in sampler) {
      sampler.triggerAttack(note, Tone.now());
      onNotePlay?.(note);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-900 rounded-lg max-w-md mx-auto">
      {pads.map((pad) => (
        <button 
          key={pad.note} 
          onMouseDown={() => playNote(pad.note)}
          className="p-4 rounded-lg bg-gray-700 text-white font-bold text-center active:bg-primary transition-colors duration-100 shadow-md"
        >
          {pad.label}
        </button>
      ))}
    </div>
  );
}
