
'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateNotes } from '@/ai/flows/generate-notes-flow';
import type { GenerateNotesOutput, NoteObject } from '@/ai/flows/generate-notes-types';
import { Loader2, Music, Play, StopCircle, BookOpen, RefreshCw, CheckCircle, ThumbsUp, ThumbsDown, History, Zap } from 'lucide-react';
import { getSampler } from '@/lib/samplers';
import type { InstrumentSynth } from '@/lib/samplers';
import NoteDisplay from '@/components/note-display';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const Piano = lazy(() => import('@/components/Piano'));

const HOLD_NOTE_THRESHOLD_MS = 100;
const MELODY_COST = 5;

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground">Warming up the piano...</p>
    </div>
  );
}

export function AIComposer({ initialPrompt, autogen, autoplay, onGenerate }: { initialPrompt?: string | null; autogen?: boolean; autoplay?: boolean; onGenerate: () => void; }) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [feedbackComment, setFeedbackComment] = useState('');

    const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'generated'>('idle');
    const [mode, setMode] = useState<'idle' | 'demo' | 'learn'>('idle');
    const [statusText, setStatusText] = useState('Describe a tune and I will write it for you.');
    const [generatedMelody, setGeneratedMelody] = useState<GenerateNotesOutput | null>(null);

    const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
    const [holdState, setHoldState] = useState<{ key: string; progress: number } | null>(null);
    const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
    
    const samplerRef = useRef<InstrumentSynth | null>(null);
    const partRef = useRef<Tone.Part | null>(null);
    const holdIntervalRef = useRef<any>(null);
    const isHoldingRef = useRef(false);
    const initialAutoRunDone = useRef(false);

    const sortedNotes = useMemo(() => {
        if (!generatedMelody || !generatedMelody.notes) return [];
        try {
          return [...generatedMelody.notes].sort((a, b) => {
            const timeA = a?.time ? Tone.Time(a.time).toSeconds() : 0;
            const timeB = b?.time ? Tone.Time(b.time).toSeconds() : 0;
            return timeA - timeB;
          });
        } catch (e) {
          return generatedMelody.notes;
        }
    }, [generatedMelody]);

    const stopPlayback = useCallback(() => {
        try {
            if (typeof window !== 'undefined' && Tone.Transport.state === 'started') {
                Tone.Transport.stop();
                Tone.Transport.cancel(0);
            }
            if (partRef.current) {
                partRef.current.dispose();
                partRef.current = null;
            }
            
            setHighlightedKeys([]);
            setMode('idle');
            if (generationState === 'generated') setStatusText('Ready to play or learn.');
        } catch (e) {
            console.warn("Audio cleanup warning:", e);
        }
    }, [generationState]);

    const handleGeneration = useCallback(async (isAutoRun: boolean = false, rating?: 'good' | 'bad') => {
        if (!user) {
            toast({ title: 'Sign in required', variant: 'destructive' });
            return;
        }
        if (!prompt.trim()) {
            toast({ title: 'Type something first', variant: 'destructive' });
            return;
        }

        stopPlayback();
        setGenerationState('loading');
        setStatusText('Checking credits...');

        try {
            // 1. SECURE CREDIT CHECK IN BACKEND
            const creditRes = await fetch('http://127.0.0.1:1000/credits/use', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.uid, amount: MELODY_COST })
            });

            if (!creditRes.ok) {
                const errorData = await creditRes.json();
                toast({ title: "Insufficient Credits", description: errorData.error, variant: "destructive" });
                setGenerationState('idle');
                return;
            }

            setStatusText('Thinking of a melody...');
            onGenerate(); 

            const feedback = rating ? {
                previousPrompt: prompt,
                rating,
                comment: feedbackComment,
            } : undefined;

            const result = await generateNotes({ text: prompt, feedback });
            if (!result || !result.notes || result.notes.length === 0) {
                throw new Error('Could not create a tune for this.');
            }
            
            setGeneratedMelody(result);
            setGenerationState('generated');
            setStatusText('Your tune is ready!');

            if (firestore) {
                const historyRef = collection(firestore, 'users', user.uid, 'generatedMelodies');
                addDocumentNonBlocking(historyRef, {
                    userId: user.uid,
                    title: prompt.substring(0, 30),
                    notes: result.notes.map(n => n.key),
                    instrument: 'Piano',
                    generationContext: 'Melody Maker',
                    createdAt: serverTimestamp(),
                });
            }
        } catch (err: any) {
            toast({ title: 'Oops!', description: err.message, variant: 'destructive' });
            setGenerationState('idle');
        }
    }, [prompt, feedbackComment, toast, stopPlayback, onGenerate, user, firestore]);

    const highlightedLearnKeys = currentNote ? [currentNote.key] : [];
    const lessonNoteStringsForDisplay = useMemo(() => sortedNotes.map(n => n.key), [sortedNotes]);

    return (
        <Card className="border-primary/10 overflow-hidden">
            <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prompt Description</label>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                        <Zap className="h-3 w-3 fill-primary" /> {MELODY_COST} Credits
                    </div>
                </div>
                <Textarea
                    placeholder="e.g., 'A happy song' or 'Rainy day tune'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={generationState === 'loading'}
                    className="min-h-[80px] rounded-2xl bg-muted/20 border-primary/5 focus:border-primary/20"
                />
                
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleGeneration(false)} disabled={generationState === 'loading'} className="w-full sm:w-auto h-12 rounded-xl font-bold shadow-xl shadow-primary/10">
                        {generationState === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Music className="mr-2 h-4 w-4" />}
                        Generate
                    </Button>
                </div>

                <div className="text-center p-4 mb-2 border rounded-xl h-16 flex items-center justify-center bg-muted/20 border-primary/5">
                    <p className="text-sm font-bold">
                        <span className="text-muted-foreground italic">{statusText}</span>
                    </p>
                </div>

                {generatedMelody && (
                    <NoteDisplay notes={lessonNoteStringsForDisplay} currentNoteIndex={mode === 'learn' ? currentNoteIndex : null} />
                )}

                <div className="flex-1 min-h-[300px] bg-card rounded-2xl flex items-center justify-center p-4 mt-4 border border-primary/5 shadow-inner">
                    <Suspense fallback={<InstrumentLoader />}>
                        <Piano 
                            onNoteDown={() => {}}
                            onNoteUp={() => {}}
                            highlightedKeys={highlightedKeys}
                            interactiveMode={false}
                        />
                    </Suspense>
                </div>
            </CardContent>
        </Card>
    );
}
