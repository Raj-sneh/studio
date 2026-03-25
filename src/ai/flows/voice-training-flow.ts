'use server';
/**
 * @fileOverview A flow to generate a single, expressive script for voice cloning training.
 * Optimized for high-quality neural capture for the SKV AI engine across multiple languages.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TrainingScriptOutputSchema = z.object({
  script: z.string().describe('A single, expressive paragraph of 30-40 words for voice recording.'),
});

/**
 * Generates a medium-length, phonetically rich paragraph for training in a specific language.
 * Includes a robust fallback to ensure the UI never fails if the LLM is busy.
 */
export async function generateTrainingParagraph(language: string = "English"): Promise<string> {
  const fallbacks: Record<string, string> = {
    "English": "Music is a journey that starts with a single note. I am so excited to explore the infinite possibilities of sound, but I also find peace in the quiet moments between the melodies. Do you feel it too?",
    "Hindi": "संगीत एक ऐसी यात्रा है जो एक सुर से शुरू होती है। मैं ध्वनि की अनंत संभावनाओं को खोजने के लिए बहुत उत्साहित हूं, और मुझे धुनों के बीच के शांत पलों में शांति मिलती है।",
    "Spanish": "La música es un viaje que comienza con una sola nota. Estoy muy emocionado de explorar las infinitas posibilidades del sonido, pero también encuentro paz en los momentos de silencio.",
    "French": "La musique est un voyage qui commence par une seule note. Je suis tellement excité d'explorer les possibilités infinies du son, mais je trouve aussi la paix dans les moments de calme.",
    "German": "Musik ist eine Reise, die mit einer einzigen Note beginnt. Ich freue mich darauf, die unendlichen Möglichkeiten des Klangs zu erkunden, finde aber auch Frieden in den stillen Momenten.",
  };

  const fallbackScript = fallbacks[language] || fallbacks["English"];
  
  try {
    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Generate a single, highly expressive and phonetically diverse paragraph of approximately 35 words in ${language}. The paragraph should be engaging and include various emotional tones (e.g., excitement, calm, and curiosity) to provide a rich voice sample for high-quality neural cloning.`,
      output: { schema: TrainingScriptOutputSchema },
      config: {
        temperature: 0.8,
      }
    });

    return result.output?.script || fallbackScript;
  } catch (error) {
    console.error("SKV AI Training Script Generation Error:", error);
    return fallbackScript;
  }
}
