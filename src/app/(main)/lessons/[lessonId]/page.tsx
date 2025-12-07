
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import * as Tone from "tone";
import { lessons } from "@/lib/lessons";
import type { Lesson, Note as NoteType, Instrument } from "@/types";
import { analyzeUserPerformance } from "@/ai/flows/analyze-user-performance";
import { flagContentForReview } from "@/ai/flows/flag-content-for-review";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser } from '@/firebase';
import { getSampler, allSamplersLoaded } from "@/lib/samplers";


import Piano from "@/components/Piano";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Play, Square, Mic, Send, Flag, Bot, Loader2, Star, Trophy, Target, Sparkles, ChevronLeft } from "lucide-react";

type RecordedNote = { note: string; time: number };
type AnalysisResult = {
  overallScore: number;
  strengths: string;
  weaknesses: string;
} | null;
type Mode = "idle" | "demo" | "recording" | "analyzing" | "result";

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useUser();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [userRecording, setUserRecording] = useState<RecordedNote[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const reportReasonRef = useRef<HTMLTextAreaElement>(null);
  const noteTimeoutIds = useRef<NodeJS.Timeout[]>([]);
  const image = lesson ? PlaceHolderImages.find(img => img.id === lesson.imageId) : null;
  const [isLoading, setIsLoading] = useState(true);
  

  const ensureAudioContext = useCallback(async () => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Audio context started');
    }
  }, []);

  useEffect(() => {
    const lessonId = params.lessonId as string;
    const foundLesson = lessons.find((l) => l.id === lessonId);
    if (foundLesson) {
      setLesson(foundLesson);
      
      const loadAudio = async () => {
        setIsLoading(true);
        await ensureAudioContext();
        // Pre-load samplers
        const sampler = getSampler(foundLesson.instrument);
        if (!sampler.loaded) {
          await allSamplersLoaded();
        }
        setIsLoading(false);
      }
      loadAudio();

    } else {
      router.push("/lessons");
    }
    
    return () => {
        noteTimeoutIds.current.forEach(clearTimeout);
        if (Tone.Transport.state === "started") {
          Tone.Transport.stop();
        }
        Tone.Transport.cancel();
    }
  }, [params.lessonId, router, ensureAudioContext]);
  
  const playNotes = useCallback(async (notesToPlay: NoteType[], instrumentOverride?: Instrument, onEndCallback?: () => void) => {
    const currentInstrument = instrumentOverride || lesson?.instrument;
    if (!currentInstrument || notesToPlay.length === 0) {
      onEndCallback?.();
      return;
    }

    const notePlayer = getSampler(currentInstrument);
    
    if (!notePlayer.loaded) {
      // This should ideally not happen due to pre-loading, but as a fallback.
      setIsLoading(true);
      await allSamplersLoaded();
      setIsLoading(false);
    }
      
    noteTimeoutIds.current.forEach(clearTimeout);
    noteTimeoutIds.current = [];
    setHighlightedKeys([]);
    if (Tone.Transport.state === "started") {
      Tone.Transport.stop();
    }
    Tone.Transport.cancel();
    
    const now = Tone.now() + 0.2;
    
    notesToPlay.forEach(note => {
      if (note.key && note.duration && typeof note.time === 'number') {
        const noteTimeMs = note.time * 1000;
        const durationSeconds = Tone.Time(note.duration).toSeconds();
    
        notePlayer.triggerAttackRelease(note.key, durationSeconds, now + note.time);
    
        const attackTimeout = setTimeout(() => {
          setHighlightedKeys(current => [...current, note.key]);
        }, noteTimeMs);
    
        const releaseTimeout = setTimeout(() => {
          setHighlightedKeys(currentKeys => currentKeys.filter(k => k !== note.key));
        }, noteTimeMs + (durationSeconds * 1000));
    
        noteTimeoutIds.current.push(attackTimeout, releaseTimeout);
      }
    });
    
    const lastNote = notesToPlay[notesToPlay.length - 1];
    if (lastNote && typeof lastNote.time === 'number' && lastNote.duration) {
      const totalDuration = (lastNote.time + Tone.Time(lastNote.duration).toSeconds()) * 1000 + 500;
      const modeTimeout = setTimeout(() => {
        setMode("idle");
        onEndCallback?.();
      }, totalDuration);
      noteTimeoutIds.current.push(modeTimeout);
    } else {
        onEndCallback?.();
    }
  }, [lesson?.instrument]);

  const playDemo = useCallback(() => {
    if (!lesson || isLoading) return;
    setMode("demo");
    playNotes(lesson.notes, lesson.instrument);
  }, [lesson, playNotes, isLoading]);

  const startRecording = async () => {
    if (isLoading) return;
    setUserRecording([]);
    setRecordingStartTime(Date.now());
    setMode("recording");
  };

  const handleNotePlay = useCallback((note: string) => {
    if (mode === 'recording') {
        setUserRecording(prev => [...prev, { note, time: Date.now() - recordingStartTime }]);
    }
  }, [mode, recordingStartTime]);

  const stopRecordingAndAnalyze = async () => {
    setMode("analyzing");
    if (!lesson) return;

    const recordedNoteNames = userRecording.map(n => n.note);
    const expectedNoteNames = lesson.notes.map(n => n.key);
    
    try {
      const result = await analyzeUserPerformance({
        recordedNotes: recordedNoteNames,
        expectedNotes: expectedNoteNames,
        instrument: lesson.instrument,
      });
      setAnalysisResult(result);
      setMode("result");
    } catch(error) {
      console.error("AI analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not get feedback from the AI teacher. Please try again.",
        variant: "destructive",
      });
      setMode("idle");
    }
  };
  
  const handleReportSubmit = async () => {
    if (!lesson || !reportReasonRef.current?.value) return;
    
    toast({ title: "Submitting report..." });

    try {
      await flagContentForReview({
        reporterId: user?.uid || 'anonymous',
        targetType: 'lesson',
        targetRef: lesson.id,
        reason: reportReasonRef.current.value,
      });
      toast({ title: "Report submitted", description: "Thank you for your feedback." });
    } catch (error) {
      toast({ title: "Failed to submit report", variant: "destructive" });
    } finally {
      setIsReportDialogOpen(false);
    }
  };

  const renderInstrument = () => {
    if (!lesson) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    
    if (isLoading) {
        return <div className="flex flex-col items-center justify-center h-full text-center"><Loader2 className="h-8 w-8 animate-spin" /><p className="mt-4 text-muted-foreground">Loading instrument...</p></div>;
    }

    const props = {
      onNotePlay: handleNotePlay,
      highlightedKeys: highlightedKeys,
      disabled: mode !== 'recording',
    };

    return <Piano {...props} />;
  }

  if (!lesson) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const renderStatus = () => {
    if (isLoading) return "Getting the instrument ready...";
    switch (mode) {
      case 'idle': return "Ready when you are. Start with a demo or your turn.";
      case 'demo': return "Listen and watch the demo.";
      case 'recording': return `Your turn! Play the notes on the piano.`;
      case 'analyzing': return "AI Teacher is analyzing your performance...";
      case 'result': return "Here's your feedback!";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Button variant="ghost" onClick={() => router.push('/lessons')} className="mb-4 self-start">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lessons
      </Button>
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-2xl">{lesson.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" className="capitalize">{lesson.instrument}</Badge>
                <Badge variant="outline">{lesson.difficulty}</Badge>
                <span className="text-sm">{lesson.tempo} BPM</span>
              </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm"><Flag className="mr-2 h-4 w-4"/> Report</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Lesson: {lesson.title}</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for reporting this lesson. Your feedback helps us maintain a high-quality learning environment.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason" className="text-right">Reason</Label>
                        <Textarea id="reason" ref={reportReasonRef} className="col-span-3" placeholder="e.g., Incorrect notes, inappropriate content..." />
                      </div>
                    </div>
                    <AlertDialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsReportDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleReportSubmit}><Send className="mr-2 h-4 w-4"/> Submit Report</Button>
                    </AlertDialogFooter>
                  </DialogContent>
                </Dialog>
             </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <Progress value={(mode === 'demo') ? 100 : 0} />
            <p className="text-center text-sm text-muted-foreground">{renderStatus()}</p>
          </div>

          <div className="flex-1 min-h-[300px]">
            {renderInstrument()}
          </div>
          

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={playDemo} disabled={mode !== 'idle' || isLoading} size="lg">
              {isLoading && mode === 'idle' ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Play className="mr-2 h-5 w-5"/>}
              Demo
            </Button>
            {mode !== 'recording' ? (
              <Button onClick={startRecording} disabled={mode !== 'idle' || isLoading} size="lg">
                <Mic className="mr-2 h-5 w-5"/> Your Turn
              </Button>
            ) : (
              <Button onClick={stopRecordingAndAnalyze} size="lg" variant="destructive">
                <Square className="mr-2 h-5 w-5"/> Finish &amp; Analyze
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={mode === 'analyzing'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center font-headline text-2xl gap-3">
              <Bot className="h-8 w-8 animate-pulse text-primary"/> 
              Analyzing...
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-4">
              The AI Teacher is listening to your performance. Please wait a moment for your feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={mode === 'result'} onOpenChange={(open) => !open && setMode('idle')}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-3xl text-center flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> Session Results
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Great job! Here is the feedback from your AI Teacher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center my-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-4xl font-bold text-primary">{analysisResult?.overallScore || 'N/A'}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1"><Trophy className="h-4 w-4" /> Overall Score</CardDescription>
              </CardHeader>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                 <p className="text-muted-foreground">{analysisResult ? `${(analysisResult.overallScore / 100 * userRecording.length).toFixed(0)} / ${userRecording.length} notes correct` : ''}</p>
                 <Progress value={analysisResult?.overallScore || 0} className="mt-2"/>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Star className="h-5 w-5 text-green-400"/> Strengths</h3>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg min-h-[100px]">{analysisResult?.strengths}</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Target className="h-5 w-5 text-amber-400"/> Areas for Improvement</h3>
              <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg min-h-[100px]">{analysisResult?.weaknesses}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMode("idle")}>Try Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    