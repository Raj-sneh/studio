
import type { Lesson } from '@/types';

export const LESSONS: Lesson[] = [
  {
    id: 'twinkle-twinkle-little-star',
    title: 'Twinkle Twinkle Little Star',
    instrument: 'piano',
    difficulty: 'Beginner',
    tempo: 100,
    imageId: 'lesson-twinkle-twinkle',
    notes: [
      { key: 'C4', duration: '4n', time: '0:0:0' },
      { key: 'C4', duration: '4n', time: '0:1:0' },
      { key: 'G4', duration: '4n', time: '0:2:0' },
      { key: 'G4', duration: '4n', time: '0:3:0' },
      { key: 'A4', duration: '4n', time: '1:0:0' },
      { key: 'A4', duration: '4n', time: '1:1:0' },
      { key: 'G4', duration: '2n', time: '1:2:0' },
      { key: 'F4', duration: '4n', time: '2:0:0' },
      { key: 'F4', duration: '4n', time: '2:1:0' },
      { key: 'E4', duration: '4n', time: '2:2:0' },
      { key: 'E4', duration: '4n', time: '2:3:0' },
      { key: 'D4', duration: '4n', time: '3:0:0' },
      { key: 'D4', duration: '4n', time: '3:1:0' },
      { key: 'C4', duration: '2n', time: '3:2:0' },
    ],
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    instrument: 'piano',
    difficulty: 'Beginner',
    tempo: 120,
    imageId: 'lesson-ode-to-joy',
    notes: [
      { key: 'E4', duration: '4n', time: '0:0:0' },
      { key: 'E4', duration: '4n', time: '0:1:0' },
      { key: 'F4', duration: '4n', time: '0:2:0' },
      { key: 'G4', duration: '4n', time: '0:3:0' },
      { key: 'G4', duration: '4n', time: '1:0:0' },
      { key: 'F4', duration: '4n', time: '1:1:0' },
      { key: 'E4', duration: '4n', time: '1:2:0' },
      { key: 'D4', duration: '4n', time: '1:3:0' },
      { key: 'C4', duration: '4n', time: '2:0:0' },
      { key: 'C4', duration: '4n', time: '2:1:0' },
      { key: 'D4', duration: '4n', time: '2:2:0' },
      { key: 'E4', duration: '4n', time: '2:3:0' },
      { key: 'E4', duration: '2n', time: '3:0:0' },
      { key: 'D4', duration: '4n', time: '3:2:0' },
      { key: 'D4', duration: '4n', time: '3:3:0' },
    ],
  },
  {
    id: 'simple-guitar-strum',
    title: 'Simple Strumming',
    instrument: 'guitar',
    difficulty: 'Beginner',
    tempo: 90,
    imageId: 'lesson-guitar-simple',
    notes: [
      // G Chord
      { key: 'G2', duration: '4n', time: '0:0:0' },
      { key: 'B2', duration: '4n', time: '0:0:0' },
      { key: 'D3', duration: '4n', time: '0:0:0' },
      // C Chord
      { key: 'C3', duration: '4n', time: '0:2:0' },
      { key: 'E3', duration: '4n', time: '0:2:0' },
      { key: 'G3', duration: '4n', time: '0:2:0' },
      // G Chord
      { key: 'G2', duration: '4n', time: '1:0:0' },
      { key: 'B2', duration: '4n', time: '1:0:0' },
      { key: 'D3', duration: '4n', time: '1:0:0' },
      // D Chord
      { key: 'D3', duration: '4n', time: '1:2:0' },
      { key: 'F#3', duration: '4n', time: '1:2:0' },
      { key: 'A3', duration: '4n', time: '1:2:0' },
    ],
  },
  {
    id: 'basic-rock-beat',
    title: 'Basic Rock Beat',
    instrument: 'drums',
    difficulty: 'Beginner',
    tempo: 120,
    imageId: 'lesson-drum-basics',
    notes: [
      // Measure 1
      { key: 'C1', duration: '8n', time: '0:0:0' }, // Kick
      { key: 'C2', duration: '8n', time: '0:0:0' }, // Hi-Hat
      { key: 'C2', duration: '8n', time: '0:1:0' }, // Hi-Hat
      { key: 'D2', duration: '8n', time: '0:2:0' }, // Snare
      { key: 'C2', duration: '8n', time: '0:2:0' }, // Hi-Hat
      { key: 'C2', duration: '8n', time: '0:3:0' }, // Hi-Hat
      // Measure 2
      { key: 'C1', duration: '8n', time: '1:0:0' }, // Kick
      { key: 'C2', duration: '8n', time: '1:0:0' }, // Hi-Hat
      { key: 'C2', duration: '8n', time: '1:1:0' }, // Hi-Hat
      { key: 'D2', duration: '8n', time: '1:2:0' }, // Snare
      { key: 'C2', duration: '8n', time: '1:2:0' }, // Hi-Hat
      { key: 'C2', duration: '8n', time: '1:3:0' }, // Hi-Hat
    ]
  },
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    instrument: 'piano',
    difficulty: 'Beginner',
    tempo: 110,
    imageId: 'lesson-happy-birthday',
    notes: [
        { key: 'C4', time: '0:0:0', duration: '8n' },
        { key: 'C4', time: '0:0:2', duration: '4n' },
        { key: 'D4', time: '0:1:0', duration: '4n' },
        { key: 'C4', time: '0:2:0', duration: '4n' },
        { key: 'F4', time: '0:3:0', duration: '4n' },
        { key: 'E4', time: '1:0:0', duration: '2n' },
        { key: 'C4', time: '1:2:0', duration: '8n' },
        { key: 'C4', time: '1:2:2', duration: '4n' },
        { key: 'D4', time: '1:3:0', duration: '4n' },
        { key: 'C4', time: '2:0:0', duration: '4n' },
        { key: 'G4', time: '2:1:0', duration: '4n' },
        { key: 'F4', time: '2:2:0', duration: '2n' },
        { key: 'C4', time: '3:0:0', duration: '8n' },
        { key: 'C4', time: '3:0:2', duration: '4n' },
        { key: 'C5', time: '3:1:0', duration: '4n' },
        { key: 'A4', time: '3:2:0', duration: '4n' },
        { key: 'F4', time: '3:3:0', duration: '4n' },
        { key: 'E4', time: '4:0:0', duration: '4n' },
        { key: 'D4', time: '4:1:0', duration: '2n' },
        { key: 'A#4', time: '4:3:0', duration: '8n' },
        { key: 'A#4', time: '4:3:2', duration: '4n' },
        { key: 'A4', time: '5:0:0', duration: '4n' },
        { key: 'F4', time: '5:1:0', duration: '4n' },
        { key: 'G4', time: '5:2:0', duration: '4n' },
        { key: 'F4', time: '5:3:0', duration: '2n' }
    ]
  },
  {
    id: 'fur-elise-intro',
    title: 'Für Elise (Intro)',
    instrument: 'piano',
    difficulty: 'Intermediate',
    tempo: 80,
    imageId: 'lesson-fur-elise',
    notes: [
      { key: 'E5', duration: '8n', time: '0:0:0' },
      { key: 'D#5', duration: '8n', time: '0:0:2' },
      { key: 'E5', duration: '8n', time: '0:1:0' },
      { key: 'D#5', duration: '8n', time: '0:1:2' },
      { key: 'E5', duration: '8n', time: '0:2:0' },
      { key: 'B4', duration: '8n', time: '0:2:2' },
      { key: 'D5', duration: '8n', time: '0:3:0' },
      { key: 'C5', duration: '8n', time: '0:3:2' },
      { key: 'A4', duration: '4n', time: '1:0:0' },
    ],
  },
];
