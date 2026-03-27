'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Sparkles, 
    BrainCircuit,
    Upload,
    Globe,
    Lock,
    Link as LinkIcon,
    Mic2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

const SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Spanish", "French", "German", "Italian", "Japanese", "Korean", "Portuguese"
];

const DEFAULT_VOICE_PREVIEWS = [
    { name: "Global Master", type: "Neural Artist" },
    { name: "Silver Siren", type: "Vocal Clone" },
];

export function VoiceCloner() {
  const { user } = useUser();
  const firestore = useFirestore();

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
    <div className="max-w-4xl mx-auto py-8 space-y-12 relative min-h-[800px]">
      
      {/* 
          Main Interaction Area Overlay (Waitlist Box & Chains)
      */}
      <div className="absolute inset-0 z-50 flex flex-col items-center pointer-events-none">
          {/* Join Waiting List Box - Positioned centrally over the top card */}
          <div className="mt-40 pointer-events-auto bg-card/95 border-2 border-primary/40 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-10 rounded-[2.5rem] w-full max-w-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Neural Protocol Restricted</p>
                  <h3 className="text-xl font-bold font-headline text-foreground">This feature is not for everyone.</h3>
              </div>
              <Lock className="h-12 w-12 text-primary mx-auto shadow-primary/50" />
              <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                      Neural cloning requires extreme precision and manual mastering. Secure your position in our next secure deployment cycle.
                  </p>
                  <Button onClick={joinWaitingList} className="w-full h-14 text-lg font-black rounded-2xl shadow-2xl shadow-primary/20">
                      Join Waiting List
                  </Button>
              </div>
          </div>
      </div>

      {/* 
          Visible Preview Content 
          This part remains scrollable but the buttons are disabled and visually "chained".
      */}
      <div className="space-y-16">
        
        {/* Top Training Card */}
        <Card className="border-primary/20 bg-card/40 rounded-[2rem] overflow-hidden relative">
          <CardHeader className="text-center pt-10">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">SKV AI Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-2">
              Train your personal neural artist in your native language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10 relative">
             
             {/* Diagonal Chains specifically over the action buttons */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 select-none overflow-hidden">
                <div className="absolute rotate-45 flex gap-4">
                    {[...Array(20)].map((_, i) => <LinkIcon key={`c1-${i}`} className="h-10 w-10 text-primary stroke-[3px]" />)}
                </div>
                <div className="absolute -rotate-45 flex gap-4">
                    {[...Array(20)].map((_, i) => <LinkIcon key={`c2-${i}`} className="h-10 w-10 text-primary stroke-[3px]" />)}
                </div>
             </div>

             <div className="max-w-xs mx-auto space-y-2 mb-4 grayscale opacity-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                    <Globe className="h-3 w-3" /> Training Language
                </label>
                <select 
                    disabled
                    className="w-full bg-muted/50 border border-primary/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                >
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 justify-center grayscale opacity-50">
                <Button disabled size="lg" className="h-14 px-8 rounded-2xl">
                    <Sparkles className="mr-2 h-5 w-5" /> Start Neural Training
                </Button>
                <Button disabled variant="outline" size="lg" className="h-14 px-8 rounded-2xl">
                    <Upload className="mr-2 h-5 w-5" /> Upload Training File
                </Button>
             </div>
          </CardContent>
        </Card>

        {/* Artist Library Preview Section */}
        <div className="space-y-8 relative pb-20">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                <Mic2 className="text-primary h-6 w-6" />
                Neural Artist Library
            </h2>

            {/* Chains specifically over the library items */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-30 select-none overflow-hidden">
                <div className="absolute rotate-12 flex gap-8">
                    {[...Array(20)].map((_, i) => <LinkIcon key={`l1-${i}`} className="h-12 w-12 text-primary stroke-[2px]" />)}
                </div>
                <div className="absolute -rotate-12 flex gap-8">
                    {[...Array(20)].map((_, i) => <LinkIcon key={`l2-${i}`} className="h-12 w-12 text-primary stroke-[2px]" />)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grayscale opacity-40">
                {/* Mocked/Existing Voices */}
                {DEFAULT_VOICE_PREVIEWS.map((v, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-muted/20 border border-primary/5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-tight">{v.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{v.type}</p>
                        </div>
                    </div>
                ))}
                <div className="p-6 rounded-3xl border-2 border-dashed border-primary/10 flex items-center justify-center text-muted-foreground italic text-xs">
                    More clones restricted...
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}