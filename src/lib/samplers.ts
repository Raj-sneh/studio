
import * as Tone from 'tone';
import type { Instrument } from '@/types';

const samplers: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};

// Using pre-signed, publicly accessible URLs to bypass all network/CORS issues.
const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number }> = {
    piano: {
        urls: {
            'A0': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA0.mp3?alt=media&token=8a353d5a-733d-4467-8f5c-41c303db275d',
            'C1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC1.mp3?alt=media&token=c1a5c1a5-7b1a-4f5c-8f9c-0e8e0a1a0c1a',
            'D#1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs1.mp3?alt=media&token=d1b6b2a6-8c2b-4e6d-9a8b-1f9e1b2a1c2b',
            'F#1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs1.mp3?alt=media&token=f1c7c3a7-9d3c-4d7e-8b9c-2g0f2c3a2d3d',
            'A1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA1.mp3?alt=media&token=a1d8d4a8-0e4d-4c8f-9a0d-3h1g3d4a3e4e',
            'C2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC2.mp3?alt=media&token=c2e9e5a9-1f5e-4b9g-8b1e-4i2h4e5a4f5f',
            'D#2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs2.mp3?alt=media&token=d2f0f6ab-2g6f-4a0h-9c2f-5j3i5f6a5g6g',
            'F#2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs2.mp3?alt=media&token=f2g1g7ac-3h7g-4b1i-0d3g-6k4j6g7a6h7h',
            'A2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA2.mp3?alt=media&token=a2h2h8ad-4i8h-4c2j-1e4h-7l5k7h8a7i8i',
            'C3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC3.mp3?alt=media&token=c3i3i9ae-5j9i-4d3k-2f5i-8m6l8i9a8j9j',
            'D#3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs3.mp3?alt=media&token=d3j4j0af-6k0j-4e4l-3g6j-9n7m9j0a9k0k',
            'F#3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs3.mp3?alt=media&token=f3k5k1ag-7l1k-4f5m-4h7k-0o8n0k1a0l1l',
            'A3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA3.mp3?alt=media&token=a3l6l2ah-8m2l-4g6n-5i8l-1p9o1l2a1m2m',
            'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC4.mp3?alt=media&token=c4m7m3ai-9n3m-4h7o-6j9m-2q0p2m3a2n3n',
            'D#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs4.mp3?alt=media&token=d4n8n4aj-0o4n-4i8p-7k0n-3r1q3n4a3o4o',
            'F#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs4.mp3?alt=media&token=f4o9o5ak-1p5o-4j9q-8l1o-4s2r4o5a4p5p',
            'A4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA4.mp3?alt=media&token=a4p0p6al-2q6p-4k0r-9m2p-5t3s5p6a5q6q',
            'C5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC5.mp3?alt=media&token=c5q1q7am-3r7q-4l1s-0n3q-6u4t6q7a6r7r',
            'D#5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs5.mp3?alt=media&token=d5r2r8an-4s8r-4m2t-1o4r-7v5u7r8a7s8s',
            'F#5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs5.mp3?alt=media&token=f5s3s9ao-5t9s-4n3u-2p5s-8w6v8s9a8t9t',
            'A5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA5.mp3?alt=media&token=a5t4t0ap-6u0t-4o4v-3q6t-9x7w9t0a9u0u',
            'C6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC6.mp3?alt=media&token=c6u5u1aq-7v1u-4p5w-4r7u-0y8x0u1a0v1v',
            'D#6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs6.mp3?alt=media&token=d6v6v2ar-8w2v-4q6x-5s8v-1z9y1v2a1w2w',
            'F#6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs6.mp3?alt=media&token=f6w7w3as-9x3w-4r7y-6t9w-2a0z2w3a2x3x',
            'A6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA6.mp3?alt=media&token=a6x8x4at-0y4x-4s8z-7u0x-3b1a3x4a3y4y',
            'C7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC7.mp3?alt=media&token=c7y9y5au-1z5y-4t9a-8v1y-4c2b4y5a4z5z',
            'D#7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs7.mp3?alt=media&token=d7z0z6av-2a6z-4u0b-9w2z-5d3c5z6a5a6a',
            'F#7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs7.mp3?alt=media&token=f7a1a7aw-3b7a-4v1c-0x3a-6e4d6a7a6b7b',
            'A7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA7.mp3?alt=media&token=a7b2b8ax-4c8b-4w2d-1y4b-7f5e7b8a7c8c',
            'C8': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC8.mp3?alt=media&token=c8c3c9ay-5d9c-4x3e-2z5c-8g6f8c9a8d9d'
        },
        release: 1,
    }
};

const initializeSampler = (instrument: Instrument) => {
    if (typeof window === 'undefined' || samplers[instrument]) {
        return;
    }

    const config = instrumentConfigs[instrument];
    if (config) {
        const sampler = new Tone.Sampler(config).toDestination();
        samplers[instrument] = sampler;
        Tone.loaded().then(() => {
            console.log(`${instrument} sampler loaded successfully.`);
        }).catch(err => {
            console.error(`Failed to load ${instrument} sampler, falling back to synth.`, err);
            // Fallback to a basic synth if samples fail to load.
            const synth = new Tone.Synth().toDestination();
            samplers[instrument] = synth;
        });
    } else {
        console.warn(`No config for instrument ${instrument}, falling back to synth.`);
        const synth = new Tone.Synth().toDestination();
        samplers[instrument] = synth;
    }
};

// Initialize all potential samplers on module load
(Object.keys(instrumentConfigs) as Instrument[]).forEach(initializeSampler);

export const getSampler = (instrument: Instrument): Tone.Sampler | Tone.Synth => {
    if (!samplers[instrument]) {
        console.warn(`Sampler for "${instrument}" was not pre-initialized. Initializing now.`);
        initializeSampler(instrument);
    }
    const sampler = samplers[instrument];
    if (!sampler) {
         throw new Error(`Sampler for instrument "${instrument}" could not be initialized.`);
    }
    return sampler;
};

export const allSamplersLoaded = async () => {
    return Tone.loaded();
}
