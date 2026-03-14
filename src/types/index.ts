import type { Timestamp } from 'firebase/firestore';

export type LessonNote = {
  key: string | string[]; // Can be a single note or an array for chords
  duration: string; // Tone.js duration, e.g., '8n', '4n'
  time: string; // Tone.js time, e.g. '0:0:1'
};

export type UserPlayedNote = {
  key: string | string[];
  duration: string;
  time: number; // Time in seconds
};

export type Instrument = 'piano';

export type Lesson = {
  id: string;
  title: string;
  instrument: Instrument;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tempo: number;
  notes: LessonNote[];
  imageId: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  dob?: Timestamp;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
};