
import * as Tone from 'tone';
import type { Instrument } from '@/types';

const samplers: Partial<Record<Instrument, Tone.Sampler | Tone.Synth>> = {};

// Using pre-signed, publicly accessible URLs to bypass all network/CORS issues.
const instrumentConfigs: Record<Instrument, { urls: { [note: string]: string }, release?: number, baseUrl?: string }> = {
    piano: {
        urls: {
            'A0': 'A0.mp3',
            'C1': 'C1.mp3',
            'D#1': 'Ds1.mp3',
            'F#1': 'Fs1.mp3',
            'A1': 'A1.mp3',
            'C2': 'C2.mp3',
            'D#2': 'Ds2.mp3',
            'F#2': 'Fs2.mp3',
            'A2': 'A2.mp3',
            'C3': 'C3.mp3',
            'D#3': 'Ds3.mp3',
            'F#3': 'Fs3.mp3',
            'A3': 'A3.mp3',
            'C4': 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            'A4': 'A4.mp3',
            'C5': 'C5.mp3',
            'D#5': 'Ds5.mp3',
            'F#5': 'Fs5.mp3',
            'A5': 'A5.mp3',
            'C6': 'C6.mp3',
            'D#6': 'Ds6.mp3',
            'F#6': 'Fs6.mp3',
            'A6': 'A6.mp3',
            'C7': 'C7.mp3',
            'D#7': 'Ds7.mp3',
            'F#7': 'Fs7.mp3',
            'A7': 'A7.mp3',
            'C8': 'C8.mp3'
        },
        release: 1,
        baseUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-4164192500-5d49e.appspot.com/o/samples%2Fpiano%2F?alt=media&prefix=A',
    }
};

const initializeSampler = (instrument: Instrument) => {
    if (typeof window === 'undefined') return;

    if (samplers[instrument]) {
        // If a sampler instance exists, ensure it's not disposed and is loaded.
        const sampler = samplers[instrument];
        if (sampler && !sampler.disposed && (sampler instanceof Tone.Synth || sampler.loaded)) {
             return;
        }
    }
    
    const config = instrumentConfigs[instrument];
    if (config) {
        console.log(`Initializing ${instrument} sampler...`);
        const sampler = new Tone.Sampler(config).toDestination();
        samplers[instrument] = sampler;

        Tone.loaded().then(() => {
            console.log(`${instrument} sampler loaded successfully.`);
        }).catch(err => {
            console.error(`Failed to load ${instrument} sampler, falling back to synth.`, err);
            // Dispose the failed sampler and replace it with a fallback
            samplers[instrument]?.dispose();
            const synth = new Tone.Synth().toDestination();
            samplers[instrument] = synth;
        });
    } else {
        console.warn(`No config for instrument ${instrument}, falling back to synth.`);
        if (!samplers[instrument] || samplers[instrument]?.disposed) {
            const synth = new Tone.Synth().toDestination();
            samplers[instrument] = synth;
        }
    }
};

// Initialize all potential samplers on module load
if (typeof window !== 'undefined') {
    (Object.keys(instrumentConfigs) as Instrument[]).forEach(initializeSampler);
}


export const getSampler = (instrument: Instrument): Tone.Sampler | Tone.Synth => {
    if (!samplers[instrument] || samplers[instrument]?.disposed) {
        console.warn(`Sampler for "${instrument}" was not pre-initialized or was disposed. Initializing now.`);
        initializeSampler(instrument);
    }
    const sampler = samplers[instrument];
    if (!sampler) {
         // This should theoretically not be reached if initializeSampler works correctly
         console.error(`Fallback to synth because sampler for instrument "${instrument}" could not be initialized.`);
         const synth = new Tone.Synth().toDestination();
         samplers[instrument] = synth;
         return synth;
    }
    return sampler;
};

export const allSamplersLoaded = async () => {
    return Tone.loaded();
}
