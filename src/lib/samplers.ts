
import * as Tone from 'tone';
import type { Instrument } from '@/types';

const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};

// Using Tone.js's own sample library on GitHub for reliability.
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Tonejs/audio/main/salamander/';

const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number }> = {
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
    },
    guitar: {
        urls: {
            'E2': 'E2.mp3', 'A2': 'A2.mp3', 'D3': 'D3.mp3', 'G3': 'G3.mp3',
            'B3': 'B3.mp3', 'E4': 'E4.mp3', 'F#4': 'Fs4.mp3', 'G#3': 'Gs3.mp3',
            'C3': 'C3.mp3', 'F#3': 'Fs3.mp3', 'B2': 'B2.mp3'
        },
        release: 1,
    },
    drums: { // Drums will use simple oscillators for now as Tone doesn't have a drum sampler in the same format.
        urls: {},
    },
    violin: {
        urls: {
            'A3': 'A3.mp3', 'C4': 'C4.mp3', 'E4': 'E4.mp3', 'G4': 'G4.mp3',
            'B3': 'B3.mp3', 'D4': 'D4.mp3', 'F#4': 'Fs4.mp3'
        },
        release: 1,
    },
    xylophone: {
        urls: {
            'C4': 'C4.mp3', 'D4': 'D4.mp3', 'E4': 'E4.mp3', 'F4': 'F4.mp3',
            'G4': 'G4.mp3', 'A4': 'A4.mp3', 'B4': 'B4.mp3', 'C5': 'C5.mp3'
        },
        release: 1,
    },
    flute: {
        urls: { 'C4': 'C4.mp3', 'D4': 'D4.mp3', 'E4': 'E4.mp3' },
        release: 1,
    },
    saxophone: {
        urls: { 'C#5': 'Cs5.mp3', 'B4': 'B4.mp3', 'A4': 'A4.mp3', 'G#4': 'Gs4.mp3' },
        release: 1,
    }
};

const initializeSamplers = () => {
    (Object.keys(instrumentConfigs) as Instrument[]).forEach((instrument) => {
        if (samplers[instrument]) {
            return;
        }

        const config = instrumentConfigs[instrument];

        // Handle drums separately with a synth
        if (instrument === 'drums') {
             const drumSampler = new Tone.Sampler({
                urls: {
                    'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2Fkick.mp3?alt=media&token=6ea6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
                    'D4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2Fsnare.mp3?alt=media&token=7fa6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
                    'E4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2Fhihat.mp3?alt=media&token=80a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
                },
                onload: () => console.log('Drum samples loaded.'),
            }).toDestination();
            samplers.drums = drumSampler;
            return;
        }

        const sampler = new Tone.Sampler({
            urls: config.urls,
            release: config.release,
            baseUrl: GITHUB_BASE_URL,
            onload: () => {
                console.log(`${instrument} samples loaded.`);
            }
        }).toDestination();
        
        samplers[instrument] = sampler;
    });
};

// Initialize samplers on module load (client-side)
if (typeof window !== 'undefined') {
    initializeSamplers();
}

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
