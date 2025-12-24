
'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { createSampler } from '@/lib/samplers';
import { Loader2 } from 'lucide-react';

const drumMap: { [key: string]: { name: string; note: string; imageUrl: string; hint: string } } = {
  'C4': { name: 'Kick', note: 'C4', imageUrl: 'https://picsum.photos/seed/kick-drum/200/200', hint: 'kick drum' },
  'D4': { name: 'Snare', note: 'D4', imageUrl: 'https://picsum.photos/seed/snare-drum/200/200', hint: 'snare drum' },
  'E4': { name: 'Hi-Hat', note: 'E4', imageUrl: 'https://picsum.photos/seed/hi-hat/200/200', hint: 'hi-hat' },
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
  const [sampler, setSampler] = useState<Tone.Sampler | Tone.Synth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let localSampler: Tone.Sampler | Tone.Synth | null = null;
    const loadSampler = async () => {
      setIsLoading(true);
      localSampler = await createSampler('drums');
      setSampler(localSampler);
      setIsLoading(false);
    }
    loadSampler();
    return () => {
      if(localSampler) localSampler.dispose();
    }
  }, []);

  const playNote = useCallback(async (noteKey: string) => {
    if (!sampler || disabled || isLoading || sampler.disposed) return;
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    const drumSound = drumMap[noteKey];
    if (drumSound && 'triggerAttackRelease' in sampler) {
      sampler.triggerAttackRelease(drumSound.note, '1n', Tone.now());
      onNotePlay?.(noteKey);
    }
  }, [disabled, onNotePlay, sampler, isLoading]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full bg-muted rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="ml-2">Loading Drum Samples...</p>
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full bg-card rounded-lg p-4 select-none">
      <div className="grid grid-cols-3 gap-4">
        {Object.keys(drumMap).map((noteKey) => {
          const drum = drumMap[noteKey];
          const isHighlighted = highlightedKeys.includes(noteKey);
          return (
            <div
              key={noteKey}
              onClick={() => playNote(noteKey)}
              className={cn(
                'w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-muted-foreground flex flex-col items-center justify-center cursor-pointer transition-all duration-100 relative',
                (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105',
                isHighlighted ? 'bg-primary border-primary-foreground scale-105 shadow-lg shadow-primary/50' : ''
              )}
            >
              <Image
                src={drum.imageUrl}
                alt={drum.name}
                width={200}
                height={200}
                data-ai-hint={drum.hint}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="font-semibold text-lg text-white drop-shadow-md">{drum.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
