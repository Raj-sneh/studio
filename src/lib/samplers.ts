
import * as Tone from 'tone';
import type { Instrument } from '@/types';

const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};

const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number }> = {
    piano: {
        urls: {
            'A0': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA0.mp3?alt=media&token=8a353d5a-733d-4467-8f5c-41c303db275d',
            'C1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC1.mp3?alt=media&token=9d0b6b0c-99c5-4c07-b28e-49b01584285e',
            'D#1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs1.mp3?alt=media&token=5b0946c1-39c4-42f9-905b-8d19504c57b8',
            'F#1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs1.mp3?alt=media&token=885d5f2f-cce2-4753-8323-0994f9e30907',
            'A1': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA1.mp3?alt=media&token=3b5c4f2f-5b8d-4f1b-8f3a-9c7a5051a83a',
            'C2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC2.mp3?alt=media&token=381a17b0-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'D#2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs2.mp3?alt=media&token=1d4b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'F#2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs2.mp3?alt=media&token=2d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'A2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA2.mp3?alt=media&token=4d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'C3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC3.mp3?alt=media&token=5d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'D#3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs3.mp3?alt=media&token=6d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'F#3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs3.mp3?alt=media&token=7d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'A3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA3.mp3?alt=media&token=8d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC4.mp3?alt=media&token=9d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'D#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs4.mp3?alt=media&token=ad7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'F#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs4.mp3?alt=media&token=bd7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'A4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA4.mp3?alt=media&token=cd7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'C5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC5.mp3?alt=media&token=dd7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'D#5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs5.mp3?alt=media&token=ed7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'F#5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs5.mp3?alt=media&token=fd7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'A5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA5.mp3?alt=media&token=0d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4e',
            'C6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC6.mp3?alt=media&token=1d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'D#6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs6.mp3?alt=media&token=2d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'F#6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs6.mp3?alt=media&token=3d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'A6': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA6.mp3?alt=media&token=4d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'C7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC7.mp3?alt=media&token=5d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'D#7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FDs7.mp3?alt=media&token=6d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'F#7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FFs7.mp3?alt=media&token=7d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'A7': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FA7.mp3?alt=media&token=8d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f',
            'C8': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fpiano%2FC8.mp3?alt=media&token=9d7b6a1c-8f9f-4f8e-8b1a-9f5e5a2a0c4f'
        },
        release: 1
    },
    guitar: {
        urls: {
            'E2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FE2.mp3?alt=media&token=2f3a6121-547a-4f5c-9394-4d8ab6e83a73',
            'A2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FA2.mp3?alt=media&token=b3a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'D3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FD3.mp3?alt=media&token=c4a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'G3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FG3.mp3?alt=media&token=d5a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'B3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FB3.mp3?alt=media&token=e6a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'E4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FE4.mp3?alt=media&token=f7a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'F#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FFs4.mp3?alt=media&token=08a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'G#3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FGs3.mp3?alt=media&token=19a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'C3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FC3.mp3?alt=media&token=2aa6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'F#3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FFs3.mp3?alt=media&token=3ba6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'B2': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fguitar-acoustic%2FB2.mp3?alt=media&token=4ca6a978-4a6b-4325-9d30-4e2b0d3e5e6f'
        },
        release: 1
    },
    drums: {
        urls: {
            'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2Fkick.mp3?alt=media&token=5da6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'D4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2Fsnare.mp3?alt=media&token=6ea6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'E4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fdrums%2Fhihat.mp3?alt=media&token=7fa6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
        },
    },
    violin: {
        urls: { 
            'A3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FA3.mp3?alt=media&token=80a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FC4.mp3?alt=media&token=91a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'E4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FE4.mp3?alt=media&token=a2a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'G4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FG4.mp3?alt=media&token=b3a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'B3': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FB3.mp3?alt=media&token=c4a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'D4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FD4.mp3?alt=media&token=d5a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'F#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fviolin%2FFs4.mp3?alt=media&token=e6a6a978-4a6b-4325-9d30-4e2b0d3e5e6f'
        },
        release: 1
    },
    xylophone: {
        urls: {
            'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FC4.mp3?alt=media&token=f7a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'D4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FD4.mp3?alt=media&token=08a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'E4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FE4.mp3?alt=media&token=19a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'F4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FF4.mp3?alt=media&token=2aa6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'G4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FG4.mp3?alt=media&token=3ba6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'A4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FA4.mp3?alt=media&token=4ca6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'B4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FB4.mp3?alt=media&token=5da6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'C5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fxylophone%2FC5.mp3?alt=media&token=6ea6a978-4a6b-4325-9d30-4e2b0d3e5e6f'
        },
        release: 1
    },
    flute: {
        urls: {
            'C4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fflute%2FC4.mp3?alt=media&token=7fa6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'D4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fflute%2FD4.mp3?alt=media&token=80a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'E4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fflute%2FE4.mp3?alt=media&token=91a6a978-4a6b-4325-9d30-4e2b0d3e5e6f'
        },
        release: 1
    },
    saxophone: {
        urls: {
            'C#5': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fsaxophone%2FCs5.mp3?alt=media&token=a2a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'B4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fsaxophone%2FB4.mp3?alt=media&token=b3a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'A4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fsaxophone%2FA4.mp3?alt=media&token=c4a6a978-4a6b-4325-9d30-4e2b0d3e5e6f',
            'G#4': 'https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/samples%2Fsaxophone%2FGs4.mp3?alt=media&token=d5a6a978-4a6b-4325-9d30-4e2b0d3e5e6f'
        },
        release: 1
    }
};

const initializeSamplers = () => {
    (Object.keys(instrumentConfigs) as Instrument[]).forEach((instrument) => {
        if (samplers[instrument]) {
            return;
        }

        const config = instrumentConfigs[instrument];
        
        const sampler = new Tone.Sampler({
            urls: config.urls,
            release: config.release,
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
        // This is a fallback for development/HMR, should not happen in production if initialized correctly.
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

    