
import * as Tone from 'tone';
import type { Instrument } from '@/types';

const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};
const baseUrl = "https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2F";

const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, path: string, release?: number }> = {
    piano: {
        urls: {
            'A0': 'A0.mp3', 'C1': 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3', 'A1': 'A1.mp3',
            'C2': 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', 'A2': 'A2.mp3', 'C3': 'C3.mp3',
            'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3', 'A4': 'A4.mp3', 'C5': 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
            'A5': 'A5.mp3', 'C6': 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3', 'A6': 'A6.mp3',
            'C7': 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3', 'A7': 'A7.mp3', 'C8': 'C8.mp3'
        },
        path: 'piano',
        release: 1
    },
    guitar: {
        urls: {
            'E2': 'E2.mp3', 'A2': 'A2.mp3', 'D3': 'D3.mp3', 'G3': 'G3.mp3', 'B3': 'B3.mp3', 'E4': 'E4.mp3'
        },
        path: 'guitar-acoustic',
        release: 1
    },
    drums: {
        urls: {
            'C4': 'kick.mp3',
            'D4': 'snare.mp3',
            'E4': 'hihat.mp3',
        },
        path: 'drums'
    },
    violin: {
        urls: { 'A3': 'A3.mp3', 'C4': 'C4.mp3', 'E4': 'E4.mp3', 'G4': 'G4.mp3' },
        path: 'violin',
        release: 1
    },
    xylophone: {
        urls: { 'C5': 'C5.mp3' },
        path: 'xylophone',
        release: 1
    },
    flute: {
        urls: { 'C5': 'C5.mp3' },
        path: 'flute',
        release: 1
    },
    saxophone: {
        urls: { 'C5': 'C5.mp3' },
        path: 'saxophone',
        release: 1
    }
};

const initializeSamplers = () => {
    Object.entries(instrumentConfigs).forEach(([instrument, config]) => {
        const sampler = new Tone.Sampler({
            urls: config.urls,
            release: config.release,
            baseUrl: `${baseUrl}${config.path}%2F?alt=media&`,
        }).toDestination();
        samplers[instrument as Instrument] = sampler;
    });
};

// Initialize samplers on module load (client-side)
if (typeof window !== 'undefined') {
    initializeSamplers();
}

export const getSampler = (instrument: Instrument): Tone.Sampler => {
    const sampler = samplers[instrument];
    if (!sampler) {
        throw new Error(`Sampler for instrument "${instrument}" not found.`);
    }
    return sampler;
};

export const allSamplersLoaded = async () => {
    await Tone.loaded();
}

    