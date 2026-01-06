import { genkit, type Plugin } from 'genkit';
import { openai } from 'openai';
import 'dotenv/config';

const openAIKey = process.env.OPENAI_API_KEY || 'your_api_key_here';

const plugins: Plugin<any>[] = [
  openai({
    apiKey: openAIKey,
  }),
];

export const ai = genkit({
  plugins,
});
