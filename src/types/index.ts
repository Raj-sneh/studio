
import type { Timestamp } from 'firebase/firestore';

export type LessonNote = {
  key: string | string[];
  duration: string;
  time: string;
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

export type UserPlan = 'free' | 'creator' | 'pro';

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  credits: number;
  plan: UserPlan;
  lastReset?: Timestamp;
  avatarUrl?: string | null;
  createdAt: Timestamp;
  dob?: Timestamp;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
};
