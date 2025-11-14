export type Note = {
  key: string; // e.g., 'C4'
  duration: string; // Tone.js duration, e.g., '8n', '4n'
  time: number; // time in seconds from the start of the sequence
};

export type Instrument = 'piano' | 'guitar' | 'drums' | 'violin';

export type Lesson = {
  id: string;
  title: string;
  instrument: Instrument;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tempo: number;
  notes: Note[];
  imageId: string;
};
