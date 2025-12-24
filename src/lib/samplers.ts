
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Store for our sampler/synth instances
const instruments: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};
const loadingPromises: Partial<Record<Instrument, Promise<void>>> = {};

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
    // If the instrument exists and is disposed, we must create a new one.
    if (!instruments[instrument] || instruments[instrument]?.disposed) {
        console.log(`Initializing new sampler for ${instrument}`);
        
        if (!samplerUrls[instrument] || Object.keys(samplerUrls[instrument]).length === 0) {
            console.warn(`No sampler URLs for ${instrument}, falling back to synth.`);
            return getSynth(instrument) as unknown as Tone.Sampler;
        }

        const sampler = new Tone.Sampler({
            urls: samplerUrls[instrument],
            baseUrl: baseUrlMap[instrument],
            release: 1,
        }).toDestination();
        
        instruments[instrument] = sampler;
        // The promise for loading is now handled by Tone.loaded() which we await elsewhere
        loadingPromises[instrument] = new Promise(resolve => {
            Tone.loaded().then(() => {
                console.log(`${instrument} sampler loaded.`);
                resolve();
            });
        });
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
            dispose: () => {},
            disposed: false,
            loaded: false,
            toDestination: () => ({
                triggerAttack: () => {},
                triggerRelease: () => {},
            }),
        } as unknown as Tone.Sampler;
    }
    
    if (samplerUrls[instrument] && Object.keys(samplerUrls[instrument]).length > 0) {
        return getInstrumentSampler(instrument);
    }
    
    // Fallback to a basic synth for any other case.
    return getSynth(instrument);
};

/**
 * Returns a promise that resolves when all requested instruments have loaded.
 * @returns A promise that resolves when all active loading processes are complete.
 */
export const allSamplersLoaded = (instrument?: Instrument | Instrument[]) => {
    const instrumentsToLoad = Array.isArray(instrument) ? instrument : (instrument ? [instrument] : Object.keys(loadingPromises) as Instrument[]);
    
    const promises = instrumentsToLoad.map(inst => {
         if (!loadingPromises[inst]) {
            // This will create the promise if it doesn't exist
            getSampler(inst); 
        }
        return loadingPromises[inst] || Promise.resolve();
    });

    return Promise.all(promises);
};
