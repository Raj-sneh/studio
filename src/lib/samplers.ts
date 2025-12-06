
import * as Tone from 'tone';
import type { Instrument } from '@/types';
import { firebaseConfig } from '@/firebase/config';

const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};

const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number, path: string }> = {
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
        path: 'samples/piano/'
    }
};

const initializeSamplers = () => {
    if (typeof window === 'undefined') return;

    const storageBucket = firebaseConfig.projectId + '.appspot.com';

    (Object.keys(instrumentConfigs) as Instrument[]).forEach((instrument) => {
        if (samplers[instrument]) {
            return;
        }

        const config = instrumentConfigs[instrument];
        
        const urlsWithFullPath = Object.keys(config.urls).reduce((acc, note) => {
            const fileName = config.urls[note];
            const encodedPath = encodeURIComponent(config.path + fileName);
            // Construct the full URL for Firebase Storage
            acc[note] = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media`;
            return acc;
        }, {} as { [note: string]: string });


        const sampler = new Tone.Sampler({
            urls: urlsWithFullPath,
            release: config.release,
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
