
'use client';

import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Play, Square, Mic, Music, AlertCircle, Info, ChevronLeft, User, Bot, MicOff } from 'lucide-react';
import { LESSONS } from '@/lib/lessons';
import type { Note, Instrument } from '@/types';
import { getSampler } from '@/lib/samplers';
import { useToast } from '@/hooks/use-toast';
import { analyzeUserPerformance } from '@/ai/flows/analyze-user-performance';
import { flagContentForReview } from '@/ai/flows/flag-content-for-review';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-flow';


const Piano = lazy(() => import('@/components/Piano'));
const Guitar = lazy(() => import('@/components/Guitar'));

const instrumentComponents: Record<Instrument, React.ElementType> = {
    piano: Piano,
    guitar: Guitar,
    drums: lazy(() => import('@/components/DrumKit')),
};

type Mode = 'idle' | 'demo' | 'playing' | 'listening' | 'analyzing' | 'feedback';
type Feedback = { accuracy: number; timing: number; feedback: string; };

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
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const [lesson, setLesson] = useState(LESSONS[0]);
  const [mode, setMode] = useState<Mode>('idle');
  const [isInstrumentReady, setIsInstrumentReady] = useState(false);
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [userPlayedNotes, setUserPlayedNotes] = useState<Note[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState(false);
  
  const freePlaySamplerRef = useRef<Tone.Synth | Tone.PluckSynth | null>(null);
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
    if (isRecording) {
      stopRecording();
    }
    if(freePlaySamplerRef.current && 'releaseAll' in freePlaySamplerRef.current) {
        (freePlaySamplerRef.current as any).releaseAll();
    }
     if(playbackSamplerRef.current && 'releaseAll' in playbackSamplerRef.current) {
        playbackSamplerRef.current.releaseAll();
    }
  }, [isRecording, stopRecording]);

  useEffect(() => {
    let active = true;
    setIsInstrumentReady(false);
    stopAllActivity();

    const loadInstruments = async () => {
        try {
            const freeplay = await getSampler(lesson.instrument);
            const playback = new Tone.Sampler({
                urls: {
                    C4: "C4.mp3",
                    "D#4": "Ds4.mp3",
                    "F#4": "Fs4.mp3",
                    A4: "A4.mp3",
                },
                release: 1,
                baseUrl: "https://tonejs.github.io/audio/salamander/",
            }).toDestination();
            
            await Tone.loaded();

            if (active) {
                freePlaySamplerRef.current = freeplay as any;
                playbackSamplerRef.current = playback;
                setIsInstrumentReady(true);
            }
        } catch (err) {
            console.error("Failed to load instruments", err);
             toast({
                title: "Instrument loading failed",
                description: "Could not load sounds for lesson playback.",
                variant: "destructive"
            });
        }
    };
    
    loadInstruments();

    return () => {
      active = false;
      stopAllActivity();
      freePlaySamplerRef.current?.dispose();
      playbackSamplerRef.current?.dispose();
    };
  }, [lesson.instrument, stopAllActivity, toast]);
  
  const playDemo = useCallback(async () => {
    if (!isInstrumentReady || !playbackSamplerRef.current || playbackSamplerRef.current.disposed) return;
    
    stopAllActivity();
    setMode('demo');
    setUserPlayedNotes([]);
    await Tone.start();
    
    const sampler = playbackSamplerRef.current;

    // Group notes by time
    const eventsMap = new Map<string, { key: string[], duration: string }>();
    lesson.notes.forEach(note => {
        const time = note.time;
        if (!eventsMap.has(time)) {
            eventsMap.set(time, { key: [], duration: note.duration });
        }
        const event = eventsMap.get(time)!;
        if (Array.isArray(note.key)) {
            event.key.push(...note.key);
        } else {
            event.key.push(note.key);
        }
    });

    const events = Array.from(eventsMap.entries()).map(([time, { key, duration }]) => ({
        time,
        key,
        duration
    }));

    partRef.current = new Tone.Part((time, event) => {
        if (sampler && 'triggerAttackRelease' in sampler && !sampler.disposed) {
          sampler.triggerAttackRelease(event.key, event.duration, time);
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
    }, maxTime + 0.5);

  }, [isInstrumentReady, lesson, stopAllActivity]);


  const startPractice = () => {
    stopAllActivity();
    setUserPlayedNotes([]);
    setMode('playing');
  };
  
  const handleNotePlay = (noteKey: string) => {
    if (mode !== 'playing') return;
    const time = Tone.Transport.seconds.toFixed(2);
    
    if (freePlaySamplerRef.current && 'triggerAttackRelease' in freePlaySamplerRef.current) {
        (freePlaySamplerRef.current as any).triggerAttackRelease(noteKey, '8n');
    }

    setUserPlayedNotes(prev => [...prev, { key: noteKey, duration: '8n', time: `0:0:${time}` }]);
  };

  const analyzePerformance = async () => {
    if (userPlayedNotes.length === 0) {
      toast({ title: "No notes played!", description: "Play some notes before analyzing." });
      return;
    }
    setMode('analyzing');
    try {
      const result = await analyzeUserPerformance({
        lessonNotes: lesson.notes,
        userNotes: userPlayedNotes,
      });
      setFeedback(result);
      setMode('feedback');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not analyze your performance.' });
      setMode('idle');
    }
  };
  
  const startListening = async () => {
    try {
        stopAllActivity();
        setMicPermissionError(false);
        setUserPlayedNotes([]);
        await startRecording();
        setMode('listening');
    } catch (error) {
        setMicPermissionError(true);
        setMode('idle');
    }
  };
  
  const stopListeningAndAnalyze = async () => {
    if (!isRecording) return;

    setMode('analyzing');
    const audioBlob = await stopRecording();
    if (!audioBlob) {
        setMode('idle');
        return;
    }

    try {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const transcriptionResult = await transcribeAudio({ 
                audioDataUri: base64Audio,
                instrument: 'piano', // For now, this is fixed as the transcription is for piano
            });

            if (transcriptionResult.notes.length === 0) {
                toast({ title: "No notes detected", description: "Couldn't detect any notes in your recording." });
                setMode('idle');
                return;
            }

            const result = await analyzeUserPerformance({
                lessonNotes: lesson.notes,
                userNotes: transcriptionResult.notes.map(n => ({...n, time: `0:0:${n.time}`})),
            });
            setFeedback(result);
            setMode('feedback');
        };
    } catch (error) {
        console.error("Transcription or analysis failed:", error);
        toast({ variant: "destructive", title: "AI Failed", description: "Could not process your recording." });
        setMode('idle');
    }
  };


  const handleReport = async (reason: string) => {
    try {
      await flagContentForReview({
        targetType: 'lesson',
        targetRef: lesson.id,
        reason,
        details: `User reported lesson: "${lesson.title}"`,
      });
      toast({ title: 'Report Submitted', description: 'Thank you for your feedback. We will review this lesson.' });
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast({ variant: 'destructive', title: 'Report Failed', description: 'Could not submit your report. Please try again.' });
    }
    setIsReportMenuOpen(false);
  };
  
  const renderStatus = () => {
    switch (mode) {
      case 'demo': return "Watch and listen to the demo...";
      case 'playing': return "It's your turn! Play the notes on the virtual instrument.";
      case 'listening': return "Listening to your playing... Play along with the rhythm.";
      case 'analyzing': return "Our AI is analyzing your performance...";
      case 'feedback': return "Here's how you did!";
      default: return `Ready to learn ${lesson.title}?`;
    }
  };
  
  const renderFeedback = () => {
    if (!feedback) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot /> AI Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-bold">{feedback.accuracy}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timing</p>
              <p className="text-2xl font-bold">{feedback.timing}%</p>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Feedback from your AI Teacher</AlertTitle>
            <AlertDescription>{feedback.feedback}</AlertDescription>
          </Alert>
          <Button onClick={() => setMode('idle')} className="w-full">Try Again</Button>
        </CardContent>
      </Card>
    );
  };

  const InstrumentComponent = instrumentComponents[lesson.instrument] || null;
  const isUIDisabled = mode !== 'idle' && mode !== 'playing' || !isInstrumentReady;
  
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Button variant="ghost" onClick={() => router.push('/lessons')} className="mb-4 self-start">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lessons
      </Button>

      <div className="grid md:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Lesson Info & Controls */}
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

          {mode !== 'feedback' ? (
            <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Music className="text-primary"/>
                        Virtual Instrument
                    </CardTitle>
                    <CardDescription>
                        Use the instrument below to play.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                     <Button onClick={playDemo} disabled={isUIDisabled || mode === 'demo'} className="w-full">
                        {mode === 'demo' ? <Loader2 className="animate-spin" /> : <Play />}
                        Play Demo
                    </Button>
                    {mode !== 'playing' ? (
                      <Button onClick={startPractice} disabled={isUIDisabled} className="w-full">
                        <User className="mr-2"/>
                        Your Turn
                      </Button>
                    ) : (
                      <Button onClick={analyzePerformance} disabled={userPlayedNotes.length === 0} className="w-full">
                        Analyze My Playing
                      </Button>
                    )}
                </CardContent>
            </Card>
            {process.env.NODE_ENV === 'development' && (
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Bot className="text-accent"/>
                          AI Teacher
                      </CardTitle>
                      <CardDescription>
                          Use your microphone to play along.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {mode !== 'listening' ? (
                          <Button onClick={startListening} disabled={isUIDisabled} className="w-full" variant="outline">
                              <Mic className="mr-2"/>
                              Listen & Learn
                          </Button>
                      ) : (
                          <Button onClick={stopListeningAndAnalyze} className="w-full" variant="destructive">
                              <Square className="mr-2"/>
                              Stop & Analyze
                          </Button>
                      )}
                      {micPermissionError && (
                          <Alert variant="destructive" className="mt-4">
                              <MicOff className="h-4 w-4" />
                              <AlertTitle>Microphone Access Denied</AlertTitle>
                              <AlertDescription>
                                  Please enable microphone permissions in your browser settings to use this feature.
                              </AlertDescription>
                          </Alert>
                      )}
                  </CardContent>
              </Card>
            )}
            </>
          ) : renderFeedback()}

          <div className="flex-grow" />
          <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => setIsReportMenuOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4" /> Report this lesson
          </Button>
        </div>

        {/* Right Column: Instrument UI */}
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
