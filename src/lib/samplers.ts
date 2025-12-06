
import * as Tone from 'tone';
import type { Instrument } from '@/types';
import { firebaseConfig } from '@/firebase/config';

const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};

// This base URL points to the Firebase Storage emulator or live service,
// constructed using the project ID from your Firebase config.
const STORAGE_BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.projectId}.appspot.com/o/`;

const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number, baseUrl: string }> = {
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
        // The base URL for piano samples is a sub-path within storage.
        // It's URL-encoded ('samples/piano' becomes 'samples%2Fpiano').
        baseUrl: `${STORAGE_BASE_URL}samples%2Fpiano%2F`
    }
};

const initializeSamplers = () => {
    if (typeof window === 'undefined') return;

    (Object.keys(instrumentConfigs) as Instrument[]).forEach((instrument) => {
        if (samplers[instrument]) {
            return;
        }

        const config = instrumentConfigs[instrument];
        
        // For each note URL, we must append `?alt=media` to get the raw file data.
        const fullUrls: { [note: string]: string } = {};
        for (const note in config.urls) {
            fullUrls[note] = `${config.urls[note]}?alt=media`;
        }

        const sampler = new Tone.Sampler({
            urls: fullUrls,
            baseUrl: config.baseUrl,
            onload: () => {
                console.log(`${instrument} samples loaded.`);
            }
        }).toDestination();
        
        samplers[instrument] = sampler;
    });
};

// Initialize samplers on module load (client-side)
initializeSamplers();


export const getSampler = (instrument: Instrument): Tone.Sampler => {
    const sampler = samplers[instrument];
    if (!sampler) {
        console.warn(`Sampler for instrument "${instrument}" not found on first call, re-initializing.`);
        initializeSamplers();
        const newSampler = samplers[instrument];
        if(!newSampler) {
             throw new Error(`Sampler for instrument "${instrument}" could not be initialized.`);
        }
        return newSampler;
    }
    return sampler;
};

export const allSamplersLoaded = async () => {
    await Tone.loaded();
}

    