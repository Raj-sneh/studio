"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import * as Tone from "tone";
import { lessons } from "@/lib/lessons";
import type { Lesson, Note as NoteType, Instrument } from "@/types";
import { analyzeUserPerformance } from "@/ai/flows/analyze-user-performance";
import { flagContentForReview } from "@/ai/flows/flag-content-for-review";
import { transcribeAudio, type TranscribeAudioOutput } from "@/ai/flows/transcribe-audio-flow";

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
import { Play, Square, Mic, Send, Flag, Bot, Loader2, Star, Trophy, Target, Sparkles, ChevronLeft, Ear } from "lucide-react";

type RecordedNote = { note: string; time: number };
type AnalysisResult = {
  overallScore: number;
  strengths: string;
  weaknesses: string;
} | null;
type Mode = "idle" | "demo" | "recording" | "analyzing" | "result" | "listening" | "transcribing" | "playback";

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [userRecording, setUserRecording] = useState<RecordedNote[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [transcribedNotes, setTranscribedNotes] = useState<TranscribeAudioOutput['notes']>([]);
  const reportReasonRef = useRef<HTMLTextAreaElement>(null);
  const synth = useRef<Tone.Synth | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const playNotes = useCallback((notesToPlay: NoteType[] | TranscribeAudioOutput['notes']) => {
    if (!synth.current || notesToPlay.length === 0) return;
    
    const now = Tone.now();
    
    notesToPlay.forEach((note) => {
      if(!note.key || !note.duration || !note.time) return;
      synth.current?.triggerAttackRelease(note.key, note.duration, now + note.time);
      
      Tone.Transport.scheduleOnce(() => {
        setHighlightedKeys([note.key]);
      }, now + note.time);

      Tone.Transport.scheduleOnce(() => {
        setHighlightedKeys([]);
      }, now + note.time + 0.2);
    });

    const totalDuration = (notesToPlay[notesToPlay.length - 1]?.time || 0) + 1;
    Tone.Transport.scheduleOnce(() => {
        setMode("idle");
    }, now + totalDuration);

    Tone.Transport.start();
    
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }
  }, [synth]);

  const playDemo = useCallback(() => {
    if (!lesson) return;
    setMode("demo");
    playNotes(lesson.notes);
  }, [lesson, playNotes]);

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

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = event => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setMode("transcribing");
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            if (!lesson) return;
            const result = await transcribeAudio({
              audioDataUri: base64Audio,
              instrument: lesson.instrument,
            });
            setTranscribedNotes(result.notes);
            setMode("playback");
            playNotes(result.notes);
          } catch (e) {
            console.error("Transcription failed", e);
            toast({ title: "Transcription Failed", description: "Could not understand the audio. Please try again.", variant: "destructive" });
            setMode("idle");
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setMode("listening");
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access in your browser settings to use this feature.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    mediaRecorderRef.current?.stop();
  };

  const playTranscribedNotes = () => {
    if (transcribedNotes.length > 0) {
      setMode("playback");
      playNotes(transcribedNotes);
    }
  };

  if (!lesson) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  const renderStatus = () => {
    switch (mode) {
      case 'idle': return "Ready when you are. Start with a demo, your turn or listen & learn.";
      case 'demo': return "Listen and watch the demo.";
      case 'recording': return "Your turn! Play the notes on the piano.";
      case 'analyzing': return "AI Teacher is analyzing your performance...";
      case 'result': return "Here's your feedback!";
      case 'listening': return "Listening to your music... Press stop when you're done.";
      case 'transcribing': return "AI is transcribing your music...";
      case 'playback': return "Playing back the transcribed music.";
      default: return "";
    }
  };

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
            <Progress value={mode === 'idle' ? 0 : 100} />
            <p className="text-center text-sm text-muted-foreground">{renderStatus()}</p>
          </div>

          <Piano onNotePlay={handleNotePlay} highlightedKeys={highlightedKeys} disabled={mode !== 'recording'} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
             {mode !== 'listening' ? (
              <Button onClick={startListening} disabled={mode !== 'idle'} size="lg">
                <Ear className="mr-2 h-5 w-5"/> Listen & Learn
              </Button>
            ) : (
              <Button onClick={stopListening} size="lg" variant="destructive">
                <Square className="mr-2 h-5 w-5"/> Stop Listening
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={mode === 'analyzing' || mode === 'transcribing'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center font-headline text-2xl gap-3">
              <Bot className="h-8 w-8 animate-pulse text-primary"/> {mode === 'analyzing' ? 'Analyzing...' : 'Transcribing...'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-4">
              {mode === 'analyzing' 
                ? "The AI Teacher is listening to your performance. Please wait a moment for your feedback."
                : "The AI Teacher is transcribing your music. This may take a few moments."
              }
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

       <AlertDialog open={mode === 'playback' && transcribedNotes.length > 0} onOpenChange={(open) => !open && setMode('idle')}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-3xl text-center flex items-center justify-center gap-2">
              <Ear className="h-6 w-6 text-primary" /> Music Playback
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              The AI has transcribed your music. Watch the piano to learn how to play it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => playTranscribedNotes()}>Play Again</AlertDialogAction>
            <AlertDialogCancel onClick={() => setMode('idle')}>Done</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
