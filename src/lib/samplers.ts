
import * as Tone from 'tone';
import type { Instrument } from '@/types';

// Centralized cache for loaded samplers
const samplerCache = new Map<Instrument, Tone.Sampler | Tone.Synth>();

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
 * Creates or retrieves a cached Tone.js instrument.
 * This function is async and resolves with the loaded instrument.
 * It ensures that an instrument is loaded only once.
 * @param instrument The instrument to create or retrieve.
 * @returns A promise that resolves with the Tone.Sampler or Tone.Synth instance.
 */
export const getSampler = (instrument: Instrument): Promise<Tone.Sampler | Tone.Synth> => {
    return new Promise((resolve) => {
        // Return cached sampler if it exists and is not disposed
        const cachedSampler = samplerCache.get(instrument);
        if (cachedSampler && !cachedSampler.disposed) {
            return resolve(cachedSampler);
        }

        if (typeof window === 'undefined') {
            const mockSampler = {
                triggerAttack: () => {},
                triggerRelease: () => {},
                releaseAll: () => {},
                dispose: () => {},
                disposed: true,
                loaded: false,
            } as unknown as Tone.Sampler;
            samplerCache.set(instrument, mockSampler);
            return resolve(mockSampler);
        }

        const hasUrls = samplerUrls[instrument] && Object.keys(samplerUrls[instrument]).length > 0;
        
        if (hasUrls) {
            const sampler = new Tone.Sampler({
                urls: samplerUrls[instrument],
                baseUrl: baseUrlMap[instrument],
                release: 1,
                onload: () => {
                    samplerCache.set(instrument, sampler);
                    resolve(sampler);
                }
            }).toDestination();
        } else {
            const synth = new Tone.Synth().toDestination();
            samplerCache.set(instrument, synth);
            resolve(synth);
        }
    });
};
