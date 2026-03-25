'use client';

import { useState, useRef } from 'react';
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
    Check,
    BrainCircuit,
    Info
} from 'lucide-react';
import { cloneVoice, speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { generateTrainingParagraph } from '@/ai/flows/voice-training-flow';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

export function VoiceCloner() {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'intro' | 'recording' | 'cloning' | 'ready'>('intro');
  const [script, setScript] = useState<string>("");
  const [sample, setSample] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [clonedVoiceData, setClonedVoiceData] = useState<{
    id: string;
    description: string;
    stability: number;
    similarity: number;
  } | null>(null);
  
  const [testText, setTestText] = useState("Hello! My voice has been analyzed by AI. Does it sound like me?");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startCloningProcess = async () => {
    setIsProcessing(true);
    try {
        const fetchedScript = await generateTrainingParagraph();
        setScript(fetchedScript);
        setStep('recording');
    } catch (e) {
        toast({ title: "Error", description: "Could not load the training script.", variant: "destructive" });
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
          setSample(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Denied", description: "Microphone access is required for cloning.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClone = async () => {
    if (!sample) return;
    setStep('cloning');
    setIsProcessing(true);
    try {
        const result = await cloneVoice({
            name: `AI Analyzed Voice ${Date.now()}`,
            samples: [sample]
        });
        
        setClonedVoiceData({
            id: result.voiceId,
            description: result.description,
            stability: result.suggestedSettings.stability,
            similarity: result.suggestedSettings.similarity_boost
        });

        setStep('ready');
        toast({ title: "Clone Successful", description: "Your neural profile is ready." });
    } catch (error: any) {
        toast({ title: "Cloning Failed", description: error.message, variant: "destructive" });
        setStep('recording');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSpeak = async () => {
    if (!clonedVoiceData) return;
    setIsGeneratingSpeech(true);
    try {
        const result = await speakWithClone({
            text: testText,
            voiceId: clonedVoiceData.id,
            settings: {
                stability: clonedVoiceData.stability,
                similarity_boost: clonedVoiceData.similarity
            }
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
    setSample(null);
    setClonedVoiceData(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {step === 'intro' && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Neural Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2">
              Gemini will analyze your pattern to build a high-fidelity neural profile.
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
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Neural Pattern Capture
                </CardTitle>
            </div>
            <Progress value={sample ? 100 : 0} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-10 text-center">
            <div className="min-h-[140px] flex items-center justify-center p-8 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20 italic text-xl md:text-2xl leading-relaxed">
                "{script}"
            </div>
            <div className="flex flex-col items-center gap-6">
                <Button 
                    size="icon" 
                    className={cn(
                        "h-24 w-24 rounded-full transition-all shadow-2xl", 
                        isRecording ? "bg-destructive scale-110 animate-pulse" : "bg-primary hover:scale-105"
                    )} 
                    onPointerDown={startRecording} 
                    onPointerUp={stopRecording}
                >
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {isRecording ? "Capturing Pattern..." : sample ? "Pattern Captured" : "Hold to Record"}
                </div>
            </div>
            {sample && !isRecording && (
                <div className="pt-6 border-t border-white/10">
                    <Button onClick={handleClone} disabled={isProcessing} size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-primary/20 shadow-lg">
                        {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <BrainCircuit className="mr-2" />}
                        Generate Neural Profile
                    </Button>
                    <Button variant="ghost" className="mt-4 text-xs" onClick={() => setSample(null)}>
                      Redo Recording
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'cloning' && (
        <Card className="border-none bg-transparent py-24 text-center space-y-8">
            <div className="relative mx-auto w-24 h-24">
              <Loader2 className="h-full w-full animate-spin text-primary" />
              <BrainCircuit className="absolute inset-0 m-auto h-10 w-10 text-primary/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold font-headline">Gemini is analyzing your voice...</h3>
              <p className="text-muted-foreground">Extracting pitch, resonance, and emotional patterns from your recording.</p>
            </div>
        </Card>
      )}

      {step === 'ready' && clonedVoiceData && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <Card className="border-primary/20 bg-primary/5 rounded-3xl p-8 border-2">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Info className="text-primary h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">AI Neural Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{clonedVoiceData.description}"
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-primary/20 bg-card/40 rounded-3xl p-10 space-y-8">
            <CardHeader className="text-center p-0">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Check className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Clone Optimized</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Neural Stability</span>
                    <span>{Math.round(clonedVoiceData.stability * 100)}%</span>
                  </div>
                  <Slider 
                    value={[clonedVoiceData.stability]} 
                    min={0} max={1} step={0.01} 
                    onValueChange={([v]) => setClonedVoiceData({...clonedVoiceData, stability: v})} 
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Similarity Boost</span>
                    <span>{Math.round(clonedVoiceData.similarity * 100)}%</span>
                  </div>
                  <Slider 
                    value={[clonedVoiceData.similarity]} 
                    min={0} max={1} step={0.01} 
                    onValueChange={([v]) => setClonedVoiceData({...clonedVoiceData, similarity: v})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test Your Profile</span>
                <Textarea value={testText} onChange={(e) => setTestText(e.target.value)} className="min-h-[120px] text-lg bg-background/50" />
                <div className="flex gap-4">
                    <Button onClick={handleSpeak} disabled={isGeneratingSpeech} size="lg" className="flex-1 h-16 text-xl font-bold rounded-2xl shadow-lg">
                        {isGeneratingSpeech ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
                        Generate Speech
                    </Button>
                    <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl" onClick={reset} title="Retrain Profile">
                      <RefreshCw className="h-6 w-6" />
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
