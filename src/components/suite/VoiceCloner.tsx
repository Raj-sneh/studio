'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    Mic, 
    Square, 
    Play, 
    Sparkles, 
    UserRoundPlus, 
    Loader2, 
    RefreshCw, 
    Volume2,
    Check
} from 'lucide-react';
import { cloneVoice, speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { generateTrainingParagraphs } from '@/ai/flows/voice-training-flow';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function VoiceCloner() {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'intro' | 'recording' | 'cloning' | 'ready'>('intro');
  const [scripts, setScripts] = useState<string[]>([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [samples, setSamples] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [testText, setTestText] = useState("Hello! This is my brand new AI voice.");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startCloningProcess = async () => {
    setIsProcessing(true);
    try {
        const fetchedScripts = await generateTrainingParagraphs();
        setScripts(fetchedScripts);
        setStep('recording');
    } catch (e) {
        toast({ title: "Error", description: "Could not load scripts.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setSamples(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Denied", description: "Microphone access required.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (currentScriptIndex < scripts.length - 1) {
          setCurrentScriptIndex(prev => prev + 1);
      }
    }
  };

  const handleClone = async () => {
    setStep('cloning');
    setIsProcessing(true);
    try {
        const result = await cloneVoice({
            name: `My Voice ${Date.now()}`,
            samples: samples
        });
        setClonedVoiceId(result.voiceId);
        setStep('ready');
        toast({ title: "Success!", description: "Your voice has been cloned." });
    } catch (error: any) {
        toast({ title: "Cloning Failed", description: error.message, variant: "destructive" });
        setStep('recording');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSpeak = async () => {
    if (!clonedVoiceId) return;
    setIsGeneratingSpeech(true);
    try {
        const result = await speakWithClone({
            text: testText,
            voiceId: clonedVoiceId
        });
        const audio = new Audio(result.audioUri);
        audio.play();
    } catch (e: any) {
        toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
        setIsGeneratingSpeech(false);
    }
  };

  const reset = () => {
    setStep('intro');
    setSamples([]);
    setCurrentScriptIndex(0);
    setClonedVoiceId(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {step === 'intro' && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserRoundPlus className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2">
              Train your own AI voice model. Speak anything with your exact tone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10 text-center">
             <Button onClick={startCloningProcess} disabled={isProcessing} size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl">
               {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
               Start Training
             </Button>
          </CardContent>
        </Card>
      )}

      {step === 'recording' && (
        <Card className="border-primary/20 bg-card/40 rounded-3xl overflow-hidden p-10">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle>Training {currentScriptIndex + 1}/3</CardTitle>
            </div>
            <Progress value={(samples.length / 3) * 100} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-10 text-center">
            <div className="min-h-[120px] flex items-center justify-center p-6 bg-muted/50 rounded-2xl border-2 border-dashed italic text-2xl">
                "{scripts[currentScriptIndex]}"
            </div>
            <div className="flex flex-col items-center gap-6">
                <Button size="icon" className={cn("h-24 w-24 rounded-full transition-all", isRecording ? "bg-destructive animate-pulse" : "bg-primary")} onPointerDown={startRecording} onPointerUp={stopRecording}>
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                <div className="text-sm font-bold text-muted-foreground">{isRecording ? "Recording... Release to stop" : "Hold to Record"}</div>
            </div>
            {samples.length === 3 && !isRecording && (
                <div className="pt-6 border-t">
                    <Button onClick={handleClone} disabled={isProcessing} size="lg" className="w-full h-14 text-xl font-bold rounded-2xl">
                        {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : 'Clone My Voice'}
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'cloning' && (
        <Card className="border-none bg-transparent py-20 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h3 className="text-2xl font-bold">Neural engine processing...</h3>
        </Card>
      )}

      {step === 'ready' && (
        <Card className="border-primary/20 bg-card/40 rounded-3xl p-10 space-y-8">
          <CardHeader className="text-center">
            <Check className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-3xl">Voice Ready!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <Textarea value={testText} onChange={(e) => setTestText(e.target.value)} className="min-h-[100px] text-lg" />
            <div className="flex gap-4">
                <Button onClick={handleSpeak} disabled={isGeneratingSpeech} size="lg" className="flex-1 h-14 text-lg font-bold">
                    {isGeneratingSpeech ? <Loader2 className="animate-spin" /> : <Play className="mr-2" />}
                    Speak
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14" onClick={reset}><RefreshCw /></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
