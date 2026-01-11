
'use client';

import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Play, AlertCircle, ChevronLeft, User, Star, Repeat } from 'lucide-react';
import { LESSONS } from '@/lib/lessons';
import type { Note, Instrument } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Piano = lazy(() => import('@/components/Piano'));
const Guitar = lazy(() => import('@/components/Guitar'));

const instrumentComponents: Record<Instrument, React.ElementType> = {
    piano: Piano,
    guitar: Guitar,
    drums: lazy(() => import('@/components/DrumKit')),
};

type Mode = 'idle' | 'demo' | 'playing' | 'results';

function InstrumentLoader({ instrument }: { instrument?: Instrument }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="mt-4 text-muted-foreground capitalize">
        {instrument ? `Warming up the ${instrument}...` : 'Loading instrument...'}
      </p>
    </div>
  );
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const [lesson, setLesson] = useState(LESSONS[0]);
  const [mode, setMode] = useState<Mode>('idle');
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [userPlayedNotes, setUserPlayedNotes] = useState<Note[]>([]);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  const playbackSamplerRef = useRef<Tone.Sampler | null>(null);
  const partRef = useRef<Tone.Part | null>(null);

  useEffect(() => {
    const lessonId = params.lessonId as string;
    const foundLesson = LESSONS.find(l => l.id === lessonId);
    if (foundLesson) {
      setLesson(foundLesson);
    } else {
      router.push('/lessons');
    }
  }, [params.lessonId, router]);

  const stopAllActivity = useCallback(() => {
    if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
    }
    partRef.current?.dispose();
    setHighlightedKeys([]);
     if(playbackSamplerRef.current && 'releaseAll' in playbackSamplerRef.current) {
        playbackSamplerRef.current.releaseAll();
    }
  }, []);

  useEffect(() => {
    let active = true;
    setIsInstrumentReady(false); 
    stopAllActivity();
    
    // This loads the high-quality sampler for piano demos.
    // Other instruments use synths created on-the-fly for demos.
    const loadSampler = async () => {
        if (lesson.instrument === 'piano') {
             try {
                // Dispose of previous sampler if it exists
                playbackSamplerRef.current?.dispose();

                const sampler = new Tone.Sampler({
                    urls: { C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", A4: "A4.mp3" },
                    release: 1,
                    baseUrl: "https://tonejs.github.io/audio/salamander/",
                }).toDestination();
                
                await Tone.loaded();

                if (active) {
                    playbackSamplerRef.current = sampler;
                }
            } catch (err) {
                console.error("Failed to load instruments for demo", err);
                 toast({
                    title: "Instrument loading failed",
                    description: "Could not load sounds for lesson playback.",
                    variant: "destructive"
                });
            }
        }
        if (active) {
            setIsInstrumentReady(true);
        }
    };
    
    loadSampler();


    return () => {
      active = false;
      stopAllActivity();
      playbackSamplerRef.current?.dispose();
    };
  }, [lesson, stopAllActivity, toast]);
  
  const playDemo = useCallback(async () => {
    if (!isInstrumentReady) {
        toast({ title: "Demo instrument not ready", description: "Please wait a moment for the sounds to load."});
        return;
    }
     if (lesson.instrument === 'piano' && (!playbackSamplerRef.current || playbackSamplerRef.current.disposed)) {
        toast({ title: "Piano sampler not ready", description: "Please wait a moment for the piano sounds to load."});
        return;
    }
    
    stopAllActivity();
    setMode('demo');
    setUserPlayedNotes([]);
    await Tone.start();
    
    let synth: Tone.Sampler | Tone.PolySynth;

    if (lesson.instrument === 'piano') {
        synth = playbackSamplerRef.current!;
    } else {
        // Use PolySynth for guitar and drums to handle chords/simultaneous notes
        const synthType = lesson.instrument === 'guitar' ? Tone.PluckSynth : Tone.MembraneSynth;
        synth = new Tone.PolySynth(synthType).toDestination();
    }

    const events = lesson.notes.flatMap(note => {
        return { time: note.time, key: note.key, duration: note.duration };
    });

    partRef.current = new Tone.Part((time, event) => {
        if (synth && 'triggerAttackRelease' in synth && !synth.disposed) {
          synth.triggerAttackRelease(event.key, event.duration, time);
        }
        
        const keysToHighlight = Array.isArray(event.key) ? event.key : [event.key];
        
        Tone.Draw.schedule(() => {
            setHighlightedKeys(current => [...current, ...keysToHighlight]);
        }, time);
        
        const releaseTime = time + Tone.Time(event.duration).toSeconds() * 0.9;
        Tone.Draw.schedule(() => {
            setHighlightedKeys(currentKeys => currentKeys.filter(k => !keysToHighlight.includes(k)));
        }, releaseTime);

    }, events).start(0);

    let maxTime = 0;
    lesson.notes.forEach(note => {
        const endTime = Tone.Time(note.time).toSeconds() + Tone.Time(note.duration).toSeconds();
        if (endTime > maxTime) {
            maxTime = endTime;
        }
    });
    
    Tone.Transport.bpm.value = lesson.tempo;
    Tone.Transport.start();

    Tone.Transport.scheduleOnce(() => {
      setMode('idle');
      setHighlightedKeys([]);
      if (lesson.instrument !== 'piano') {
          synth.dispose();
      }
    }, maxTime + 0.5);

  }, [isInstrumentReady, lesson, stopAllActivity, toast]);


  const startPractice = () => {
    stopAllActivity();
    setUserPlayedNotes([]);
    setScore(null);
    setMode('playing');
  };

  const calculateScore = useCallback(() => {
    if (userPlayedNotes.length === 0 || lesson.notes.length === 0) return 0;
    
    const timeTolerance = 0.5; // seconds
    let correctNoteCount = 0;

    const lessonNoteEvents = lesson.notes.map(n => ({
        key: n.key,
        time: Tone.Time(n.time).toSeconds(),
    }));

    userPlayedNotes.forEach(playedNote => {
        // Find the closest lesson note in time
        const closestLessonNote = lessonNoteEvents.reduce((closest, current) => {
            const playedTime = playedNote.time as number; // time is already a number here
            const timeDiff = Math.abs(playedTime - current.time);
            if (timeDiff < closest.diff) {
                return { diff: timeDiff, note: current };
            }
            return closest;
        }, { diff: Infinity, note: null as (typeof lessonNoteEvents[0] | null) });

        if (closestLessonNote.note && closestLessonNote.diff <= timeTolerance) {
            const lessonNoteKey = closestLessonNote.note.key;
            if (Array.isArray(lessonNoteKey)) {
                if (lessonNoteKey.includes(playedNote.key)) {
                    correctNoteCount++;
                }
            } else if (playedNote.key === lessonNoteKey) {
                correctNoteCount++;
            }
        }
    });
    
    const totalLessonNotes = lesson.notes.reduce((acc, note) => acc + (Array.isArray(note.key) ? note.key.length : 1), 0);
    const scorePercentage = (correctNoteCount / totalLessonNotes) * 100;
    
    return Math.min(100, Math.max(0, Math.round(scorePercentage)));
  }, [lesson.notes, userPlayedNotes]);
  
  const endPractice = () => {
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    setMode('results');
  };
  
  const handleNotePlay = useCallback((noteKey: string) => {
    if (mode !== 'playing') return;
    const time = (Tone.Transport.state === 'started' ? Tone.Transport.seconds : performance.now() / 1000);
    setUserPlayedNotes(prev => [...prev, { key: noteKey, duration: '8n', time: time.toFixed(2) }]);
  }, [mode]);

  const handleReport = async (reason: string) => {
    toast({ title: 'Report Submitted', description: 'Thank you for your feedback. We will review this lesson.' });
    setIsReportMenuOpen(false);
  };

  const getScoreFeedback = () => {
    if (score === null) return "";
    if (score >= 90) return "Excellent! You're a natural!";
    if (score >= 70) return "Great job! A little more practice and you'll be perfect.";
    if (score >= 50) return "Good effort! Keep practicing the tricky parts.";
    return "Keep trying! Practice makes perfect.";
  };

  
  const renderStatus = () => {
    switch (mode) {
      case 'demo': return "Watch and listen to the demo...";
      case 'playing': return "It's your turn! Play the notes on the virtual instrument.";
      case 'results': return "Here's how you did. Ready for another go?";
      default: return `Ready to learn ${lesson.title}?`;
    }
  };
  
  const InstrumentComponent = instrumentComponents[lesson.instrument] || null;
  const isUIDisabled = !isInstrumentReady || (mode !== 'idle' && mode !== 'results');
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Button variant="ghost" onClick={() => router.push('/lessons')} className="mb-4 self-start">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lessons
      </Button>

      <div className="grid md:grid-cols-3 gap-6 flex-1">
        <div className="md:col-span-1 space-y-6 flex flex-col">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">{lesson.title}</CardTitle>
              <CardDescription>Instrument: {lesson.instrument} | Tempo: {lesson.tempo}bpm</CardDescription>
              <Badge variant="secondary" className="w-fit">{lesson.difficulty}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{renderStatus()}</p>
              {mode === 'demo' && <Progress value={(Tone.Transport.progress * 100)} className="mt-2" />}
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Play className="text-primary"/>
                      Lesson Controls
                  </CardTitle>
                  <CardDescription>
                      Use the controls below to learn.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                   <Button onClick={playDemo} disabled={isUIDisabled || mode === 'demo' || mode === 'playing'} className="w-full">
                      {mode === 'demo' ? <Loader2 className="animate-spin" /> : <Play />}
                      Play Demo
                  </Button>
                  {mode !== 'playing' ? (
                    <Button onClick={startPractice} disabled={isUIDisabled || mode === 'demo'} className="w-full">
                      <User className="mr-2"/>
                      Your Turn
                    </Button>
                  ) : (
                    <Button onClick={endPractice} className="w-full">
                      End Practice
                    </Button>
                  )}
              </CardContent>
          </Card>

          <div className="flex-grow" />
          <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setIsReportMenuOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4" /> Report this lesson
          </Button>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full flex items-center justify-center p-4">
            {!isInstrumentReady || !InstrumentComponent ? (
              <InstrumentLoader instrument={lesson.instrument} />
            ) : (
              <Suspense fallback={<InstrumentLoader instrument={lesson.instrument} />}>
                <InstrumentComponent 
                  highlightedKeys={highlightedKeys}
                  onNotePlay={handleNotePlay}
                  disabled={mode !== 'playing'}
                />
              </Suspense>
            )}
          </Card>
        </div>
      </div>

       <Dialog open={mode === 'results'} onOpenChange={(isOpen) => !isOpen && setMode('idle')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="text-yellow-400" />
              Practice Results
            </DialogTitle>
            <DialogDescription>
              {getScoreFeedback()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8">
            <p className="text-6xl font-bold text-primary">{score}%</p>
            <p className="text-muted-foreground">Accuracy</p>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
             <Button variant="ghost" onClick={() => setMode('idle')}>Back to Lesson</Button>
             <Button onClick={startPractice}>
                <Repeat className="mr-2 h-4 w-4"/>
                Try Again
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReportMenuOpen} onOpenChange={setIsReportMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>
              Why are you reporting this lesson? Your feedback helps us keep the community safe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => handleReport('Inappropriate Content')}>Inappropriate Content</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleReport('Incorrect Notes')}>Notes are Incorrect</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleReport('Spam or Misleading')}>Spam or Misleading</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleReport('Other')}>Other</Button>
          </div>
          <DialogFooter>
             <Button variant="ghost" onClick={() => setIsReportMenuOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
