
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Store for our sampler/synth instances
const instruments: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
const loadingPromises: Partial<Record<Instrument, Promise<Tone.Sampler | Tone.Synth>>> = {};

const samplerUrls: Record<string, Record<string, string>> = {
    piano: {
        A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", A5: "A5.mp3", C6: "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", A6: "A6.mp3", C7: "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", A7: "A7.mp3", C8: "C8.mp3"
    },
    guitar: {
        A2: "A2.mp3", C3: "C3.mp3", E3: "E3.mp3", "G#3": "Gs3.mp3",
        A3: "A3.mp3", C4: "C4.mp3", E4: "E4.mp3", "G#4": "Gs4.mp3",
        A4: "A4.mp3", C5: "C5.mp3",
    },
    flute: {
        A4: "A4.mp3", C4: "C4.mp3", E5: "E5.mp3", A5: "A5.mp3"
    },
    saxophone: {
        'A#3': 'As3.mp3', C4: 'C4.mp3', D5: 'D5.mp3', 'F#4': 'Fs4.mp3'
    },
    violin: {
        A3: "A3.mp3", C4: "C4.mp3", E4: "E4.mp3", G4: "G4.mp3",
        A4: "A4.mp3", C5: "C5.mp3", E5: "E5.mp3", G5: "G5.mp3"
    },
    xylophone: {
        C4: "C4.mp3", G4: "G4.mp3", C5: "C5.mp3", G5: "G5.mp3",
        C6: "C6.mp3", G6: "G6.mp3", C7: "C7.mp3", G7: "G7.mp3"
    },
    drums: {
        C4: 'kick.mp3', D4: 'snare.mp3', E4: 'hihat.mp3'
    }
};

const baseUrlMap: Record<string, string> = {
    piano: 'https://tonejs.github.io/audio/salamander/',
    guitar: 'https://tonejs.github.io/audio/guitar-acoustic/',
    flute: 'https://tonejs.github.io/audio/flute/',
    saxophone: 'https://tonejs.github.io/audio/saxophone/',
    violin: 'https://tonejs.github.io/audio/violin/',
    xylophone: 'https://tonejs.github.io/audio/xylophone/',
    drums: 'https://tonejs.github.io/audio/drum-samples/CR78/'
}


/**
 * Gets the sampler for a given instrument. It handles creating, caching,
 * and re-creating samplers if they have been disposed. This is now an async function
 * that resolves with the loaded instrument.
 * @param instrument The instrument to get the sampler for.
 * @returns A promise that resolves with the Tone.Sampler or Tone.Synth instance.
 */
export const getSampler = async (instrument: Instrument): Promise<Tone.Sampler | Tone.Synth> => {
    if (typeof window === 'undefined') {
        // Return a mock object on the server to prevent errors during SSR
        return {
            triggerAttack: () => {},
            triggerRelease: () => {},
            releaseAll: () => {},
            dispose: () => {},
            disposed: false,
            loaded: false,
        } as unknown as Tone.Sampler;
    }

    // If a loading promise is already in flight for this instrument, await it.
    if (loadingPromises[instrument]) {
        return loadingPromises[instrument]!;
    }

    // If a valid, non-disposed instrument already exists, return it.
    if (instruments[instrument] && !instruments[instrument]?.disposed) {
        return instruments[instrument]!;
    }
    
    const hasUrls = samplerUrls[instrument] && Object.keys(samplerUrls[instrument]).length > 0;
    
    // Create and store a new loading promise. This prevents multiple concurrent loads for the same instrument.
    const loadingPromise = new Promise<Tone.Sampler | Tone.Synth>((resolve) => {
        if (hasUrls) {
            const newSampler = new Tone.Sampler({
                urls: samplerUrls[instrument],
                baseUrl: baseUrlMap[instrument],
                release: 1,
                // The 'onload' callback is the correct way to know when the sampler is ready.
                onload: () => {
                    instruments[instrument] = newSampler;
                    resolve(newSampler);
                }
            }).toDestination();
        } else {
            console.warn(`No sampler URLs for ${instrument}, falling back to synth.`);
            // A synth doesn't need to load, so it's ready immediately.
            const newSynth = new Tone.Synth().toDestination();
            instruments[instrument] = newSynth;
            resolve(newSynth); // Resolve immediately for synth
        }
    });

    loadingPromises[instrument] = loadingPromise;
    
    try {
      // Await the newly created promise.
      const loadedInstrument = await loadingPromise;
      return loadedInstrument;
    } finally {
      // Clear the promise from the map once it's resolved or rejected.
      delete loadingPromises[instrument];
    }
};
