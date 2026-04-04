'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateNotes } from '@/ai/flows/generate-notes-flow';
import type { GenerateNotesOutput, NoteObject } from '@/ai/flows/generate-notes-types';
import { Loader2, Music, Play, StopCircle, BookOpen, ThumbsUp, ThumbsDown, Zap, Send, RefreshCw } from 'lucide-react';
import { getSampler } from '@/lib/samplers';
import type { InstrumentSynth } from '@/lib/samplers';
import NoteDisplay from '@/components/note-display';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const Piano = lazy(() => import('@/components/Piano'));

const MELODY_COST = 5;
const ADMIN_EMAILS = ['snehkumarverma2011@gmail.com'];

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground font-headline uppercase tracking-widest text-[10px] font-black">Neural Calibration...</p>
    </div>
  );
}

export function AIComposer({ initialPrompt, autogen, onGenerate }: { initialPrompt?: string | null; autogen?: boolean; autoplay?: boolean; onGenerate: () => void; }) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [feedbackComment, setFeedbackComment] = useState('');
    const [rating, setRating] = useState<'good' | 'bad' | null>(null);
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);

    const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'generated'>('idle');
    const [mode, setMode] = useState<'idle' | 'demo' | 'learn'>('idle');
    const [statusText, setStatusText] = useState('Describe a tune and I will write it for you.');
    const [generatedMelody, setGeneratedMelody] = useState<GenerateNotesOutput | null>(null);

    const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
    const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
    
    const samplerRef = useRef<InstrumentSynth | null>(null);
    const partRef = useRef<Tone.Part | null>(null);

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
            if (generationState === 'generated') setStatusText('Neural track ready for preview.');
        } catch (e) {
            console.warn("Audio cleanup warning:", e);
        }
    }, [generationState]);

    const handleGeneration = useCallback(async (isReinforced: boolean = false) => {
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
            const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
            
            if (!isAdmin) {
                const creditRes = await fetch('/api/credits/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.uid, amount: MELODY_COST })
                });

                if (!creditRes.ok) {
                    const errData = await creditRes.json().catch(() => ({}));
                    toast({ title: "Insufficient Credits", description: errData.error || "Neural synthesis requires credits.", variant: "destructive" });
                    setGenerationState('idle');
                    return;
                }
            }

            setStatusText(isReinforced ? 'Reinforcing melody...' : 'Thinking of a melody...');
            onGenerate(); 

            const feedback = isReinforced && rating ? {
                previousPrompt: prompt,
                rating,
                comment: feedbackComment,
            } : undefined;

            const result = await generateNotes({ text: prompt, feedback });
            if (!result || !result.notes || result.notes.length === 0) {
                throw new Error('Could not create a tune for this idea.');
            }
            
            setGeneratedMelody(result);
            setGenerationState('generated');
            setStatusText(isReinforced ? 'Refinement complete!' : 'Your tune is ready!');
            setShowFeedbackInput(false);
            setRating(null);
            setFeedbackComment('');

            if (firestore) {
                const historyRef = collection(firestore, 'users', user.uid, 'generatedMelodies');
                const flatNotes = result.notes.map(n => `${Array.isArray(n.key) ? n.key.join('+') : n.key} (${n.duration})`);

                addDocumentNonBlocking(historyRef, {
                    userId: user.uid,
                    title: prompt.substring(0, 30),
                    notes: flatNotes,
                    instrument: 'Piano',
                    generationContext: 'Melody Maker',
                    createdAt: serverTimestamp(),
                });
            }
        } catch (err: any) {
            toast({ title: 'Oops!', description: err.message, variant: 'destructive' });
            setGenerationState('idle');
        }
    }, [prompt, feedbackComment, rating, toast, stopPlayback, onGenerate, user, firestore]);

    const handlePlayDemo = useCallback(async () => {
        if (!generatedMelody) return;
        
        stopPlayback();
        setMode('demo');
        setStatusText('Playing demo...');

        try {
            await Tone.start();
            const sampler = await getSampler('piano');
            samplerRef.current = sampler;
            
            Tone.Transport.bpm.value = generatedMelody.tempo;

            const part = new Tone.Part((time, note) => {
                sampler.triggerAttackRelease(note.key, note.duration, time);
                Tone.Draw.schedule(() => {
                    setHighlightedKeys(Array.isArray(note.key) ? note.key : [note.key]);
                }, time);
            }, sortedNotes).start(0);

            partRef.current = part;

            const lastNote = sortedNotes[sortedNotes.length - 1];
            const duration = lastNote ? Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds() : 5;

            Tone.Transport.scheduleOnce(() => {
                stopPlayback();
            }, duration + 0.5);

            Tone.Transport.start();
        } catch (err) {
            console.error(err);
            stopPlayback();
        }
    }, [generatedMelody, sortedNotes, stopPlayback]);

    const handleStartLearn = useCallback(() => {
        if (!generatedMelody) return;
        stopPlayback();
        setMode('learn');
        setCurrentNoteIndex(0);
        const firstNoteKey = Array.isArray(sortedNotes[0].key) ? sortedNotes[0].key : [sortedNotes[0].key];
        setHighlightedKeys(firstNoteKey);
        setStatusText('Follow the glowing keys...');
        toast({ title: "Learning Mode", description: "Play the highlighted keys on the piano." });
    }, [generatedMelody, sortedNotes, stopPlayback, toast]);

    const handleNoteDown = useCallback((note: string) => {
        if (mode !== 'learn' || currentNoteIndex === null) return;
        
        const currentNote = sortedNotes[currentNoteIndex];
        const currentKeys = Array.isArray(currentNote.key) ? currentNote.key : [currentNote.key];
        
        if (currentKeys.includes(note)) {
            const nextIndex = currentNoteIndex + 1;
            if (nextIndex >= sortedNotes.length) {
                setCurrentNoteIndex(null);
                setMode('idle');
                setHighlightedKeys([]);
                setStatusText('Perfect! You finished the tune.');
                toast({ title: "Lesson Complete!", description: "Great job matching the notes." });
            } else {
                setCurrentNoteIndex(nextIndex);
                const nextKeys = Array.isArray(sortedNotes[nextIndex].key) ? sortedNotes[nextIndex].key : [sortedNotes[nextIndex].key];
                setHighlightedKeys(nextKeys);
            }
        }
    }, [mode, currentNoteIndex, sortedNotes, toast]);

    const handleFeedback = (val: 'good' | 'bad') => {
        setRating(val);
        if (val === 'bad') setShowFeedbackInput(true);
        else {
            toast({ title: "Glad you liked it!", description: "AI learning protocol updated." });
            setShowFeedbackInput(false);
        }
    };

    const lessonNoteStringsForDisplay = useMemo(() => sortedNotes.map(n => Array.isArray(n.key) ? n.key.join('+') : n.key), [sortedNotes]);

    return (
        <Card className="border-primary/10 overflow-hidden bg-card/30 rounded-[2.5rem]">
            <CardContent className="space-y-6 pt-10 px-8 pb-12">
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <Music className="h-3 w-3 text-primary" />
                            Melody Concept
                        </label>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase">
                            <Zap className="h-3 w-3 fill-primary" /> {user?.email && ADMIN_EMAILS.includes(user.email) ? 'Unlimited' : `${MELODY_COST} Credits`}
                        </div>
                    </div>
                    
                    <div className="relative">
                        <Textarea
                            placeholder="e.g., 'A melancholic rainy day tune' or 'Fast happy birthday version'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={generationState === 'loading'}
                            className="min-h-[100px] rounded-3xl bg-muted/20 border-primary/10 focus:border-primary/30 transition-none resize-none p-5 text-sm relative z-10"
                        />
                        <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none -z-10" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                            onClick={() => handleGeneration(false)} 
                            disabled={generationState === 'loading'} 
                            className="flex-1 h-14 rounded-2xl font-black text-md shadow-xl shadow-primary/20"
                        >
                            {generationState === 'loading' ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                            {generationState === 'generated' ? 'Regenerate New' : 'Initialize Composition'}
                        </Button>
                        
                        {generationState === 'generated' && (
                            <div className="flex gap-2">
                                <Button onClick={handlePlayDemo} variant="secondary" className="h-14 px-6 rounded-2xl font-bold">
                                    <Play className="mr-2 h-4 w-4" /> Listen
                                </Button>
                                <Button onClick={handleStartLearn} variant="outline" className="h-14 px-6 rounded-2xl font-bold border-primary/20 hover:bg-primary/5">
                                    <BookOpen className="mr-2 h-4 w-4" /> Learn
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {generationState === 'generated' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-3">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleFeedback('good')}
                                    className={cn("h-8 w-8 p-0 rounded-full", rating === 'good' && "bg-primary/20 text-primary")}
                                >
                                    <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleFeedback('bad')}
                                    className={cn("h-8 w-8 p-0 rounded-full", rating === 'bad' && "bg-destructive/20 text-destructive")}
                                >
                                    <ThumbsDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {showFeedbackInput && (
                            <div className="p-4 rounded-3xl bg-muted/20 border border-destructive/20 space-y-3 animate-in zoom-in-95">
                                <p className="text-[9px] font-black uppercase tracking-widest text-destructive">Reinforcement Protocol Required</p>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="What should I fix? (e.g., 'Make it slower', 'More complex')"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        className="h-10 bg-muted/40 border-none text-xs"
                                    />
                                    <Button size="icon" onClick={() => handleGeneration(true)} className="h-10 w-10 shrink-0">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <NoteDisplay notes={lessonNoteStringsForDisplay} currentNoteIndex={mode === 'learn' ? currentNoteIndex : null} />
                    </div>
                )}

                <div className="flex-1 min-h-[350px] bg-black/40 rounded-[2rem] flex items-center justify-center p-4 mt-4 border border-white/5 shadow-inner group relative">
                    <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                    <Suspense fallback={<InstrumentLoader />}>
                        <Piano 
                            onNoteDown={handleNoteDown}
                            onNoteUp={() => {}}
                            highlightedKeys={highlightedKeys}
                            interactiveMode={mode === 'learn'}
                        />
                    </Suspense>
                </div>
            </CardContent>
        </Card>
    );
}
