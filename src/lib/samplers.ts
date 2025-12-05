
import * as Tone from 'tone';
import type { Instrument } from '@/types';

const samplers: Partial<Record<Instrument, Tone.Sampler>> = {};

const baseUrl = "https://firebasestorage.googleapis.com/v0/b/socio-f6b39.appspot.com/o/";

const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number }> = {
    piano: {
        urls: {
            'A0': 'samples%2Fpiano%2FA0.mp3', 'C1': 'samples%2Fpiano%2FC1.mp3', 'D#1': 'samples%2Fpiano%2FDs1.mp3', 'F#1': 'samples%2Fpiano%2FFs1.mp3', 'A1': 'samples%2Fpiano%2FA1.mp3',
            'C2': 'samples%2Fpiano%2FC2.mp3', 'D#2': 'samples%2Fpiano%2FDs2.mp3', 'F#2': 'samples%2Fpiano%2FFs2.mp3', 'A2': 'samples%2Fpiano%2FA2.mp3', 'C3': 'samples%2Fpiano%2FC3.mp3',
            'D#3': 'samples%2Fpiano%2FDs3.mp3', 'F#3': 'samples%2Fpiano%2FFs3.mp3', 'A3': 'samples%2Fpiano%2FA3.mp3', 'C4': 'samples%2Fpiano%2FC4.mp3', 'D#4': 'samples%2Fpiano%2FDs4.mp3',
            'F#4': 'samples%2Fpiano%2FFs4.mp3', 'A4': 'samples%2Fpiano%2FA4.mp3', 'C5': 'samples%2Fpiano%2FC5.mp3', 'D#5': 'samples%2Fpiano%2FDs5.mp3', 'F#5': 'samples%2Fpiano%2FFs5.mp3',
            'A5': 'samples%2Fpiano%2FA5.mp3', 'C6': 'samples%2Fpiano%2FC6.mp3', 'D#6': 'samples%2Fpiano%2FDs6.mp3', 'F#6': 'samples%2Fpiano%2FFs6.mp3', 'A6': 'samples%2Fpiano%2FA6.mp3',
            'C7': 'samples%2Fpiano%2FC7.mp3', 'D#7': 'samples%2Fpiano%2FDs7.mp3', 'F#7': 'samples%2Fpiano%2FFs7.mp3', 'A7': 'samples%2Fpiano%2FA7.mp3', 'C8': 'samples%2Fpiano%2FC8.mp3'
        },
        release: 1
    },
    guitar: {
        urls: {
            'E2': 'samples%2Fguitar-acoustic%2FE2.mp3', 'A2': 'samples%2Fguitar-acoustic%2FA2.mp3', 'D3': 'samples%2Fguitar-acoustic%2FD3.mp3', 'G3': 'samples%2Fguitar-acoustic%2FG3.mp3', 'B3': 'samples%2Fguitar-acoustic%2FB3.mp3', 'E4': 'samples%2Fguitar-acoustic%2FE4.mp3'
        },
        release: 1
    },
    drums: {
        urls: {
            'C4': 'samples%2Fdrums%2Fkick.mp3',
            'D4': 'samples%2Fdrums%2Fsnare.mp3',
            'E4': 'samples%2Fdrums%2Fhihat.mp3',
        },
    },
    violin: {
        urls: { 
            'A3': 'samples%2Fviolin%2FA3.mp3', 'C4': 'samples%2Fviolin%2FC4.mp3', 'E4': 'samples%2Fviolin%2FE4.mp3', 'G4': 'samples%2Fviolin%2FG4.mp3' 
        },
        release: 1
    },
    xylophone: {
        urls: { 'C5': 'samples%2Fxylophone%2FC5.mp3' },
        release: 1
    },
    flute: {
        urls: { 'C5': 'samples%2Fflute%2FC5.mp3' },
        release: 1
    },
    saxophone: {
        urls: { 'C5': 'samples%2Fsaxophone%2FC5.mp3' },
        release: 1
    }
};

const initializeSamplers = () => {
    Object.entries(instrumentConfigs).forEach(([instrument, config]) => {
        const processedUrls: { [note: string]: string } = {};

        for (const note in config.urls) {
            const path = config.urls[note];
            processedUrls[note] = `${baseUrl}${path}?alt=media`;
        }
        
        const sampler = new Tone.Sampler({
            urls: processedUrls,
            release: config.release,
            onload: () => {
                console.log(`${instrument} samples loaded.`);
            }
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
