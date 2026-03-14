'use server';
/**
 * @fileOverview A flow for making a full song (vocals + music) from lyrics using Gemini 2.5 Flash.
 */
import { ai } from '@/ai/genkit';
import { generateArrangement } from './generate-arrangement-flow';
import { textToSpeechFlow } from './text-to-speech-flow';
import { GenerateSongInputSchema, GenerateSongOutputSchema, type GenerateSongInput, type GenerateSongOutput } from './lyrics-to-music-types';
import { z } from 'zod';

// A simple tool to create a title for the song
const generateTitlePrompt = ai.definePrompt({
    name: 'generateSongTitlePrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: z.object({ lyrics: z.string() }) },
    output: { schema: z.object({ title: z.string().describe('A creative, short title for a song with the given lyrics.') }) },
    prompt: `Based on the following lyrics, come up with a short, creative song title.\n\nLyrics:\n{{{lyrics}}}\n\nReturn only the JSON object with the title.`,
});

/**
 * Main function to make a song from lyrics.
 */
export async function generateSong(input: GenerateSongInput): Promise<GenerateSongOutput> {
  try {
    return await generateSongFlow(input);
  } catch (error: any) {
    console.error("Song making error:", error);
    throw new Error(error.message || "I couldn't finish your song. Please try again.");
  }
}

const generateSongFlow = ai.defineFlow(
  {
    name: 'generateSongFlow',
    inputSchema: GenerateSongInputSchema,
    outputSchema: GenerateSongOutputSchema,
  },
  async ({ lyrics, vocalStyle, selectedVoices, instruments, feedback }) => {
    const arrangementInput: any = { 
      prompt: `Music for these lyrics using ONLY the piano.\n\nLyrics:\n${lyrics}` 
    };
    
    if (feedback) {
      arrangementInput.feedback = {
        prompt: `Previous lyrics: ${lyrics}`,
        rating: feedback.rating,
        reason: feedback.comment
      };
    }

    const [arrangement, titleResult] = await Promise.all([
      generateArrangement(arrangementInput),
      generateTitlePrompt({ lyrics }),
    ]);

    if (!arrangement || !arrangement.notes || arrangement.notes.length === 0) {
      throw new Error("I couldn't create the background music.");
    }
    
    let songTitle = "My New Song"; 
    if (titleResult.output && typeof titleResult.output.title === 'string' && titleResult.output.title) {
        songTitle = titleResult.output.title;
    }

    const vocals = await textToSpeechFlow({
        text: lyrics,
        voice: vocalStyle,
        sing: true,
        rate: 'medium',
    });

    if (!vocals || !vocals.media) {
        throw new Error("I couldn't record the singer.");
    }

    return {
        tempo: arrangement.tempo,
        notes: arrangement.notes,
        vocalAudioUri: vocals.media,
        title: songTitle,
    };
  }
);
