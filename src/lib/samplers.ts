
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Centralized cache for loaded samplers
const samplerCache = new Map<Instrument, Tone.PolySynth | Tone.Synth | Tone.PluckSynth>();
const loadingPromises = new Map<Instrument, Promise<Tone.PolySynth | Tone.Synth | Tone.PluckSynth>>();

/**
 * Creates or retrieves a cached Tone.js instrument.
 * This function is async and handles concurrent requests for the same instrument.
 * @param instrument The instrument to create or retrieve.
 * @returns A promise that resolves with the Tone.js instrument instance.
 */
export const getSampler = (instrument: Instrument): Promise<Tone.PolySynth | Tone.Synth | Tone.PluckSynth> => {
    // Return cached sampler if it exists and is not disposed
    const cachedSampler = samplerCache.get(instrument);
    if (cachedSampler && !cachedSampler.disposed) {
        return Promise.resolve(cachedSampler);
    }
    
    // If a loading promise already exists for this instrument, return it
    if (loadingPromises.has(instrument)) {
        return loadingPromises.get(instrument)!;
    }

    // Create a new loading promise
    const loadingPromise = new Promise<Tone.PolySynth | Tone.Synth | Tone.PluckSynth>((resolve, reject) => {
        if (typeof window === 'undefined') {
            // Mock sampler for server-side rendering
            const mockSampler = {
                triggerAttack: () => {},
                triggerAttackRelease: () => {},
                triggerRelease: () => {},
                releaseAll: () => {},
                dispose: () => {},
                disposed: true,
            } as unknown as Tone.PolySynth;
            samplerCache.set(instrument, mockSampler);
            return resolve(mockSampler);
        }

        try {
            let newInstrument: Tone.PolySynth | Tone.Synth | Tone.PluckSynth;

            if (instrument === 'drums') {
                // The DrumKit component handles its own synths, so we provide a mock-like object.
                const mockSynth = {
                    triggerAttackRelease: () => {},
                    dispose: () => {},
                    disposed: false,
                } as unknown as Tone.Synth;
                // Since this is not a PolySynth, we'll cast to any to satisfy the cache type
                samplerCache.set(instrument, mockSynth as any);
                loadingPromises.delete(instrument);
                return resolve(mockSynth);
            }
            
            if (instrument === 'guitar') {
                 newInstrument = new Tone.PluckSynth().toDestination();
            } else { // 'piano' and any other fallback
                 newInstrument = new Tone.Synth().toDestination();
            }

            samplerCache.set(instrument, newInstrument);
            loadingPromises.delete(instrument);
            resolve(newInstrument);

        } catch (error) {
            console.error(`Error creating synth for ${instrument}:`, error);
            loadingPromises.delete(instrument);
            reject(error);
        }
    });

    loadingPromises.set(instrument, loadingPromise);
    return loadingPromise;
};

/**
 * Awaits all currently loading sampler promises.
 * Useful for ensuring all required instruments are loaded before proceeding.
 */
export const allSamplersLoaded = (): Promise<any[]> => {
    const allPromises = Array.from(loadingPromises.values());
    return Promise.all(allPromises);
};
