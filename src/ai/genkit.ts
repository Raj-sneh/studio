
import { genkit, type GenkitErrorCode } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// This is a workaround for a known issue with the Google GenAI plugin.
// It prevents the app from crashing when the plugin is initialized.
// For more context, see: https://github.com/firebase/genkit/issues/1126
function isStructuredError(err: any): err is {
  __isStructuredError: true;
  code: GenkitErrorCode;
  message: string;
} {
  return err && err.__isStructuredError;
}

process.on('unhandledRejection', (reason, promise) => {
  if (isStructuredError(reason) && reason.code === 'aborted') {
    // Suppress the 'aborted' error.
    return;
  }
  // For all other unhandled rejections, log them as usual.
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // Log metadata and streams in development.
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  // Prevent excessive logging in production.
  enableTracing: process.env.NODE_ENV === 'development',
});
