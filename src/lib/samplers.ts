'use client';

import * as Tone from 'tone';
import type { Instrument } from '@/types';

// --- TYPE DEFINITIONS ---
export type InstrumentSynth = Tone.PolySynth | Tone.Sampler;
export type CachedSampler = InstrumentSynth;

const samplerCache = new Map<Instrument, CachedSampler>();
const loadingPromises = new Map<Instrument, Promise<CachedSampler>>();

/**
 * Checks if a cached instrument is still usable.
 */
export const isSamplerDisposed = (sampler: CachedSampler | undefined): boolean => {
    return !sampler || sampler.disposed;
};

/**
 * Main function to get a virtual instrument.
 * Uses high-quality samples for the Salamander Grand Piano.
 */
export const getSampler = (instrument: Instrument): Promise<CachedSampler> => {
    const cached = samplerCache.get(instrument);

    if (cached && !isSamplerDisposed(cached)) {
        return Promise.resolve(cached);
    }
    
    if (cached && isSamplerDisposed(cached)) {
        samplerCache.delete(instrument);
    }

    const loading = loadingPromises.get(instrument);
    if (loading) {
        return loading;
    }

    const newPromise = (async () => {
        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            let sampler: CachedSampler;

            switch (instrument) {
                case 'piano':
                    // Salamander Grand Piano V3 - Real acoustic sound
                    sampler = new Tone.Sampler({
                        urls: {
                            "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
                            "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
                            "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
                            "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
                            "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
                            "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
                            "A7": "A7.mp3", "C8": "C8.mp3"
                        },
                        release: 1,
                        baseUrl: "https://tonejs.github.io/audio/salamander/",
                    }).toDestination();
                    break;
                
                default:
                    sampler = new Tone.PolySynth(Tone.Synth).toDestination();
                    break;
            }
            
            await Tone.loaded();
            samplerCache.set(instrument, sampler);
            return sampler;

        } catch (error) {
            console.error(`Failed to load instrument:`, error);
            throw error;
        } finally {
            loadingPromises.delete(instrument);
        }
    })();

    loadingPromises.set(instrument, newPromise);
    return newPromise;
};
