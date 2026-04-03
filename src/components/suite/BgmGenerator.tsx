'use client';

import { useState, useRef, Suspense, lazy, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, 
    Upload, 
    Music, 
    Play, 
    StopCircle, 
    Zap, 
    BrainCircuit, 
    CheckCircle2,
    Trash2,
    Volume2
} from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { generateBgm } from '@/ai/flows/generate-bgm-flow';
import type { GenerateBgmOutput } from '@/ai/flows/generate-bgm-types';
import { getSampler } from '@/lib/samplers';
import NoteDisplay from '@/components/note-display';

const Piano = lazy(() => import('@/components/Piano'));

const BGM_COST = 10;
const MAX_FILE_SIZE_MB = 5;
const ADMIN_EMAIL = 'snehkumarverma2011@gmail.com';

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground text-xs uppercase font-black tracking-widest">Tuning Neural Piano...</p>
    </div>
  );
}

export function BgmGenerator() {
    const { user } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [vocalData, setVocalData] = useState<{ uri: string; name: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<GenerateBgmOutput | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
    
    const partRef = useRef<Tone.Part | null>(null);
    const vocalAudioRef = useRef<HTMLAudioElement | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast({ title: "File too large", description: `Max ${MAX_FILE_SIZE_MB}MB allowed.`, variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setVocalData({ uri: reader.result as string, name: file.name });
            setResult(null);
            stopPlayback();
        };
        reader.readAsDataURL(file);
    };

    const stopPlayback = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        Tone.Transport.stop();
        Tone.Transport.cancel();
        
        if (partRef.current) {
            partRef.current.dispose();
            partRef.current = null;
        }

        if (vocalAudioRef.current) {
            vocalAudioRef.current.pause();
            vocalAudioRef.current.currentTime = 0;
        }

        setIsPlaying(false);
        setHighlightedKeys([]);
    }, []);

    const handleGenerate = async () => {
        if (!user || !vocalData) return;

        setIsGenerating(true);
        stopPlayback();

        try {
            const isAdmin = user.email === ADMIN_EMAIL;

            if (!isAdmin) {
                const creditRes = await fetch('/api/credits/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.uid, amount: BGM_COST })
                });

                if (!creditRes.ok) {
                    const err = await creditRes.json();
                    throw new Error(err.error || "Insufficient credits.");
                }
            }

            const output = await generateBgm({ vocalAudioUri: vocalData.uri });
            setResult(output);
            toast({ title: "BGM Composed!", description: "AI has synchronized a piano track." });

            if (firestore) {
                const flatNotes = output.notes.map(n => {
                    const keyString = Array.isArray(n.key) ? n.key.join('+') : n.key;
                    return `${keyString} @ ${n.time}`;
                });
                
                addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'generatedMelodies'), {
                    userId: user.uid,
                    title: `BGM for ${vocalData.name}`,
                    notes: flatNotes,
                    instrument: 'piano',
                    generationContext: 'BGM Composer',
                    createdAt: serverTimestamp(),
                });
            }
        } catch (e: any) {
            toast({ title: "Composition Failed", description: e.message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlay = async () => {
        if (!result) return;

        try {
            await Tone.start();
            const sampler = await getSampler('piano');
            
            stopPlayback();
            setIsPlaying(true);

            Tone.Transport.bpm.value = result.tempo;

            const part = new Tone.Part((time, note) => {
                sampler.triggerAttackRelease(note.key, note.duration, time);
                Tone.Draw.schedule(() => {
                    setHighlightedKeys(Array.isArray(note.key) ? note.key : [note.key]);
                }, time);
            }, result.notes).start(0);

            partRef.current = part;

            if (vocalAudioRef.current) {
                vocalAudioRef.current.play();
            }

            const lastNote = result.notes[result.notes.length - 1];
            const duration = lastNote ? Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds() : 10;

            Tone.Transport.scheduleOnce(() => {
                stopPlayback();
            }, duration + 1);

            Tone.Transport.start();
        } catch (e) {
            console.error(e);
            stopPlayback();
        }
    };

    const sortedNoteStrings = useMemo(() => {
        if (!result) return [];
        return result.notes.map(n => Array.isArray(n.key) ? n.key.join('+') : n.key);
    }, [result]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="border-primary/10 bg-card/30 rounded-[2rem] overflow-hidden">
                <CardHeader className="text-center pt-10">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Music className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-headline font-bold">BGM Composer</CardTitle>
                    <CardDescription className="max-w-md mx-auto text-xs italic">
                        Upload your vocal recording and let AI compose a perfectly synced piano background.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {!vocalData ? (
                        <div 
                            className="border-2 border-dashed border-primary/20 rounded-3xl p-16 text-center bg-muted/10 transition-all hover:bg-primary/5 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                            <Upload className="h-12 w-12 text-primary mx-auto mb-4 transition-transform group-hover:-translate-y-1" />
                            <p className="font-bold text-sm">Drop your vocal recording here</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Max 5MB • MP3/WAV</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <Volume2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="truncate max-w-[200px]">
                                        <p className="text-sm font-bold truncate">{vocalData.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Vocal Source Ready</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setVocalData(null); setResult(null); stopPlayback(); }} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <audio ref={vocalAudioRef} src={vocalData.uri} className="hidden" />

                            <Button 
                                onClick={handleGenerate} 
                                disabled={isGenerating} 
                                className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Composing Neural BGM...</>
                                ) : (
                                    <><BrainCircuit className="mr-2 h-6 w-6" /> Compose Background Track ({user?.email === ADMIN_EMAIL ? 'Unlimited' : `${BGM_COST} Credits`})</>
                                )}
                            </Button>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold uppercase tracking-tight">Sync Complete • {result.tempo} BPM</p>
                                    <p className="text-[10px] text-muted-foreground italic">{result.analysis}</p>
                                </div>
                                <Button onClick={isPlaying ? stopPlayback : handlePlay} variant="default" size="sm" className="rounded-full px-6">
                                    {isPlaying ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                                    {isPlaying ? "Stop" : "Listen"}
                                </Button>
                            </div>

                            <NoteDisplay notes={sortedNoteStrings} currentNoteIndex={null} />

                            <div className="min-h-[250px] bg-muted/20 rounded-3xl p-4 border border-primary/5 flex items-center justify-center">
                                <Suspense fallback={<InstrumentLoader />}>
                                    <Piano highlightedKeys={highlightedKeys} disabled />
                                </Suspense>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
