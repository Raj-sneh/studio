
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// This file is now a simple factory for creating new instrument instances.
// The complex caching logic has been removed to favor component-level state management, which is more robust.

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
 * Creates a new Tone.js instrument (Sampler or Synth).
 * This function is async and resolves with the loaded instrument.
 * It ALWAYS creates a new instance.
 * @param instrument The instrument to create.
 * @returns A promise that resolves with the new Tone.Sampler or Tone.Synth instance.
 */
export const createSampler = (instrument: Instrument): Promise<Tone.Sampler | Tone.Synth> => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') {
            // On the server, return a mock object immediately.
            return resolve({
                triggerAttack: () => {},
                triggerRelease: () => {},
                releaseAll: () => {},
                dispose: () => {},
                disposed: true,
                loaded: false,
            } as unknown as Tone.Sampler);
        }

        const hasUrls = samplerUrls[instrument] && Object.keys(samplerUrls[instrument]).length > 0;
        
        if (hasUrls) {
            const sampler = new Tone.Sampler({
                urls: samplerUrls[instrument],
                baseUrl: baseUrlMap[instrument],
                release: 1,
                onload: () => {
                    resolve(sampler); // Resolve the promise when loading is complete
                }
            }).toDestination();
        } else {
            // If no samples are available, fall back to a basic synth.
            const synth = new Tone.Synth().toDestination();
            resolve(synth); // A synth is ready immediately.
        }
    });
};
