
'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateNotes } from '@/ai/flows/generate-notes-flow';
import type { GenerateNotesOutput, NoteObject } from '@/ai/flows/generate-notes-types';
import { Loader2, Music, Play, StopCircle, BookOpen, RefreshCw, CheckCircle, ThumbsUp, ThumbsDown, History } from 'lucide-react';
import { getSampler } from '@/lib/samplers';
import type { InstrumentSynth } from '@/lib/samplers';
import NoteDisplay from '@/components/note-display';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const Piano = lazy(() => import('@/components/Piano'));

// Snappier hold threshold to prevent "boring" slow feeling
const HOLD_NOTE_THRESHOLD_MS = 150;

interface AIComposerProps {
  initialPrompt?: string | null;
  autogen?: boolean;
  autoplay?: boolean;
  onGenerate: () => void;
}

function InstrumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground">Warming up the piano...</p>
    </div>
  );
}

export function AIComposer({ initialPrompt, autogen, autoplay, onGenerate }: AIComposerProps) {
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
        if (!generatedMelody) return [];
        return [...generatedMelody.notes].sort((a, b) => Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds());
    }, [generatedMelody]);

    const stopPlayback = useCallback(() => {
        try {
            if (Tone.Transport.state === 'started') {
                Tone.Transport.stop();
                Tone.Transport.cancel(0);
            }
            if (partRef.current) {
                partRef.current.dispose();
                partRef.current = null;
            }
            
            getSampler('piano').then(sampler => {
                if (sampler && !sampler.disposed) {
                    if ('releaseAll' in sampler) {
                        sampler.releaseAll();
                    }
                }
            });
        } catch (e) {
            console.warn("Audio cleanup warning:", e);
        }

        setHighlightedKeys([]);
        setMode('idle');
        if (generationState === 'generated') setStatusText('Ready to play or learn.');
    }, [generationState]);

    useEffect(() => {
      return () => stopPlayback();
    }, [stopPlayback]);
    
    const handlePlayDemo = useCallback(async (melody: GenerateNotesOutput) => {
        stopPlayback();
        await Tone.start();
        setMode('demo');
        setStatusText('Playing the tune...');

        const pianoSampler = await getSampler('piano') as InstrumentSynth;
        samplerRef.current = pianoSampler;
        
        Tone.Transport.bpm.value = melody.tempo;

        const part = new Tone.Part((time, note) => {
            if (samplerRef.current && !samplerRef.current.disposed) {
                samplerRef.current.triggerAttackRelease(note.key, note.duration, time);
            }
            Tone.Draw.schedule(() => {
                setHighlightedKeys([note.key]);
            }, time);
        }, sortedNotes).start(0);
        partRef.current = part;

        const totalDuration = sortedNotes.reduce((max, note) => Math.max(max, Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds()), 0);

        Tone.Transport.scheduleOnce(() => {
            stopPlayback();
            setStatusText('Finished playing.');
        }, totalDuration + 0.5);
        
        Tone.Transport.start();
    }, [stopPlayback, sortedNotes]);

    const handleGeneration = useCallback(async (isAutoRun: boolean = false, rating?: 'good' | 'bad') => {
        if (!prompt.trim()) {
            toast({ title: 'Type something first', variant: 'destructive', description: "Tell me what kind of tune you want." });
            return;
        }
        stopPlayback();
        setGenerationState('loading');
        setGeneratedMelody(null);
        
        const isReinforcing = !!rating;
        setStatusText(isReinforcing ? 'Learning from feedback...' : 'Thinking of a melody...');
        
        try {
            onGenerate(); 
            const feedback = rating ? {
                previousPrompt: prompt,
                rating,
                comment: feedbackComment,
            } : undefined;

            const result = await generateNotes({ text: prompt, feedback });
            if (!result || !result.notes || result.notes.length === 0) {
                throw new Error('Could not create a tune for this. Try another idea.');
            }
            
            setStatusText('Setting up the piano...');
            samplerRef.current = await getSampler('piano') as InstrumentSynth;

            setGeneratedMelody(result);
            setGenerationState('generated');
            setStatusText('Your tune is ready! Play it or learn it.');
            setFeedbackComment('');

            if (user && firestore) {
                const historyRef = collection(firestore, 'users', user.uid, 'generatedMelodies');
                addDocumentNonBlocking(historyRef, {
                    userId: user.uid,
                    title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
                    notes: result.notes.map(n => n.key),
                    instrument: 'Piano',
                    generationContext: 'Melody Maker',
                    createdAt: serverTimestamp(),
                });
            }
            
            if (isAutoRun && autoplay) {
                setTimeout(() => handlePlayDemo(result), 1000);
            }
        } catch (err: any) {
            console.error('AI Composer (Notes) Error:', err);
            toast({ title: 'Oops!', description: err.message, variant: 'destructive' });
            setGenerationState('idle');
            setStatusText("Something didn't go quite right. Let's try again.");
        }
    }, [prompt, feedbackComment, toast, autoplay, stopPlayback, handlePlayDemo, onGenerate, user, firestore]);

    useEffect(() => {
        if (autogen && initialPrompt && !initialAutoRunDone.current) {
            initialAutoRunDone.current = true;
            handleGeneration(true);
        }
    }, [autogen, initialPrompt, handleGeneration]);
    
    const currentNote: NoteObject | null = useMemo(() => {
        if (mode !== 'learn' || currentNoteIndex === null || currentNoteIndex >= sortedNotes.length) {
          return null;
        }
        return sortedNotes[currentNoteIndex];
    }, [mode, currentNoteIndex, sortedNotes]);

    const isHoldNote = useMemo(() => {
        if (!currentNote) return false;
        return Tone.Time(currentNote.duration).toMilliseconds() > HOLD_NOTE_THRESHOLD_MS;
    }, [currentNote]);
    
    useEffect(() => {
        if (mode === 'learn' && currentNoteIndex === null) {
          if (generatedMelody && generatedMelody.notes.length > 0) {
            toast({ title: "Great job!", description: "You played it perfectly! ✨" });
          }
          setMode('idle');
          setStatusText('Well done! Want to try again?');
        }
    }, [currentNoteIndex, mode, generatedMelody, toast]);

    const advanceToNextNote = useCallback(() => {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        isHoldingRef.current = false;
        setHoldState(null);
        setCurrentNoteIndex(prev => (prev === null ? null : (prev + 1 >= sortedNotes.length ? null : prev + 1)));
    }, [sortedNotes.length]);

    const handleNoteDown = useCallback((playedKey: string) => {
        if (mode !== 'learn' || !currentNote) return;

        if (playedKey === currentNote.key) {
            if (isHoldNote) {
                isHoldingRef.current = true;
                const startTime = Date.now();
                const holdDurationMs = Tone.Time(currentNote.duration).toMilliseconds();
                if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
                // Faster 60fps tracking (16ms)
                holdIntervalRef.current = setInterval(() => {
                    const progress = Math.min(100, ((Date.now() - startTime) / holdDurationMs) * 100);
                    setHoldState({ key: currentNote.key, progress });
                    if (progress >= 100) advanceToNextNote();
                }, 16);
            } else {
                advanceToNextNote();
            }
        }
    }, [mode, currentNote, isHoldNote, advanceToNextNote]);

    const handleNoteUp = useCallback((playedKey: string) => {
        if (mode !== 'learn' || !currentNote || !isHoldingRef.current || playedKey !== currentNote.key) return;
        isHoldingRef.current = false;
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        if (holdState && holdState.progress < 100) {
            setHoldState(null);
            toast({ title: "Keep holding!", description: "Wait until the bar is full.", variant: "destructive" });
        }
    }, [mode, currentNote, holdState, toast]);

    const startOrResetLesson = async () => {
        await Tone.start();
        stopPlayback();
        setMode('learn');
        setCurrentNoteIndex(0);
        setHoldState(null);
        isHoldingRef.current = false;
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        toast({ title: 'Ready!', description: 'Play the glowing key to start.' });
        setStatusText('Play the glowing key...');
    };

    const isBusy = generationState === 'loading' || mode === 'demo';
    const hasGenerated = generationState === 'generated';
    const highlightedLearnKeys = currentNote ? [currentNote.key] : [];
    const lessonNoteStringsForDisplay = useMemo(() => sortedNotes.map(n => n.key), [sortedNotes]);

    return (
        <Card>
            <CardContent className="space-y-4 pt-6">
                <Textarea
                    placeholder="e.g., 'A happy song' or 'Rainy day tune'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isBusy}
                    className="min-h-[80px]"
                />
                
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleGeneration(false)} disabled={isBusy || mode === 'learn'} className="w-full sm:w-auto">
                        {generationState === 'loading' ? <Loader2 className="animate-spin mr-2" /> : <Music className="mr-2" />}
                        {generationState === 'loading' ? 'Thinking...' : 'Make Tune'}
                    </Button>
                    <Button onClick={() => handlePlayDemo(generatedMelody!)} disabled={!hasGenerated || isBusy || mode === 'learn'}>
                        <Play className="mr-2" /> Play
                    </Button>
                    <Button onClick={startOrResetLesson} disabled={!hasGenerated || isBusy}>
                        {mode === 'learn' ? <RefreshCw className="mr-2" /> : <BookOpen className="mr-2" />}
                        {mode === 'learn' ? 'Restart' : 'Learn'}
                    </Button>
                    <Button onClick={stopPlayback} disabled={!isBusy && mode === 'idle'} variant="destructive" className="w-full sm:w-auto">
                        <StopCircle className="mr-2" /> Stop
                    </Button>
                </div>

                {hasGenerated && (
                    <div className="space-y-4 border-t pt-4">
                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Reinforcement & Improvement</h4>
                            </div>
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">Tell me what to change for the next version. I will learn from your feedback.</p>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="e.g., 'Fewer high notes' or 'More complex'..." 
                                        value={feedbackComment} 
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        className="flex-1 bg-background/50"
                                        disabled={isBusy}
                                    />
                                    <Button variant="outline" size="icon" onClick={() => handleGeneration(false, 'good')} title="It's good" disabled={isBusy}>
                                        <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleGeneration(false, 'bad')} title="Needs work" disabled={isBusy}>
                                        <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="text-center p-4 mb-2 border rounded-lg h-16 flex items-center justify-center bg-muted/50">
                    <p className="text-lg font-semibold">
                        {mode === 'learn' && currentNote ? (
                            <span className="animate-pulse">Press: {currentNote.key}</span>
                        ) : mode === 'learn' && currentNoteIndex === null && hasGenerated ? (
                             <span className="text-green-500 flex items-center gap-2"><CheckCircle /> Done!</span>
                        ) : (
                            <span className="text-muted-foreground">{statusText}</span>
                        )}
                    </p>
                </div>

                {hasGenerated && (
                    <NoteDisplay notes={lessonNoteStringsForDisplay} currentNoteIndex={mode === 'learn' ? currentNoteIndex : null} />
                )}

                <div className="flex-1 min-h-[300px] md:min-h-[350px] bg-card rounded-lg flex items-center justify-center p-1 md:p-4 mt-4 border shadow-inner">
                    <Suspense fallback={<InstrumentLoader />}>
                        <Piano 
                            onNoteDown={handleNoteDown}
                            onNoteUp={handleNoteUp}
                            highlightedKeys={mode === 'demo' ? highlightedKeys : highlightedLearnKeys}
                            activeKeys={mode === 'learn' ? highlightedLearnKeys : null}
                            disabled={mode !== 'learn'}
                            holdState={mode === 'learn' ? holdState : null}
                            interactiveMode={mode === 'learn'}
                        />
                    </Suspense>
                </div>
            </CardContent>
        </Card>
    );
}
