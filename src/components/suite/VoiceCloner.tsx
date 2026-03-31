'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    Sparkles, 
    BrainCircuit,
    Upload,
    Globe,
    Lock,
    Mic2,
    Loader2,
    RefreshCw,
    Trash2,
    Zap,
    Mic,
    Square,
    Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, addDoc } from 'firebase/firestore';
import { generateTrainingParagraph } from '@/ai/flows/voice-training-flow';
import { cloneVoice } from '@/ai/flows/voice-cloning-flow';
import { useToast } from '@/hooks/use-toast';

const SUPPORTED_LANGUAGES = [
    { label: "English", value: "English" },
    { label: "Hindi", value: "Hindi" },
    { label: "Spanish", value: "Spanish" },
    { label: "French", value: "French" },
    { label: "German", value: "German" },
    { label: "Italian", value: "Italian" },
    { label: "Japanese", value: "Japanese" },
    { label: "Korean", value: "Korean" },
    { label: "Portuguese", value: "Portuguese" }
];

const CLONE_COST = 25;
const ADMIN_EMAIL = 'snehkumarverma2011@gmail.com';

export function VoiceCloner() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<'setup' | 'training' | 'uploading'>('setup');
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [trainingScript, setTrainingScript] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState("");
  const [samples, setSamples] = useState<{ name: string, dataUri: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  
  const { data: savedVoices } = useCollection(voicesQuery);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const handleStartTraining = async () => {
    if (!voiceName.trim()) {
      toast({ title: "Name Required", description: "Please give your voice clone a name first.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const script = await generateTrainingParagraph(selectedLanguage);
      setTrainingScript(script);
      setStep('training');
    } catch (e) {
      toast({ title: "Training Error", description: "Could not generate script. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUri = reader.result as string;
          setSamples(prev => [...prev, { 
            name: `Recording_${new Date().toLocaleTimeString()}.wav`, 
            dataUri 
          }]);
          setStep('uploading');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast({ title: "Mic Access Denied", description: "Please enable microphone permissions to record.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSamples(prev => [...prev, { name: file.name, dataUri: reader.result as string }]);
        setStep('uploading');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSample = (index: number) => {
    setSamples(prev => prev.filter((_, i) => i !== index));
    if (samples.length <= 1 && step === 'uploading') {
        setStep('training');
    }
  };

  const handleFinalizeClone = async () => {
    if (!user) return;
    if (samples.length === 0) {
      toast({ title: "Samples Missing", description: "Please upload at least one voice sample.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const creditRes = await fetch('/api/credits/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, amount: CLONE_COST })
      });

      if (!creditRes.ok) {
          const errorData = await creditRes.json();
          throw new Error(errorData.error || "Insufficient credits for neural training.");
      }

      const result = await cloneVoice({
        name: voiceName,
        samples: samples.map(s => s.dataUri)
      });

      if (firestore) {
        await addDoc(collection(firestore, 'users', user.uid, 'clonedVoices'), {
          voiceId: result.voiceId,
          name: voiceName,
          description: result.description,
          language: selectedLanguage,
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: "Neural Clone Active!", description: `${voiceName} is now in your library.` });
      setStep('setup');
      setVoiceName("");
      setSamples([]);
      setTrainingScript(null);
    } catch (e: any) {
      toast({ title: "Cloning Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 relative min-h-[700px]">
      
      {!isAdmin && (
        <div className="absolute inset-0 z-50 flex flex-col items-center pointer-events-none pt-40">
            <div className="pointer-events-auto bg-card/40 border border-primary/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 rounded-[2rem] w-full max-w-[280px] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Neural Protocol Restricted</p>
                    <h3 className="text-md font-bold font-headline text-foreground leading-tight">Elite Access Required</h3>
                </div>
                <Lock className="h-8 w-8 text-primary mx-auto opacity-80" />
                <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground leading-snug px-2 italic">
                        Neural cloning requires 25 credits and a Pro plan. Upgrade now to apply.
                    </p>
                    <Button onClick={() => router.push('/pricing')} className="w-full h-10 text-xs font-black rounded-xl shadow-xl shadow-primary/20">
                        Upgrade Plan
                    </Button>
                </div>
            </div>
        </div>
      )}

      <div className={cn("space-y-16", !isAdmin && "grayscale opacity-40 blur-sm pointer-events-none select-none")}>
        
        <Card className="border-primary/20 bg-card/20 rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center pt-10">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BrainCircuit className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Voice Cloning AI</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-1 text-xs">
              Train your personal neural artist in your native language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10">
             
             {step === 'setup' && (
               <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Voice Name</label>
                    <Input 
                      placeholder="e.g., My Studio Clone" 
                      value={voiceName}
                      onChange={(e) => setVoiceName(e.target.value)}
                      className="rounded-xl bg-muted/20 border-primary/10 h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                          <Globe className="h-3 w-3" /> Language
                      </label>
                      <select 
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="w-full bg-muted/40 border border-primary/10 rounded-xl px-4 py-2 text-sm h-12 focus:outline-none"
                      >
                          {SUPPORTED_LANGUAGES.map(lang => (
                              <option key={lang.value} value={lang.value}>{lang.label}</option>
                          ))}
                      </select>
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button onClick={handleStartTraining} disabled={isLoading} className="h-12 rounded-xl font-bold">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Start Neural Training
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-primary/10" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                  </div>

                  <Button variant="outline" onClick={() => { setStep('uploading'); }} className="w-full h-12 rounded-xl border-primary/10 hover:bg-primary/5">
                    <Upload className="mr-2 h-4 w-4" /> Skip to Upload Samples
                  </Button>
               </div>
             )}

             {step === 'training' && trainingScript && (
               <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Neural Training Script ({selectedLanguage})</p>
                    <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-foreground">
                      "{trainingScript}"
                    </p>
                    <div className="mt-6 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={handleStartTraining} className="text-xs text-primary hover:bg-primary/10">
                        <RefreshCw className="h-3 w-3 mr-2" /> New Script
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm font-bold">Record your voice reading the script above</p>
                      <p className="text-xs text-muted-foreground">Speak clearly for the best neural accuracy.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                        {isRecording ? (
                            <Button 
                                size="lg" 
                                variant="destructive" 
                                onClick={stopRecording} 
                                className="h-20 px-10 rounded-2xl shadow-xl shadow-destructive/20 animate-pulse flex flex-col gap-1"
                            >
                                <div className="flex items-center gap-2">
                                    <Square className="h-6 w-6 fill-current" />
                                    <span className="text-lg">Stop Recording</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{formatTime(recordingDuration)}</span>
                            </Button>
                        ) : (
                            <Button 
                                size="lg" 
                                onClick={startRecording} 
                                className="h-20 px-10 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2"
                            >
                                <Mic className="h-6 w-6" />
                                <span className="text-lg">Start Recording</span>
                            </Button>
                        )}
                        
                        {!isRecording && (
                            <div className="flex flex-col gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" multiple className="hidden" />
                                <Button 
                                    variant="outline" 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="h-20 px-8 rounded-2xl border-primary/10 hover:bg-primary/5 flex items-center gap-2"
                                >
                                    <Upload className="h-5 w-5" />
                                    <span>Upload File</span>
                                </Button>
                            </div>
                        )}
                    </div>
                  </div>
               </div>
             )}

             {step === 'uploading' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold">Vocal Samples</h3>
                    <p className="text-xs text-muted-foreground">Review your captured recordings or uploaded files.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {samples.map((sample, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-primary/5">
                        <div className="flex items-center gap-3 truncate">
                          <Volume2 className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-xs font-medium truncate">{sample.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSample(i)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        if (trainingScript) setStep('training');
                        else fileInputRef.current?.click();
                      }}
                      className="flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-primary/10 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-widest">{trainingScript ? 'Record More' : 'Add More'}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" multiple className="hidden" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="outline" onClick={() => {
                        if (trainingScript) setStep('training');
                        else setStep('setup');
                    }} className="h-12 flex-1 rounded-xl">Back</Button>
                    <Button 
                      onClick={handleFinalizeClone} 
                      disabled={isLoading || samples.length === 0} 
                      className="h-12 flex-[2] rounded-xl font-bold shadow-xl shadow-primary/20"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2 fill-primary-foreground" />}
                      Finalize Neural Clone ({CLONE_COST} Credits)
                    </Button>
                  </div>
                </div>
             )}
          </CardContent>
        </Card>

        <div className="space-y-6">
            <h2 className="text-xl font-bold font-headline flex items-center gap-3">
                <Mic2 className="text-primary h-5 w-5" />
                Neural Artist Library
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedVoices && savedVoices.length > 0 ? (
                  savedVoices.map((v) => (
                    <div key={v.id} className="p-5 rounded-3xl bg-muted/10 border border-primary/20 flex items-center gap-4 group hover:bg-primary/5 transition-all">
                        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-bold uppercase tracking-tight truncate">{v.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{v.language} • Neural Clone</p>
                        </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4 border-2 border-dashed border-primary/5 rounded-[2rem]">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                        <Mic2 className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-muted-foreground italic">No neural artists in your library yet.</p>
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
