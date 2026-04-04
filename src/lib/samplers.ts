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
 * Optimized to prevent "Neural Calibration" hangs by using robust loading and fallbacks.
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
            // Ensure audio context is initialized
            if (Tone.context.state !== 'running') {
                // Tone.start() is usually handled by user gesture, 
                // but we prepare the context here.
            }

            let sampler: CachedSampler;

            switch (instrument) {
                case 'piano':
                    // --- REALISTIC ACOUSTIC CHAIN ---
                    
                    // 1. Reverb for Ambience
                    // We use a shorter decay and don't await manual generate() to prevent hangs
                    const reverb = new Tone.Reverb({
                        decay: 2.0,
                        preDelay: 0.01,
                        wet: 0.25
                    }).toDestination();
                    
                    // 2. Compressor for "Body"
                    const compressor = new Tone.Compressor({
                        threshold: -24,
                        ratio: 3,
                        attack: 0.03,
                        release: 0.2
                    }).connect(reverb);

                    // 3. EQ for Warmth
                    const eq = new Tone.EQ3({
                        low: 3,
                        mid: -1,
                        high: -2,
                    }).connect(compressor);

                    // 4. Initialize Sampler with high-fidelity acoustic samples
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
                        release: 1.2,
                        baseUrl: "https://tonejs.github.io/audio/salamander/",
                    }).connect(eq);
                    
                    // Wait for samples to be ready, but with a timeout safety
                    await Promise.race([
                        Tone.loaded(),
                        new Promise(resolve => setTimeout(resolve, 5000)) // 5s timeout safety
                    ]);
                    break;
                
                default:
                    sampler = new Tone.PolySynth(Tone.Synth).toDestination();
                    await Tone.loaded();
                    break;
            }
            
            samplerCache.set(instrument, sampler);
            return sampler;

        } catch (error) {
            console.error(`Failed to load instrument:`, error);
            // Fallback to a basic synth to ensure the keys load and are playable
            const fallback = new Tone.PolySynth(Tone.Synth).toDestination();
            samplerCache.set(instrument, fallback);
            return fallback;
        } finally {
            loadingPromises.delete(instrument);
        }
    })();

    loadingPromises.set(instrument, newPromise);
    return newPromise;
};
