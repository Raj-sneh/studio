
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Store for our sampler/synth instances
const instruments: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
const loadingPromises: Partial<Record<Instrument, Promise<void>>> = {};

const samplerUrls: Record<Instrument, Record<string, string>> = {
    piano: {
        'A0': 'A0.mp3', 'A1': 'A1.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3', 'A6': 'A6.mp3', 'A7': 'A7.mp3',
        'C1': 'C1.mp3', 'C2': 'C2.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C6': 'C6.mp3', 'C7': 'C7.mp3', 'C8': 'C8.mp3',
    },
    // Add other instruments here in the future
    guitar: {},
    drums: {},
    flute: {},
    violin: {},
    saxophone: {},
    xylophone: {},
};

// Use a simple synth as a fallback or default
const getSynth = (instrument: Instrument): Tone.Synth => {
    if (!instruments[instrument] || instruments[instrument]?.disposed) {
        console.log(`Initializing new synth for ${instrument}`);
        const synth = new Tone.Synth().toDestination();
        instruments[instrument] = synth;
        loadingPromises[instrument] = Promise.resolve(); // Synth loads instantly
    }
    return instruments[instrument] as Tone.Synth;
};

const getInstrumentSampler = (instrument: Instrument): Tone.Sampler => {
    if (!instruments[instrument] || instruments[instrument]?.disposed) {
        console.log(`Initializing new sampler for ${instrument}`);
        
        // Default to synth if no sampler URL is found
        if (!samplerUrls[instrument] || Object.keys(samplerUrls[instrument]).length === 0) {
            console.warn(`No sampler URLs for ${instrument}, falling back to synth.`);
            // This is a bit of a type-cast hack, but it allows us to use the same interface
            return getSynth(instrument) as unknown as Tone.Sampler;
        }

        const sampler = new Tone.Sampler({
            urls: samplerUrls[instrument],
            baseUrl: `/samples/${instrument}/`,
            release: 1,
            onload: () => {
                console.log(`${instrument} sampler loaded.`);
            }
        }).toDestination();
        
        instruments[instrument] = sampler;
        loadingPromises[instrument] = Tone.loaded();
    }
    return instruments[instrument] as Tone.Sampler;
};


/**
 * Gets the sampler for a given instrument.
 * @param instrument The instrument to get the sampler for.
 * @returns The Tone.Sampler instance.
 */
export const getSampler = (instrument: Instrument): Tone.Sampler | Tone.Synth => {
    if (typeof window === 'undefined') {
        // Return a mock object on the server to prevent errors
        return {
            triggerAttack: () => {},
            triggerRelease: () => {},
            releaseAll: () => {},
            disposed: false,
            loaded: false,
            toDestination: () => ({
                triggerAttack: () => {},
                triggerRelease: () => {},
            }),
        } as unknown as Tone.Sampler;
    }
    
    // For now, we only have piano samples ready.
    if (instrument === 'piano') {
        return getInstrumentSampler(instrument);
    }
    
    // Fallback to a basic synth for other instruments until we have samples.
    return getSynth(instrument);
};

/**
 * Returns a promise that resolves when all requested instruments have loaded.
 * @returns A promise that resolves when all active loading processes are complete.
 */
export const allSamplersLoaded = (instrument?: Instrument) => {
    if (instrument) {
        if (!loadingPromises[instrument]) {
            getSampler(instrument); // This will create the promise
        }
        return loadingPromises[instrument] || Promise.resolve();
    }
    
    const allPromises = Object.values(loadingPromises);
    return Promise.all(allPromises);
};
