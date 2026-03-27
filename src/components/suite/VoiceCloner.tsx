
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
    Sparkles, 
    BrainCircuit,
    Upload,
    Music,
    Globe,
    Lock,
    Link as LinkIcon
} from 'lucide-react';
import { speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Spanish", "French", "German", "Italian", "Japanese", "Korean", "Portuguese"
];

export function VoiceCloner() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [step] = useState<'intro' | 'recording' | 'cloning' | 'ready'>('intro');
  const [selectedLanguage] = useState("English");
  const [clonedVoiceData] = useState<{
    id: string;
    description: string;
    stability: number;
    similarity: number;
  } | null>(null);
  
  const [testText] = useState("Hello! My voice has been optimized by SKV AI. I'm ready to perform.");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: savedVoices } = useCollection(voicesQuery);

  const joinWaitingList = () => {
    const subject = encodeURIComponent("Sargam AI: Neural Waiting List Application");
    const body = encodeURIComponent("Hi Sneh,\n\nI'm excited about Sargam AI! I'd love to join the exclusive neural waiting list for the Voice Cloning feature.\n\nThank you!");
    window.location.href = `mailto:hello@sargamskv.in?subject=${subject}&body=${body}`;
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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 pb-32 relative">
      {/* Waiting List Overlay - Neural Chain Visual */}
      <div className="absolute inset-0 z-[60] bg-background/60 backdrop-blur-[4px] rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 pointer-events-none">
        {/* Repeating Heavy Chain Pattern */}
        <div className="absolute inset-0 opacity-[0.08] flex items-center justify-center rotate-45 scale-150 select-none">
            <div className="grid grid-cols-10 gap-12">
                {[...Array(100)].map((_, i) => <LinkIcon key={i} className="h-16 w-16 text-primary stroke-[3px]" />)}
            </div>
        </div>

        <div className="relative z-10 space-y-8 flex flex-col items-center pointer-events-auto text-center max-w-md">
            <div className="space-y-4">
                <span className="text-[11px] font-black text-primary bg-primary/20 px-6 py-2 rounded-full border border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.3)] animate-pulse uppercase tracking-[0.3em]">
                    Neural Protocol Restricted
                </span>
                <p className="text-lg font-bold text-foreground">
                    This feature is not for everyone.
                </p>
            </div>
            
            <div className="p-10 rounded-[2.5rem] bg-card/90 border-2 border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                <Lock className="h-16 w-16 text-primary mx-auto transition-transform group-hover:scale-110 duration-500" />
                <div className="space-y-3">
                    <h3 className="text-3xl font-bold font-headline tracking-tighter">Join Waiting List</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        Neural cloning requires extreme precision and manual mastering. Secure your position in our next secure deployment cycle.
                    </p>
                </div>
                <Button onClick={joinWaitingList} className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                    Apply for Neural Access
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

      {/* Library section remains for visual reference */}
      <div className="space-y-6 pt-10 border-t border-white/5 opacity-40 grayscale pointer-events-none">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">Neural Artist Library</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedVoices?.map(voice => (
                <Card key={voice.id} className="p-6 bg-card/60 rounded-3xl">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="font-bold text-xl">{voice.name}</h3>
                            <p className="text-[9px] text-primary font-bold uppercase tracking-widest">Neural Clone Locked</p>
                        </div>
                    </div>
                </Card>
            ))}
            {(!savedVoices || savedVoices.length === 0) && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl bg-muted/10">
                 <p className="text-muted-foreground text-sm font-medium">Neural Library is currently restricted for trial users.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
