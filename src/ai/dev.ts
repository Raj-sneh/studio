import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-user-performance.ts';
import '@/ai/flows/flag-content-for-review.ts';
import '@/ai/flows/transcribe-audio-flow.ts';
import '@/ai/flows/conversational-flow.ts';
