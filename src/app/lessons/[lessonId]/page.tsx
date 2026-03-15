'use client';

import { useState, useEffect, useCallback, lazy, Suspense, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle, ChevronLeft, RefreshCw, Play, BookOpen, StopCircle } from 'lucide-react';
import { LESSONS } from '@/lib/lessons';
import type { Instrument, LessonNote } from '@/types';
import { useToast } from '@/hooks/use-toast';
import NoteDisplay from '@/components/note-display';
import { getSampler, type CachedSampler } from '@/lib/samplers';

const Piano = lazy(() => import('@/components/Piano'));

function InstrumentLoader({ instrument }: { instrument?: Instrument }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground capitalize">
        {instrument ? `Getting the ${instrument} ready...` : 'Loading piano...'}
      </p>
    </div>
  );
}

// Ultra-snappy settings for high-performance feedback
const HOLD_NOTE_THRESHOLD_MS = 150;

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [lesson, setLesson] = useState(LESSONS[0]);
  const [isClient, setIsClient] = useState(false);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);

  const [lessonMode, setLessonMode] = useState<'idle' | 'learn' | 'playing_demo' | 'finished'>('idle');
  const [statusText, setStatusText] = useState('Pick a mode to start!');

  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [holdState, setHoldState] = useState<{ key: string, progress: number } | null>(null);
  const [isLessonStarted, setIsLessonStarted] = useState(false);
  const [currentlyPressedChordKeys, setCurrentlyPressedChordKeys] = useState(new Set<string>());
  const [highlightedPlayKeys, setHighlightedPlayKeys] = useState<string[]>([]);
  
  const samplersRef = useRef<Partial<Record<Instrument, CachedSampler>>>({});
  const partsRef = useRef<Tone.Part[]>([]);
  const holdIntervalRef = useRef<any>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
    const lessonId = params.lessonId as string;
    const foundLesson = LESSONS.find(l => l.id === lessonId);
    if (foundLesson) {
      setLesson(foundLesson);
    } else {
      router.push('/lessons');
    }
  }, [params.lessonId, router]);

  const sortedNotes = useMemo(() => {
    if (!lesson) return [];
    return [...lesson.notes].sort((a, b) => Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds());
  }, [lesson]);

  const stopPlayback = useCallback((newMode: 'idle' | 'learn' | 'playing_demo' | 'finished' = 'idle') => {
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    partsRef.current.forEach(part => {
        if (part && !part.disposed) part.dispose();
    });
    partsRef.current = [];
    
    Object.values(samplersRef.current).forEach(sampler => {
        if (sampler instanceof Tone.Sampler || sampler instanceof Tone.PolySynth) {
            if (!sampler.disposed) sampler.releaseAll();
        }
    });

    setHighlightedPlayKeys([]);
    setLessonMode(newMode);
    if(newMode === 'idle') setStatusText('Ready for another round?');
  }, []);

  useEffect(() => {
      return () => {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        stopPlayback();
      }
  }, [stopPlayback]);

  const handlePlayDemo = useCallback(async () => {
    if (!lesson) return;
    
    setIsLessonStarted(false);
    setCurrentNoteIndex(null);
    stopPlayback('playing_demo');

    try {
        await Tone.start();
        setLessonMode('playing_demo');
        setStatusText('Loading real sounds...');

        const sampler = await getSampler(lesson.instrument);
        samplersRef.current[lesson.instrument] = sampler;
        
        Tone.Transport.bpm.value = lesson.tempo;

        const part = new Tone.Part((time, note) => {
            const synth = sampler as (Tone.Sampler | Tone.PolySynth);
            if (!synth.disposed) synth.triggerAttackRelease(note.key, note.duration, time);
            
            Tone.Draw.schedule(() => {
                setHighlightedPlayKeys(Array.isArray(note.key) ? note.key : [note.key]);
            }, time);
        }, sortedNotes).start(0);

        partsRef.current.push(part);

        const totalDuration = sortedNotes.reduce((max, note) => Math.max(max, Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds()), 0);

        Tone.Transport.scheduleOnce(() => {
            stopPlayback('idle');
            setStatusText('Demo finished.');
        }, totalDuration + 0.5);
        
        setStatusText('Watching the demo...');
        Tone.Transport.start();

    } catch (error) {
        console.error('Playback Error:', error);
        toast({ title: 'Oops!', description: 'Could not load the sounds right now.', variant: 'destructive' });
        stopPlayback('idle');
    }
  }, [lesson, sortedNotes, stopPlayback, toast]);

  const currentNote: LessonNote | null = useMemo(() => {
    if (lessonMode !== 'learn' || !isLessonStarted || currentNoteIndex === null || currentNoteIndex >= sortedNotes.length) {
      return null;
    }
    return sortedNotes[currentNoteIndex];
  }, [lessonMode, isLessonStarted, currentNoteIndex, sortedNotes]);
  
  const isHoldNote = useMemo(() => {
    if (!currentNote) return false;
    return Tone.Time(currentNote.duration).toMilliseconds() > HOLD_NOTE_THRESHOLD_MS;
  }, [currentNote]);

  useEffect(() => {
    if (lessonMode === 'learn' && currentNoteIndex === null && isLessonStarted) {
      toast({ title: "Great job!", description: "You played it perfectly! ✨" });
      setLessonMode('finished');
      setIsLessonStarted(false);
      setStatusText('Lesson complete! Try another one?');
    }
  }, [currentNoteIndex, isLessonStarted, lessonMode, toast]);

  useEffect(() => {
      if (lessonMode === 'learn') setCurrentlyPressedChordKeys(new Set());
  }, [currentNoteIndex, lessonMode]);
  
  const advanceToNextNote = useCallback(() => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    isHoldingRef.current = false;
    setHoldState(null);

    setCurrentNoteIndex(prevIndex => {
      if (prevIndex === null) return null;
      const nextIndex = prevIndex + 1;
      return nextIndex >= sortedNotes.length ? null : nextIndex;
    });
  }, [sortedNotes.length]);

  const handleNoteDown = useCallback((playedKey: string) => {
    if (lessonMode !== 'learn' || !currentNote) return;
    const correctKeys = Array.isArray(currentNote.key) ? currentNote.key : [currentNote.key];
    if (!correctKeys.includes(playedKey)) return;

    if (correctKeys.length > 1) {
        const newPressedKeys = new Set(currentlyPressedChordKeys).add(playedKey);
        setCurrentlyPressedChordKeys(newPressedKeys);
        if (correctKeys.every(k => newPressedKeys.has(k))) {
            advanceToNextNote();
        }
    } else {
        if (isHoldNote) {
            isHoldingRef.current = true;
            const startTime = Date.now();
            const holdDurationMs = Tone.Time(currentNote.duration).toMilliseconds();
            if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
            // Ultra-snappy 60fps tracking (16ms)
            holdIntervalRef.current = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(100, (elapsedTime / holdDurationMs) * 100);
                setHoldState({ key: currentNote.key as string, progress });
                if (progress >= 100) advanceToNextNote();
            }, 16);
        } else {
            advanceToNextNote();
        }
    }
  }, [lessonMode, currentNote, isHoldNote, advanceToNextNote, currentlyPressedChordKeys]);

  const handleNoteUp = useCallback((playedKey: string) => {
    if (lessonMode !== 'learn' || !currentNote || !isHoldingRef.current) return;
    const correctKeys = Array.isArray(currentNote.key) ? currentNote.key : [currentNote.key];

    if (correctKeys.length === 1 && playedKey === correctKeys[0]) {
      isHoldingRef.current = false;
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      if (holdState && holdState.progress < 100) {
        setHoldState(null);
        toast({ title: "Keep holding!", description: "Hold until the bar is full.", variant: "destructive" });
      }
    }
  }, [lessonMode, currentNote, holdState, toast]);

  const startOrResetLesson = () => {
    setIsLessonStarted(true);
    setCurrentNoteIndex(0);
    setHoldState(null);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    isHoldingRef.current = false;
    toast({ title: 'Ready!', description: 'Play the glowing key to start.' });
    setStatusText('Follow the glowing keys...');
    setLessonMode('learn');
  };
  
  const handleStartLearn = () => {
      stopPlayback('learn');
      startOrResetLesson();
  };
  
  const handleStopDemo = () => {
      stopPlayback('idle');
      setStatusText('Stopped.');
  };

  const InstrumentComponent = isClient ? Piano : null;
  const lessonNoteStringsForDisplay = useMemo(() => sortedNotes.map(n => Array.isArray(n.key) ? n.key.join(' + ') : n.key), [sortedNotes]);
  const highlightedKeysForLearn = currentNote?.key ? (Array.isArray(currentNote.key) ? currentNote.key : [currentNote.key]) : [];
  
  return (
    <div className="flex flex-col h-full gap-6">
      <Button variant="ghost" onClick={() => router.push('/lessons')} className="self-start">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lessons
      </Button>

      <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">{lesson.title}</CardTitle>
              <CardDescription>Grand Piano | Speed: {lesson.tempo}bpm</CardDescription>
              <Badge variant="secondary" className="w-fit">{lesson.difficulty}</Badge>
            </CardHeader>
             <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={handlePlayDemo} disabled={lessonMode === 'playing_demo'}>
                        <Play className="mr-2 h-4 w-4"/> Play Demo
                    </Button>
                    <Button onClick={handleStartLearn} disabled={lessonMode === 'playing_demo'}>
                       <BookOpen className="mr-2 h-4 w-4"/> Start Learning
                    </Button>
                </div>
                {lessonMode === 'playing_demo' && (
                  <Button onClick={handleStopDemo} variant="destructive" className="w-full mt-4">
                      <StopCircle className="mr-2 h-4 w-4"/> Stop Demo
                  </Button>
                )}
                 {(lessonMode === 'learn' || lessonMode === 'finished') && (
                  <Button onClick={handleStartLearn} className="w-full mt-4">
                      <RefreshCw className="mr-2 h-4 w-4"/> Restart Lesson
                  </Button>
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center p-4 mb-2 border rounded-lg h-16 flex items-center justify-center bg-muted/50">
                     <p className="text-lg font-semibold">
                         {lessonMode === 'learn' && isLessonStarted && currentNote ? (
                             <span className="animate-pulse">{isHoldNote ? 'Press and Hold:' : 'Press:'} {Array.isArray(currentNote.key) ? currentNote.key.join(' + ') : currentNote.key}</span>
                         ) : (
                             <span className="text-muted-foreground">{statusText}</span>
                         )}
                     </p>
                </div>
                 {isClient && (
                    <NoteDisplay notes={lessonNoteStringsForDisplay} currentNoteIndex={lessonMode === 'learn' ? currentNoteIndex : null} />
                 )}
            </CardContent>
          </Card>
      </div>

      <div className="flex-1 min-h-[350px]">
          <Card className="h-full flex items-center justify-center p-1 md:p-4">
            {!isClient || !InstrumentComponent ? (
              <InstrumentLoader instrument={lesson.instrument} />
            ) : (
              <Suspense fallback={<InstrumentLoader instrument={lesson.instrument} />}>
                <InstrumentComponent 
                  onNoteDown={handleNoteDown}
                  onNoteUp={handleNoteUp}
                  highlightedKeys={lessonMode === 'learn' ? highlightedKeysForLearn : highlightedPlayKeys}
                  activeKeys={lessonMode === 'learn' && isLessonStarted ? highlightedKeysForLearn : null}
                  disabled={lessonMode !== 'learn' || !isLessonStarted}
                  holdState={lessonMode === 'learn' ? holdState : null}
                  interactiveMode={lessonMode === 'learn'}
                />
              </Suspense>
            )}
          </Card>
      </div>
      
      <div className="mt-auto pt-4 flex justify-center">
        <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setIsReportMenuOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4" /> Report an issue
        </Button>
      </div>
      
      <Dialog open={isReportMenuOpen} onOpenChange={setIsReportMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Something wrong?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => setIsReportMenuOpen(false)}>Incorrect Notes</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setIsReportMenuOpen(false)}>Audio Glitches</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setIsReportMenuOpen(false)}>Other</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
