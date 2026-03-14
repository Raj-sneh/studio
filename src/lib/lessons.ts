import type { Lesson } from '@/types';

/**
 * Pruned lessons list to save space.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'twinkle-twinkle-little-star',
    title: 'Twinkle Twinkle',
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
    ],
  },
  {
    id: 'sargam-practice',
    title: 'Sargam Practice',
    instrument: 'piano',
    difficulty: 'Beginner',
    tempo: 100,
    imageId: 'lesson-sargam',
    notes: [
      { key: 'C4', duration: '4n', time: '0:0:0' },
      { key: 'D4', duration: '4n', time: '0:1:0' },
      { key: 'E4', duration: '4n', time: '0:2:0' },
      { key: 'F4', duration: '4n', time: '0:3:0' },
      { key: 'G4', duration: '2n', time: '1:0:0' },
    ],
  },
];
