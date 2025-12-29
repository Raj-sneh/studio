'use client';

import { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';

interface FluteProps {
  onNotePlay?: (note: string) => void;
}

export default function Flute({ onNotePlay }: FluteProps) {
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);

  useEffect(() => {
    getSampler('flute').then(setSampler);
  }, []);

  // Basic UI for now
  return (
    <div className="text-center">
      <p>Flute Component</p>
      <button onClick={() => sampler && 'triggerAttackRelease' in sampler && sampler.triggerAttackRelease('C4', '8n')}>Play C4</button>
    </div>
  );
}