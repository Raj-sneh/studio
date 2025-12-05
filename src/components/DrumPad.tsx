
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  const sampler = useRef<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeSampler = async () => {
      sampler.current = new Tone.Sampler({
        urls: {
            'C4': 'kick.mp3',
            'D4': 'snare.mp3',
            'E4': 'hihat.mp3',
        },
        baseUrl: 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2F',
        onload: () => {
            setIsLoaded(true);
        }
      }).toDestination();
    };
    initializeSampler();
    return () => {
      sampler.current?.dispose();
    };
  }, []);

  const playNote = useCallback(async (noteKey: string) => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    if (!sampler.current || disabled || !isLoaded) return;
    const drumSound = drumMap[noteKey];
    if (drumSound) {
      sampler.current.triggerAttackRelease(drumSound.note, '1n', Tone.now());
      onNotePlay?.(noteKey);
    }
  }, [disabled, onNotePlay, isLoaded]);

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Loading Drum Samples...</p></div>;
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
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105',
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
