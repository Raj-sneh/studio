'use client';

import { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';

interface XylophoneProps {
  onNotePlay?: (note: string) => void;
}

export default function Xylophone({ onNotePlay }: XylophoneProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);

  useEffect(() => {
    getSampler('xylophone').then(setSampler);
  }, []);

  // Basic UI for now
  return (
    <div className="text-center">
      <p>Xylophone Component</p>
      <button onClick={() => sampler && 'triggerAttackRelease' in sampler && sampler.triggerAttackRelease('C4', '8n')}>Play C4</button>
    </div>
  );
}