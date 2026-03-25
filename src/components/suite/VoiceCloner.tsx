
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
    Mic, 
    Square, 
    Play, 
    Sparkles, 
    Loader2, 
    RefreshCw, 
    Check,
    BrainCircuit,
    Upload,
    Save,
    Trash2
} from 'lucide-react';
import { cloneVoice, speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { generateTrainingParagraph } from '@/ai/flows/voice-training-flow';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function VoiceCloner() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [step, setStep] = useState<'intro' | 'recording' | 'cloning' | 'ready'>('intro');
  const [script, setScript] = useState<string>("");
  const [sample, setSample] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceName, setVoiceName] = useState("");

  const [clonedVoiceData, setClonedVoiceData] = useState<{
    id: string;
    description: string;
    stability: number;
    similarity: number;
  } | null>(null);
  
  const [testText, setTestText] = useState("Hello! My voice has been optimized by SKV AI.");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved voices
  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: savedVoices } = useCollection(voicesQuery);

  const startCloningProcess = async () => {
    setIsProcessing(true);
    try {
        const fetchedScript = await generateTrainingParagraph();
        setScript(fetchedScript);
        setStep('recording');
    } catch (e) {
        toast({ title: "Error", description: "Script failed to load.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSample(reader.result as string);
        toast({ title: "File Ready", description: "Audio sample uploaded successfully." });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        const reader = new FileReader();
        reader.onloadend = () => setSample(reader.result as string);
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Microphone Required", variant: "destructive" });
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
            name: voiceName || `SKV Clone ${Date.now()}`,
            samples: [sample]
        });
        setClonedVoiceData({
            id: result.voiceId,
            description: result.description,
            stability: result.suggestedSettings.stability,
            similarity: result.suggestedSettings.similarity_boost
        });
        setStep('ready');
    } catch (error: any) {
        toast({ title: "Cloning Failed", description: error.message, variant: "destructive" });
        setStep('recording');
    } finally {
        setIsProcessing(false);
    }
  };

  const saveToProfile = async () => {
    if (!clonedVoiceData || !user || !firestore) return;
    setIsProcessing(true);
    const voiceDocRef = doc(firestore, 'users', user.uid, 'clonedVoices', clonedVoiceData.id);
    setDocumentNonBlocking(voiceDocRef, {
        voiceId: clonedVoiceData.id,
        name: voiceName || "My Saved Voice",
        description: clonedVoiceData.description,
        stability: clonedVoiceData.stability,
        similarity: clonedVoiceData.similarity,
        createdAt: serverTimestamp()
    }, { merge: true });
    
    toast({ title: "Saved", description: "Voice added to your Studio profile." });
    setIsProcessing(false);
    reset();
  };

  const deleteVoice = (id: string) => {
    if (!user || !firestore) return;
    const voiceRef = doc(firestore, 'users', user.uid, 'clonedVoices', id);
    deleteDocumentNonBlocking(voiceRef);
    toast({ title: "Voice Deleted" });
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
        new Audio(result.audioUri).play();
    } catch (e: any) {
        toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
        setIsGeneratingSpeech(false);
    }
  };

  const reset = () => {
    setStep('intro');
    setSample(null);
    setClonedVoiceData(null);
    setVoiceName("");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12">
      {step === 'intro' && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md rounded-3xl">
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">Neural Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2">
              Train SKV AI by recording a sample or uploading an audio file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10 text-center">
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={startCloningProcess} disabled={isProcessing} size="lg" className="h-14 px-8 rounded-2xl">
                    <Sparkles className="mr-2 h-5 w-5" /> Start Neural Training
                </Button>
                <div className="relative">
                    <Input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="training-upload" />
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl cursor-pointer">
                        <label htmlFor="training-upload">
                            <Upload className="mr-2 h-5 w-5" /> Upload Training File
                        </label>
                    </Button>
                </div>
             </div>
          </CardContent>
        </Card>
      )}

      {step === 'recording' && (
        <Card className="border-primary/20 bg-card/40 rounded-3xl p-10">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" /> Neural Pattern Capture
                </CardTitle>
                <Button variant="ghost" onClick={reset}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 text-center">
            <div className="min-h-[140px] flex items-center justify-center p-8 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/20 italic text-xl">
                "{script}"
            </div>
            <div className="flex flex-col items-center gap-6">
                <Button 
                    size="icon" 
                    className={cn(
                        "h-24 w-24 rounded-full transition-all shadow-2xl", 
                        isRecording ? "bg-destructive scale-110 animate-pulse" : "bg-primary"
                    )} 
                    onPointerDown={startRecording} 
                    onPointerUp={stopRecording}
                >
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {isRecording ? "Capturing..." : sample ? "Ready to Clone" : "Hold to Record"}
                </div>
            </div>
            {sample && (
                <div className="pt-6 border-t border-white/10 space-y-4">
                    <Input 
                        placeholder="Give your voice a name..." 
                        value={voiceName} 
                        onChange={(e) => setVoiceName(e.target.value)}
                        className="h-12 text-center"
                    />
                    <Button onClick={handleClone} disabled={isProcessing} size="lg" className="w-full h-16 text-xl font-bold rounded-2xl">
                        {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <BrainCircuit className="mr-2" />}
                        Process Neural Profile
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'cloning' && (
        <Card className="border-none bg-transparent py-24 text-center space-y-8">
            <Loader2 className="mx-auto h-20 w-20 animate-spin text-primary" />
            <h3 className="text-2xl font-bold">SKV AI is building your Neural Blueprint...</h3>
        </Card>
      )}

      {step === 'ready' && clonedVoiceData && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 rounded-3xl p-8 border-2">
            <h3 className="font-bold text-lg mb-2">SKV AI Analysis</h3>
            <p className="text-sm text-muted-foreground italic">"{clonedVoiceData.description}"</p>
          </Card>
          <Card className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stability</span>
                    <Slider value={[clonedVoiceData.stability]} min={0} max={1} step={0.01} onValueChange={([v]) => setClonedVoiceData({...clonedVoiceData, stability: v})} />
                </div>
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Similarity</span>
                    <Slider value={[clonedVoiceData.similarity]} min={0} max={1} step={0.01} onValueChange={([v]) => setClonedVoiceData({...clonedVoiceData, similarity: v})} />
                </div>
            </div>
            <Textarea value={testText} onChange={(e) => setTestText(e.target.value)} className="min-h-[100px] text-lg" />
            <div className="flex gap-4">
                <Button onClick={handleSpeak} disabled={isGeneratingSpeech} size="lg" className="flex-1 h-16 rounded-2xl">
                    {isGeneratingSpeech ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />} Test Clone
                </Button>
                <Button onClick={saveToProfile} variant="secondary" size="lg" className="flex-1 h-16 rounded-2xl">
                    <Save className="mr-2" /> Save to Profile
                </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Saved Voices Library */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Saved Voices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedVoices?.map(voice => (
                <Card key={voice.id} className="p-6 bg-card/60 backdrop-blur-sm border-primary/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">{voice.name}</h3>
                            <p className="text-[10px] text-muted-foreground font-mono">{voice.voiceId}</p>
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">{voice.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteVoice(voice.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}
            {(!savedVoices || savedVoices.length === 0) && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-primary/10 rounded-3xl text-muted-foreground">
                    No saved voices yet. Train SKV AI to see them here.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
