
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Store for our sampler instances and their loading promises
const samplers: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
const loadingPromises: Partial<Record<Instrument, Promise<void>>> = {};

// Configuration for each instrument's samples
const instrumentConfigs: Partial<Record<Instrument, { urls: { [note: string]: string }, release?: number, baseUrl?: string }>> = {
    piano: {
        urls: {
            'A0': 'A0.mp3', 'C1': 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
            'A1': 'A1.mp3', 'C2': 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
            'A2': 'A2.mp3', 'C3': 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
            'A3': 'A3.mp3', 'C4': 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
            'A4': 'A4.mp3', 'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
            'A5': 'A5.mp3', 'C6': 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
            'A6': 'A6.mp3', 'C7': 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
            'A7': 'A7.mp3', 'C8': 'C8.mp3'
        },
        release: 1,
        baseUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-4164192500-5d49e.appspot.com/o/samples%2Fpiano%2F',
    },
    // Other instruments can be configured here
};

/**
 * Initializes a sampler for a given instrument. This function is called by getSampler
 * if the sampler hasn't been initialized yet.
 * @param instrument The instrument to initialize.
 */
const initializeSampler = (instrument: Instrument) => {
    // Avoid running on the server
    if (typeof window === 'undefined') return;

    // If a loading promise already exists, we are already in the process of loading.
    if (loadingPromises[instrument]) {
        return;
    }

    const config = instrumentConfigs[instrument];

    if (config && config.baseUrl) {
        // This promise will be stored and reused to avoid re-initializing.
        loadingPromises[instrument] = new Promise((resolve, reject) => {
            try {
                const fullUrls: { [note: string]: string } = {};
                for (const note in config.urls) {
                    const fileName = config.urls[note];
                    fullUrls[note] = `${config.baseUrl}${encodeURIComponent(fileName)}?alt=media`;
                }

                const sampler = new Tone.Sampler({
                    urls: fullUrls,
                    release: config.release,
                    onload: () => {
                        console.log(`${instrument} sampler loaded successfully.`);
                        samplers[instrument] = sampler;
                        resolve();
                    }
                }).toDestination();
            } catch (err) {
                 console.error(`Failed to load sampler for ${instrument}:`, err);
                // Fallback to a synth to avoid crashing the app
                samplers[instrument] = new Tone.Synth().toDestination();
                reject(err); // Reject the promise to signal failure
            }
        });

    } else {
        // If no sample configuration exists, fallback to a simple synth immediately.
        console.warn(`No sample config for instrument ${instrument}, falling back to synth.`);
        if (!samplers[instrument] || samplers[instrument]?.disposed) {
            samplers[instrument] = new Tone.Synth().toDestination();
        }
        loadingPromises[instrument] = Promise.resolve();
    }
};

/**
 * Gets the sampler for a given instrument.
 * If the sampler is not yet initialized, it will trigger initialization.
 * @param instrument The instrument to get the sampler for.
 * @returns The Tone.Sampler or Tone.Synth instance.
 */
export const getSampler = (instrument: Instrument): Tone.Sampler | Tone.Synth => {
    // Initialize the sampler if it hasn't been started yet.
    if (!loadingPromises[instrument]) {
        initializeSampler(instrument);
    }

    // Return the existing sampler instance if available, otherwise a fallback synth.
    return samplers[instrument] || new Tone.Synth().toDestination();
};


/**
 * Returns a promise that resolves when all requested samplers have loaded.
 * It now dynamically checks only for samplers that have been requested.
 * @returns A promise that resolves when all active loading processes are complete.
 */
export const allSamplersLoaded = async () => {
    // Wait only for the promises that have actually been created.
    const activePromises = Object.values(loadingPromises).filter(p => p !== undefined) as Promise<void>[];
    return Promise.all(activePromises);
}
