
export type Note = {
  key: string; // e.g., 'C4'
  duration: string; // Tone.js duration, e.g., '8n', '4n'
  time: string; // Tone.js time, e.g. '0:0:1'
};

export type Instrument = 'piano' | 'guitar' | 'drums';

export type Lesson = {
  id: string;
  title: string;
  instrument: Instrument;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tempo: number;
  notes: Note[];
  imageId: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
};
