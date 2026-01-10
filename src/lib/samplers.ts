
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Centralized cache for loaded samplers
const samplerCache = new Map<Instrument, Tone.Sampler | Tone.Synth>();
const loadingPromises = new Map<Instrument, Promise<Tone.Sampler | Tone.Synth>>();

const samplerUrls: Record<string, Record<string, string>> = {
    piano: {
        A1: "A1.mp3", C2: "C2.mp3", "D#2": "DS2.mp3", "F#2": "FS2.mp3", A2: "A2.mp3", 
        C3: "C3.mp3", "D#3": "DS3.mp3", "F#3": "FS3.mp3", A3: "A3.mp3", C4: "C4.mp3"
    },
    guitar: {
        'F2': 'F2.mp3', 'F#2': 'FS2.mp3', 'G2': 'G2.mp3', 'G#2': 'GS2.mp3', 'A2': 'A2.mp3', 'A#2': 'AS2.mp3', 'B2': 'B2.mp3', 'C3': 'C3.mp3', 'C#3': 'CS3.mp3', 'D3': 'D3.mp3', 'D#3': 'DS3.mp3', 'E3': 'E3.mp3', 'F3': 'F3.mp3', 'F#3': 'FS3.mp3', 'G3': 'G3.mp3', 'G#3': 'GS3.mp3', 'A3': 'A3.mp3', 'A#3': 'AS3.mp3', 'B3': 'B3.mp3', 'C4': 'C4.mp3', 'C#4': 'CS4.mp3', 'D4': 'D4.mp3', 'D#4': 'DS4.mp3', 'E4': 'E4.mp3'
    },
};

const baseUrlMap: Record<string, string> = {
    piano: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/',
    guitar: 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_guitar_nylon-mp3/',
}

/**
 * Creates or retrieves a cached Tone.js instrument.
 * This function is async and handles concurrent requests for the same instrument.
 * @param instrument The instrument to create or retrieve.
 * @returns A promise that resolves with the Tone.Sampler or Tone.Synth instance.
 */
export const getSampler = (instrument: Instrument): Promise<Tone.Sampler | Tone.Synth> => {
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
    const loadingPromise = new Promise<Tone.Sampler | Tone.Synth>((resolve, reject) => {
        if (typeof window === 'undefined') {
            // Mock sampler for server-side rendering
            const mockSampler = {
                triggerAttack: () => {},
                triggerAttackRelease: () => {},
                triggerRelease: () => {},
                releaseAll: () => {},
                dispose: () => {},
                disposed: true,
                loaded: false,
                name: instrument,
            } as unknown as Tone.Sampler;
            samplerCache.set(instrument, mockSampler);
            return resolve(mockSampler);
        }

        const hasUrls = samplerUrls[instrument] && Object.keys(samplerUrls[instrument]).length > 0;
        
        if (hasUrls) {
            try {
                const sampler = new Tone.Sampler({
                    urls: samplerUrls[instrument],
                    baseUrl: baseUrlMap[instrument],
                    release: instrument === 'piano' ? 1.5 : 1,
                    onload: () => {
                        samplerCache.set(instrument, sampler);
                        loadingPromises.delete(instrument); // Clean up promise map
                        resolve(sampler);
                    },
                    onerror: (error) => {
                        console.error(`Error loading sampler for ${instrument}:`, error);
                        loadingPromises.delete(instrument);
                        reject(error);
                    }
                }).toDestination();
            } catch (error) {
                 reject(error);
            }
        } else {
            // Fallback to a basic synth if no samples are defined
            const synth = new Tone.Synth().toDestination();
            samplerCache.set(instrument, synth);
            loadingPromises.delete(instrument);
            resolve(synth);
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
