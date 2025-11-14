"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Tone from "tone";
import { lessons } from "@/lib/lessons";
import type { Lesson, Note as NoteType, Instrument } from "@/types";
import { analyzeUserPerformance } from "@/ai/flows/analyze-user-performance";
import { flagContentForReview } from "@/ai/flows/flag-content-for-review";

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

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [mode, setMode] = useState<"idle" | "demo" | "recording" | "analyzing" | "result">("idle");
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [userRecording, setUserRecording] = useState<RecordedNote[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const reportReasonRef = useRef<HTMLTextAreaElement>(null);
  const synth = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    const lessonId = params.lessonId as string;
    const foundLesson = lessons.find((l) => l.id === lessonId);
    if (foundLesson) {
      setLesson(foundLesson);
    } else {
      router.push("/lessons");
    }

    synth.current = new Tone.Synth().toDestination();
    return () => synth.current?.dispose();
  }, [params.lessonId, router]);

  const playDemo = useCallback(() => {
    if (!lesson || !synth.current) return;
    setMode("demo");
    const now = Tone.now();
    
    lesson.notes.forEach((note) => {
      synth.current?.triggerAttackRelease(note.key, note.duration, now + note.time);
      
      Tone.Transport.scheduleOnce(() => {
        setHighlightedKeys([note.key]);
      }, now + note.time);

      Tone.Transport.scheduleOnce(() => {
        setHighlightedKeys([]);
      }, now + note.time + 0.2);
    });

    const totalDuration = (lesson.notes[lesson.notes.length - 1]?.time || 0) + 1;
    Tone.Transport.scheduleOnce(() => {
        setMode("idle");
    }, now + totalDuration);

    Tone.Transport.start();

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }
  }, [lesson, synth]);

  const startRecording = () => {
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
        instrument: lesson.instrument as Instrument,
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
        reporterId: 'user123', // mocked
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

  if (!lesson) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const progress = mode === 'demo' || mode === 'recording' ? 50 : mode === 'analyzing' ? 75 : mode === 'result' ? 100 : 0;
  
  const renderStatus = () => {
    switch (mode) {
      case 'idle': return "Ready when you are. Start with a demo or your turn.";
      case 'demo': return "Listen and watch the demo.";
      case 'recording': return "Your turn! Play the notes on the piano.";
      case 'analyzing': return "AI Teacher is analyzing your performance...";
      case 'result': return "Here's your feedback!";
      default: return "";
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/lessons')} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Lessons
      </Button>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl">{lesson.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" className="capitalize">{lesson.instrument}</Badge>
                <Badge variant="outline">{lesson.difficulty}</Badge>
                <span className="text-sm">{lesson.tempo} BPM</span>
              </CardDescription>
            </div>
             <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm"><Flag className="mr-2 h-4 w-4"/> Report Lesson</Button>
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">{renderStatus()}</p>
          </div>

          <Piano onNotePlay={handleNotePlay} highlightedKeys={highlightedKeys} disabled={mode !== 'recording'} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={playDemo} disabled={mode !== 'idle'} size="lg">
              <Play className="mr-2 h-5 w-5"/> Demo
            </Button>
            {mode !== 'recording' ? (
              <Button onClick={startRecording} disabled={mode !== 'idle'} size="lg">
                <Mic className="mr-2 h-5 w-5"/> Your Turn
              </Button>
            ) : (
              <Button onClick={stopRecordingAndAnalyze} size="lg" variant="destructive">
                <Square className="mr-2 h-5 w-5"/> Finish & Analyze
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={mode === 'analyzing'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center font-headline text-2xl gap-3">
              <Bot className="h-8 w-8 animate-pulse text-primary"/> Analyzing...
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-4">
              The AI Teacher is listening to your performance. <br/> Please wait a moment for your feedback.
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
