'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
    Mic, 
    Square, 
    Play, 
    Sparkles, 
    CheckCircle, 
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
  
  // State
  const [step, setStep] = useState<'intro' | 'recording' | 'cloning' | 'ready'>('intro');
  const [scripts, setScripts] = useState<string[]>([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [samples, setSamples] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Test Mode State
  const [testText, setTestText] = useState("Hello! This is my brand new AI voice. Pretty cool, right?");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- CREDIT LOGIC ---
  const checkAndDeductCredit = (cost: number) => {
    const stored = localStorage.getItem("sargam_credits");
    let credits = stored ? parseInt(stored) : 5;
    if (credits < cost) {
      toast({ 
        title: "Insufficient Credits", 
        description: `This requires ${cost} credits. You have ${credits}.`, 
        variant: "destructive" 
      });
      window.dispatchEvent(new Event('showCreditBar'));
      return false;
    }
    localStorage.setItem("sargam_credits", (credits - cost).toString());
    window.dispatchEvent(new Event('creditsUpdated'));
    return true;
  };

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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Microphone Denied", description: "Please allow microphone access to record samples.", variant: "destructive" });
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
    if (!checkAndDeductCredit(10)) return;
    
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
        console.error("Cloning Error:", error);
        toast({ title: "Cloning Failed", description: error.message, variant: "destructive" });
        setStep('recording');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSpeak = async () => {
    if (!clonedVoiceId) return;
    if (!checkAndDeductCredit(2)) return;

    setIsGeneratingSpeech(true);
    try {
        const result = await speakWithClone({
            text: testText,
            voiceId: clonedVoiceId
        });
        const audio = new Audio(result.audioUri);
        audio.play();
    } catch (e: any) {
        toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
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
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md overflow-hidden rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border-2 border-primary/20">
              <UserRoundPlus className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto text-base mt-2">
              Train your own AI voice model. Once trained, you can make the AI speak with your exact tone and emotion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-2xl text-center space-y-2">
                    <div className="font-bold text-primary">1. Record</div>
                    <p className="text-[10px] text-muted-foreground">Read 3 short sentences clearly.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl text-center space-y-2">
                    <div className="font-bold text-primary">2. Clone</div>
                    <p className="text-[10px] text-muted-foreground">Neural engine processes your data.</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl text-center space-y-2">
                    <div className="font-bold text-primary">3. Test</div>
                    <p className="text-[10px] text-muted-foreground">Type text to hear your AI self.</p>
                </div>
             </div>
             
             <div className="text-center border-t pt-8">
                <Button onClick={startCloningProcess} disabled={isProcessing} size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform">
                  {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  Start Training (10 Credits)
                </Button>
             </div>
          </CardContent>
        </Card>
      )}

      {step === 'recording' && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden animate-in fade-in zoom-in-95">
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Training Sample {currentScriptIndex + 1}/3</CardTitle>
                <div className="text-xs font-bold text-muted-foreground">Samples Recorded: {samples.length}</div>
            </div>
            <Progress value={(samples.length / 3) * 100} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-10 p-10 text-center">
            <div className="min-h-[120px] flex items-center justify-center p-6 bg-muted/50 rounded-2xl border-2 border-dashed border-primary/20 italic text-xl md:text-2xl font-medium">
                "{scripts[currentScriptIndex]}"
            </div>

            <div className="flex flex-col items-center gap-6">
                <Button 
                    size="icon" 
                    className={cn(
                        "h-24 w-24 rounded-full shadow-2xl transition-all",
                        isRecording ? "bg-destructive animate-pulse scale-110" : "bg-primary hover:scale-105"
                    )}
                    onPointerDown={startRecording}
                    onPointerUp={stopRecording}
                >
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                <div className="text-sm font-bold animate-pulse text-muted-foreground">
                    {isRecording ? "Recording... Release to stop" : "Hold to Record"}
                </div>
            </div>

            {samples.length === 3 && !isRecording && (
                <div className="pt-6 border-t animate-in fade-in slide-in-from-bottom-2">
                    <Button onClick={handleClone} disabled={isProcessing} size="lg" className="w-full h-14 text-xl font-bold rounded-2xl bg-secondary hover:bg-secondary/80">
                        {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <UserRoundPlus className="mr-2" />}
                        Clone My Voice Now
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'cloning' && (
        <Card className="border-none bg-transparent py-20 text-center">
            <div className="space-y-6">
                <div className="relative h-24 w-24 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-headline">Cloning in Progress</h3>
                    <p className="text-muted-foreground">Our neural engine is creating your professional voice model...</p>
                </div>
            </div>
        </Card>
      )}

      {step === 'ready' && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden animate-in fade-in zoom-in-95">
          <CardHeader className="text-center bg-primary/10 pb-8 pt-10">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">Voice Ready!</CardTitle>
            <CardDescription className="text-primary font-bold">Your AI Clone is active.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    Test Your Clone
                </label>
                <Textarea 
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    className="min-h-[100px] text-lg bg-background/50"
                />
            </div>

            <div className="flex gap-4">
                <Button onClick={handleSpeak} disabled={isGeneratingSpeech} size="lg" className="flex-1 h-14 text-lg font-bold rounded-2xl">
                    {isGeneratingSpeech ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2" />}
                    Generate Speech (2 Credits)
                </Button>
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl" onClick={reset}>
                    <RefreshCw className="h-6 w-6" />
                </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
