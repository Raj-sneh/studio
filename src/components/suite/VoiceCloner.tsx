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
    Check,
    BrainCircuit,
    Upload,
    Save,
    Trash2,
    Music,
    Globe
} from 'lucide-react';
import { cloneVoice, speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { generateTrainingParagraph } from '@/ai/flows/voice-training-flow';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Spanish", "French", "German", "Italian", "Japanese", "Korean", "Portuguese"
];

export function VoiceCloner() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [step, setStep] = useState<'intro' | 'recording' | 'cloning' | 'ready'>('intro');
  const [selectedLanguage, setSelectedLanguage] = useState("English");
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
  
  const [testText, setTestText] = useState("Hello! My voice has been optimized by SKV AI. I'm ready to perform.");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: savedVoices } = useCollection(voicesQuery);

  const startCloningProcess = async () => {
    setIsProcessing(true);
    try {
        const fetchedScript = await generateTrainingParagraph(selectedLanguage);
        setScript(fetchedScript);
        setStep('recording');
    } catch (e) {
        toast({ title: "Connection Error", description: "SKV AI script failed to load.", variant: "destructive" });
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
        toast({ title: "Sample Loaded", description: "Vocal sample ready." });
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
      toast({ title: "Mic Access Denied", description: "Please enable your microphone.", variant: "destructive" });
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
    setIsProcessing(true);
    setStep('cloning');
    try {
        const result = await cloneVoice({
            name: voiceName || `SKV Artist ${Date.now()}`,
            samples: [sample]
        });
        setClonedVoiceData({
            id: result.voiceId,
            description: result.description,
            stability: result.suggestedSettings.stability,
            similarity: result.suggestedSettings.similarity_boost
        });
        setStep('ready');
        toast({ title: "Neural Profile Ready", description: "Your clone is created." });
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
    try {
        const voiceDocRef = doc(firestore, 'users', user.uid, 'clonedVoices', clonedVoiceData.id);
        setDocumentNonBlocking(voiceDocRef, {
            voiceId: clonedVoiceData.id,
            name: voiceName || "My Neural Artist",
            description: clonedVoiceData.description,
            stability: clonedVoiceData.stability,
            similarity: clonedVoiceData.similarity,
            createdAt: serverTimestamp()
        }, { merge: true });
        
        toast({ title: "Artist Saved", description: "Added to your studio profile." });
        reset();
    } catch (e) {
        toast({ title: "Save Failed", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const deleteVoice = (id: string) => {
    if (!user || !firestore) return;
    const voiceRef = doc(firestore, 'users', user.uid, 'clonedVoices', id);
    deleteDocumentNonBlocking(voiceRef);
    toast({ title: "Neural Artist Removed" });
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
        toast({ title: "Synthesis Failed", description: e.message, variant: "destructive" });
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
    <div className="max-w-4xl mx-auto py-8 space-y-12 pb-32">
      {step === 'intro' && (
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Music className="h-32 w-32" />
          </div>
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline">SKV AI Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2">
              Train your personal neural artist in your native language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10 text-center">
             <div className="max-w-xs mx-auto space-y-2 mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                    <Globe className="h-3 w-3" /> Training Language
                </label>
                <select 
                    value={selectedLanguage} 
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-muted/50 border border-primary/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={startCloningProcess} disabled={isProcessing} size="lg" className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/10">
                    <Sparkles className="mr-2 h-5 w-5" /> Start Neural Training
                </Button>
                <div className="relative">
                    <Input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="training-upload" />
                    <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl cursor-pointer border-primary/20 hover:bg-primary/5">
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
        <Card className="border-primary/20 bg-card/40 rounded-3xl p-10 shadow-2xl">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" /> SKV Neural Pattern Capture ({selectedLanguage})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={reset} className="rounded-full">Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 text-center">
            <div className="min-h-[140px] flex items-center justify-center p-8 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/20 italic text-xl leading-relaxed">
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
                    style={{ touchAction: 'none' }}
                >
                    {isRecording ? <Square className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </Button>
                <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {isRecording ? "Capturing Pattern..." : sample ? "Pattern Captured" : "Hold to Record"}
                </div>
            </div>
            {sample && (
                <div className="pt-10 border-t border-white/5 space-y-6 animate-in fade-in">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Name Your Artist</span>
                        <Input 
                            placeholder="e.g., My Studio Voice" 
                            value={voiceName} 
                            onChange={(e) => setVoiceName(e.target.value)}
                            className="h-12 text-center rounded-xl bg-background/50"
                        />
                    </div>
                    <Button onClick={handleClone} disabled={isProcessing} size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20">
                        {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <BrainCircuit className="mr-2" />}
                        Generate Neural Profile
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'cloning' && (
        <Card className="border-none bg-transparent py-24 text-center space-y-8">
            <div className="relative inline-block">
                <Loader2 className="mx-auto h-20 w-20 animate-spin text-primary" />
                <Sparkles className="absolute top-0 right-0 h-6 w-6 text-primary animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold font-headline">SKV AI is building your Neural Blueprint...</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Analyzing unique vocal DNA in {selectedLanguage}.</p>
        </Card>
      )}

      {step === 'ready' && clonedVoiceData && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <Card className="border-primary/20 bg-primary/5 rounded-3xl p-8 border-2 shadow-inner">
            <h3 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">SKV AI Neural Analysis</h3>
            <p className="text-lg italic leading-relaxed">"{clonedVoiceData.description}"</p>
          </Card>
          
          <Card className="p-10 rounded-3xl space-y-10 border-primary/10 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Stability</span>
                        <span className="text-xs font-bold text-primary">{Math.round(clonedVoiceData.stability * 100)}%</span>
                    </div>
                    <Slider value={[clonedVoiceData.stability]} min={0} max={1} step={0.01} onValueChange={([v]) => setClonedVoiceData({...clonedVoiceData, stability: v})} />
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Similarity Boost</span>
                        <span className="text-xs font-bold text-primary">{Math.round(clonedVoiceData.similarity * 100)}%</span>
                    </div>
                    <Slider value={[clonedVoiceData.similarity]} min={0} max={1} step={0.01} onValueChange={([v]) => setClonedVoiceData({...clonedVoiceData, similarity: v})} />
                </div>
            </div>
            
            <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Test Script</span>
                <Textarea value={testText} onChange={(e) => setTestText(e.target.value)} className="min-h-[120px] text-lg rounded-2xl bg-muted/20" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSpeak} disabled={isGeneratingSpeech} size="lg" className="flex-1 h-16 rounded-2xl text-lg font-bold">
                    {isGeneratingSpeech ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />} Test Neural Artist
                </Button>
                <Button onClick={saveToProfile} variant="secondary" size="lg" className="flex-1 h-16 rounded-2xl text-lg font-bold">
                    <Save className="mr-2" /> Save to Studio
                </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-6 pt-10 border-t border-white/5">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">Neural Artist Library</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedVoices?.map(voice => (
                <Card key={voice.id} className="group p-6 bg-card/60 backdrop-blur-sm border-primary/5 hover:border-primary/20 transition-all rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-110" />
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl">{voice.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{voice.voiceId}</span>
                                <span className="text-[9px] text-primary font-bold uppercase">SKV Neural</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4 line-clamp-3 italic leading-relaxed border-l-2 border-primary/20 pl-3">
                                {voice.description}
                            </p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8" 
                            onClick={() => deleteVoice(voice.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
