'use client';

import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';

export function AnimatedMusicBackground() {
  const [notes, setNotes] = useState<{ id: number; left: string; fontSize: string; animationDuration: string; animationDelay: string }[]>([]);

  useEffect(() => {
    const generatedNotes = [...Array(10)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 16 + 12}px`,
      animationDuration: `${Math.random() * 15 + 15}s`,
      animationDelay: `${Math.random() * -30}s`,
    }));
    setNotes(generatedNotes);
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      {notes.map((note) => (
        <Music
          key={note.id}
          className="music-note absolute text-primary/5"
          style={{
            left: note.left,
            fontSize: note.fontSize,
            animationDuration: note.animationDuration,
            animationDelay: note.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
