
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Store for our sampler/synth instances
const instruments: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
const loadingPromises: Partial<Record<Instrument, Promise<void>>> = {};

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

/**
 * Gets the synth for a given instrument.
 * For now, all instruments will use a basic synth to ensure stability and speed.
 * @param instrument The instrument to get the synth for.
 * @returns The Tone.Synth instance.
 */
export const getSampler = (instrument: Instrument): Tone.Synth => {
    // Avoid running on the server
    if (typeof window === 'undefined') {
        // Return a mock object on the server to prevent errors
        return {
            triggerAttack: () => {},
            triggerRelease: () => {},
            toDestination: () => ({
                triggerAttack: () => {},
                triggerRelease: () => {},
            }),
        } as unknown as Tone.Synth;
    }
    return getSynth(instrument);
};

/**
 * Returns a promise that resolves when all requested instruments have loaded.
 * Since we are using synths, this resolves immediately.
 * @returns A promise that resolves when all active loading processes are complete.
 */
export const allSamplersLoaded = (instrument: Instrument) => {
    if (!loadingPromises[instrument]) {
        getSampler(instrument); // This will create the promise
    }
    return loadingPromises[instrument] || Promise.resolve();
};
