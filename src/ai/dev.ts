import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio-flow.ts';
import '@/ai/flows/conversational-flow.ts';
import '@/ai/flows/generate-melody-flow.ts';
