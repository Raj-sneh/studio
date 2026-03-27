'use client';

import { useState } from 'react';
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
import { collection, query, orderBy } from 'firebase/firestore';

const SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Spanish", "French", "German", "Italian", "Japanese", "Korean", "Portuguese"
];

export function VoiceCloner() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedLanguage] = useState("English");
  
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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 pb-32 relative min-h-[600px]">
      {/* 
          Neural Chain Overlay 
          This blocks interaction but allows the user to see the UI "underneath".
      */}
      <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center p-8 overflow-hidden rounded-3xl">
        {/* Background Blur for the locked section */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-md pointer-events-none" />

        {/* Metal Chain Cross Pattern */}
        <div className="absolute inset-0 opacity-[0.2] flex items-center justify-center rotate-45 scale-150 select-none pointer-events-none">
            <div className="grid grid-cols-12 gap-x-16 gap-y-10">
                {[...Array(144)].map((_, i) => <LinkIcon key={i} className="h-12 w-12 text-primary stroke-[4px]" />)}
            </div>
        </div>
        <div className="absolute inset-0 opacity-[0.2] flex items-center justify-center -rotate-45 scale-150 select-none pointer-events-none">
            <div className="grid grid-cols-12 gap-x-16 gap-y-10">
                {[...Array(144)].map((_, i) => <LinkIcon key={i} className="h-12 w-12 text-primary stroke-[4px]" />)}
            </div>
        </div>

        {/* Central Square Waiting List Box */}
        <div className="relative z-10 space-y-8 flex flex-col items-center text-center max-w-md w-full">
            <div className="space-y-4">
                <span className="text-[11px] font-black text-primary bg-primary/20 px-6 py-2 rounded-full border border-primary/40 shadow-[0_0_30px_rgba(var(--primary),0.5)] animate-pulse uppercase tracking-[0.3em]">
                    Neural Protocol Restricted
                </span>
                <p className="text-xl font-bold text-foreground font-headline">
                    This feature is not for everyone.
                </p>
            </div>
            
            <div className="p-10 rounded-[2.5rem] bg-card/95 border-2 border-primary/40 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                <Lock className="h-16 w-16 text-primary mx-auto transition-transform group-hover:scale-110 duration-500 shadow-primary/50" />
                <div className="space-y-3">
                    <h3 className="text-3xl font-bold font-headline tracking-tighter">Join Waiting List</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        Neural cloning requires extreme precision and manual mastering. Secure your position in our next secure deployment cycle.
                    </p>
                </div>
                <Button onClick={joinWaitingList} className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-transform">
                    Apply for Neural Access
                </Button>
            </div>
        </div>
      </div>

      {/* 
          Disabled Preview Content 
          Visible but "grayed out" by the overlay.
      */}
      <div className="opacity-30 grayscale pointer-events-none transition-all">
        <Card className="border-primary/20 bg-card/40 rounded-3xl overflow-hidden relative">
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

        {/* Artist Library Preview */}
        <div className="space-y-6 pt-10 border-t border-white/5">
            <h2 className="text-2xl font-bold font-headline">Neural Artist Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl bg-muted/10">
                    <p className="text-muted-foreground text-sm font-medium">Neural Library is currently restricted for trial users.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
