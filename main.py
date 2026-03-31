'use server';

/**
 * Professional Voice Cloning & Vocal Replacement flows
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

import {
  VoiceCloningInputSchema,
  VoiceCloningOutputSchema,
  type VoiceCloningInput,
  type VoiceCloningOutput,
  CloneSpeechInputSchema,
  CloneSpeechOutputSchema,
  type CloneSpeechInput,
  type CloneSpeechOutput,
  VocalReplacementInputSchema,
  VocalReplacementOutputSchema,
  type VocalReplacementInput,
  type VocalReplacementOutput,
} from './voice-cloning-types';

/* -------------------- CONSTANTS -------------------- */

const DEFAULT_VOICE_MAP: Record<string, string> = {
  clive: 'JBFqnCBsd6RMkjVDRZzb',
  clara: '21m00Tcm4TlvDq8ikWAM',
  james: 'ErXwUjzD4qc0CPByOn9G',
  alex: 'Lcf7eeY9feMlh8o4NoOf',
};

/* -------------------- HELPERS -------------------- */

function getBaseUrl() {
  return (
    process.env.NEURAL_ENGINE_URL ||
    process.env.NEXT_PUBLIC_NEURAL_ENGINE_URL ||
    'http://localhost:8080'
  );
}

async function waitForBackend() {
  const baseUrl = getBaseUrl();

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${baseUrl}/`, { cache: 'no-store' });
      if (res.ok) return true;
    } catch (_) {}

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error('Neural Engine not responding.');
}

/* -------------------- PROMPTS -------------------- */

const analyzeVoicePrompt = ai.definePrompt({
  name: 'analyzeVoicePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: z.object({ sampleDataUri: z.string() }) },
  output: {
    schema: z.object({
      description: z.string(),
      suggestedStability: z.number(),
      suggestedSimilarity: z.number(),
    }),
  },
  prompt: `Analyze this vocal sample and suggest settings. {{media url=sampleDataUri}}`,
});

const enhancePerformancePrompt = ai.definePrompt({
  name: 'enhancePerformancePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: z.object({ text: z.string() }) },
  output: { schema: z.object({ enhancedText: z.string() }) },
  prompt: `Make this text sound natural for speech: {{text}}`,
});

const singerDirectorPrompt = ai.definePrompt({
  name: 'singerDirectorPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: z.object({ vocalDataUri: z.string() }) },
  output: {
    schema: z.object({
      suggestedStability: z.number(),
      suggestedSimilarity: z.number(),
      expressionLevel: z.string(),
    }),
  },
  prompt: `Analyze vocals and suggest speech-to-speech settings.`,
});

/* -------------------- EXPORT FUNCTIONS -------------------- */

export async function cloneVoice(
  input: VoiceCloningInput
): Promise<VoiceCloningOutput> {
  return voiceCloningFlow(input);
}

export async function speakWithClone(
  input: CloneSpeechInput
): Promise<CloneSpeechOutput> {
  return speakWithCloneFlow(input);
}

export async function replaceVocals(
  input: VocalReplacementInput
): Promise<VocalReplacementOutput> {
  return vocalReplacementFlow(input);
}

/* -------------------- FLOWS -------------------- */

const voiceCloningFlow = ai.defineFlow(
  {
    name: 'voiceCloningFlow',
    inputSchema: VoiceCloningInputSchema,
    outputSchema: VoiceCloningOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const analysisRes = await analyzeVoicePrompt({
      sampleDataUri: input.samples[0],
    });

    if (!analysisRes.output) throw new Error('Voice analysis failed');

    const analysis = analysisRes.output;

    const formData = new FormData();
    formData.append('name', input.name);
    formData.append('description', analysis.description);

    input.samples.forEach((sample, i) => {
      const buffer = Buffer.from(sample.split(',')[1], 'base64');
      const blob = new Blob([buffer], { type: 'audio/wav' });
      formData.append('files', blob, `sample_${i}.wav`);
    });

    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.detail?.message || 'Voice cloning failed');
    }

    return {
      voiceId: data.voice_id,
      description: analysis.description,
      suggestedSettings: {
        stability: analysis.suggestedStability,
        similarity_boost: analysis.suggestedSimilarity,
      },
    };
  }
);

const speakWithCloneFlow = ai.defineFlow(
  {
    name: 'speakWithCloneFlow',
    inputSchema: CloneSpeechInputSchema,
    outputSchema: CloneSpeechOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const voiceId =
      DEFAULT_VOICE_MAP[input.voiceId] || input.voiceId;

    const enhanced = await enhancePerformancePrompt({
      text: input.text,
    });

    const text = enhanced.output?.enhancedText || input.text;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: input.settings?.stability ?? 0.5,
            similarity_boost:
              input.settings?.similarity_boost ?? 0.75,
          },
        }),
      }
    );

    if (!res.ok) throw new Error('TTS failed');

    const buffer = Buffer.from(await res.arrayBuffer());

    return {
      audioUri: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
    };
  }
);

const vocalReplacementFlow = ai.defineFlow(
  {
    name: 'vocalReplacementFlow',
    inputSchema: VocalReplacementInputSchema,
    outputSchema: VocalReplacementOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ElevenLabs API key');

    const baseUrl = getBaseUrl();
    await waitForBackend();

    const inputBlob = new Blob([
      Buffer.from(input.audioDataUri.split(',')[1], 'base64'),
    ]);

    const form = new FormData();
    form.append('audio', inputBlob, 'input.wav');

    const sepRes = await fetch(`${baseUrl}/separate`, {
      method: 'POST',
      body: form,
    });

    if (!sepRes.ok) throw new Error('Separation failed');

    const { vocals, bgm } = await sepRes.json();

    const analysisRes = await singerDirectorPrompt({
      vocalDataUri: vocals,
    });

    if (!analysisRes.output) throw new Error('Analysis failed');

    const analysis = analysisRes.output;

    const stsForm = new FormData();
    stsForm.append(
      'audio',
      new Blob([
        Buffer.from(vocals.split(',')[1], 'base64'),
      ]),
      'vocals.wav'
    );

    stsForm.append('model_id', 'eleven_multilingual_sts_v2');

    stsForm.append(
      'voice_settings',
      JSON.stringify({
        stability:
          input.settings?.stability ??
          analysis.suggestedStability,
        similarity_boost:
          input.settings?.similarity_boost ??
          analysis.suggestedSimilarity,
      })
    );

    const voiceId =
      DEFAULT_VOICE_MAP[input.voiceId] || input.voiceId;

    const stsRes = await fetch(
      `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: stsForm,
      }
    );

    if (!stsRes.ok) throw new Error('Voice swap failed');

    const aiVocals = new Blob([
      Buffer.from(await stsRes.arrayBuffer()),
    ]);

    const mixForm = new FormData();
    mixForm.append('vocals', aiVocals);
    mixForm.append(
      'bgm',
      new Blob([
        Buffer.from(bgm.split(',')[1], 'base64'),
      ])
    );

    const mixRes = await fetch(`${baseUrl}/mix`, {
      method: 'POST',
      body: mixForm,
    });

    if (!mixRes.ok) throw new Error('Mixing failed');

    const finalBuffer = Buffer.from(await mixRes.arrayBuffer());

    return {
      audioUri: `data:audio/mpeg;base64,${finalBuffer.toString('base64')}`,
    };
  }
);