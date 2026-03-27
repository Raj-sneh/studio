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
    Globe,
    Lock,
    Link as LinkIcon
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
    // Feature restricted for trial
    return;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Feature restricted for trial
    return;
  };

  const joinWaitingList = () => {
    const subject = encodeURIComponent("Sargam AI: Neural Waiting List Application");
    const body = encodeURIComponent("Hi Sneh,\n\nI'm excited about Sargam AI! I'd love to join the exclusive neural waiting list for the Voice Cloning feature.\n\nThank you!");
    window.location.href = `mailto:hello@sargamskv.in?subject=${subject}&body=${body}`;
  };

  const startRecording = async () => {
    return;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClone = async () => {
    return;
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
    <div className="max-w-4xl mx-auto py-8 space-y-12 pb-32 relative">
      {/* Waiting List Overlay - Neural Chain Visual */}
      <div className="absolute inset-0 z-[60] bg-background/40 backdrop-blur-[2px] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 pointer-events-none">
        {/* Repeating Chain Pattern */}
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center rotate-45 scale-150">
            <div className="grid grid-cols-8 gap-16">
                {[...Array(64)].map((_, i) => <LinkIcon key={i} className="h-24 w-24 text-primary" />)}
            </div>
        </div>

        <div className="relative z-10 space-y-6 flex flex-col items-center pointer-events-auto text-center max-w-sm">
            <div className="space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                    Access Restricted
                </span>
                <p className="text-sm font-bold text-muted-foreground mt-4">
                    This feature is not for everyone.
                </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-card border-2 border-primary/20 shadow-2xl space-y-6">
                <Lock className="h-12 w-12 text-primary mx-auto animate-pulse" />
                <h3 className="text-2xl font-bold font-headline">Join Waiting List</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Neural cloning requires precision mastering. Secure your position in our next deployment cycle.
                </p>
                <Button onClick={joinWaitingList} className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                    Apply for Access
                </Button>
            </div>
        </div>
      </div>

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
                    disabled
                    value={selectedLanguage} 
                    className="w-full bg-muted/50 border border-primary/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                >
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button disabled size="lg" className="h-14 px-8 rounded-2xl">
                    <Sparkles className="mr-2 h-5 w-5" /> Start Neural Training
                </Button>
                <Button disabled variant="outline" size="lg" className="h-14 px-8 rounded-2xl">
                    <Upload className="mr-2 h-5 w-5" /> Upload Training File
                </Button>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Other sections remain for preview as requested, but buttons are disabled internally */}
      <div className="space-y-6 pt-10 border-t border-white/5 opacity-50 grayscale">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">Neural Artist Library</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedVoices?.map(voice => (
                <Card key={voice.id} className="p-6 bg-card/60 rounded-3xl relative">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl">{voice.name}</h3>
                            <p className="text-[9px] text-primary font-bold uppercase">Neural Clone</p>
                        </div>
                    </div>
                </Card>
            ))}
            {(!savedVoices || savedVoices.length === 0) && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl bg-muted/10">
                 <p className="text-muted-foreground">Library preview is currently restricted.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
