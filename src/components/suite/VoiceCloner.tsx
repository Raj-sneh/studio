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

const ADMIN_EMAIL = 'snehkumarverma2011@gmail.com';

export function VoiceCloner() {
  const { user } = useUser();
  const firestore = useFirestore();

  const isAdmin = user?.email === ADMIN_EMAIL;

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
    <div className="max-w-4xl mx-auto py-8 space-y-12 relative min-h-[700px]">
      
      {/* 
          CENTRAL WAITING LIST PROTOCOL (Small & Translucent)
      */}
      {!isAdmin && (
        <div className="absolute inset-0 z-50 flex flex-col items-center pointer-events-none pt-40">
            <div className="pointer-events-auto bg-card/40 border border-primary/40 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 rounded-[2rem] w-full max-w-[280px] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Neural Protocol Restricted</p>
                    <h3 className="text-md font-bold font-headline text-foreground leading-tight">This feature is not for everyone.</h3>
                </div>
                <Lock className="h-8 w-8 text-primary mx-auto opacity-80" />
                <div className="space-y-3">
                    <p className="text-[11px] text-muted-foreground leading-snug px-2 italic">
                        Cloning requires extreme precision. Join our next deployment cycle.
                    </p>
                    <Button onClick={joinWaitingList} className="w-full h-10 text-xs font-black rounded-xl shadow-xl shadow-primary/20">
                        Join Waiting List
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* 
          Main Content Area
      */}
      <div className="space-y-16">
        
        {/* Top Training Card */}
        <Card className="border-primary/20 bg-card/20 rounded-[2rem] overflow-hidden relative">
          <CardHeader className="text-center pt-10">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BrainCircuit className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">SKV AI Voice Cloner</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-1 text-xs">
              Train your personal neural artist in your native language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-10 relative">
             
             {/* Diagonal Metal Chains specifically over the action buttons area */}
             {!isAdmin && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 select-none overflow-hidden">
                  <div className="absolute rotate-45 flex gap-4">
                      {[...Array(15)].map((_, i) => <LinkIcon key={`c1-${i}`} className="h-8 w-8 text-primary stroke-[3px]" />)}
                  </div>
                  <div className="absolute -rotate-45 flex gap-4">
                      {[...Array(15)].map((_, i) => <LinkIcon key={`c2-${i}`} className="h-8 w-8 text-primary stroke-[3px]" />)}
                  </div>
               </div>
             )}

             <div className={cn("max-w-xs mx-auto space-y-2 mb-4", !isAdmin && "grayscale opacity-40")}>
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                    <Globe className="h-3 w-3" /> Training Language
                </label>
                <select 
                    disabled={!isAdmin}
                    className="w-full bg-muted/50 border border-primary/10 rounded-xl px-4 py-2 text-xs focus:outline-none"
                >
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                    ))}
                </select>
             </div>
             <div className={cn("flex flex-col sm:flex-row gap-4 justify-center", !isAdmin && "grayscale opacity-40")}>
                <Button disabled={!isAdmin} size="lg" className="h-12 px-6 rounded-xl">
                    <Sparkles className="mr-2 h-4 w-4" /> Start Neural Training
                </Button>
                <Button disabled={!isAdmin} variant="outline" size="lg" className="h-12 px-6 rounded-xl">
                    <Upload className="mr-2 h-4 w-4" /> Upload Training File
                </Button>
             </div>
          </CardContent>
        </Card>

        {/* Artist Library Preview Section */}
        <div className="space-y-6 relative pb-20">
            <h2 className="text-xl font-bold font-headline flex items-center gap-3">
                <Mic2 className="text-primary h-5 w-5" />
                Neural Artist Library
            </h2>

            {/* Chains specifically over the library items */}
            {!isAdmin && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none opacity-20 select-none overflow-hidden">
                  <div className="absolute rotate-12 flex gap-8">
                      {[...Array(10)].map((_, i) => <LinkIcon key={`l1-${i}`} className="h-10 w-10 text-primary stroke-[2px]" />)}
                  </div>
                  <div className="absolute -rotate-12 flex gap-8">
                      {[...Array(10)].map((_, i) => <LinkIcon key={`l2-${i}`} className="h-10 w-10 text-primary stroke-[2px]" />)}
                  </div>
              </div>
            )}

            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", !isAdmin && "grayscale opacity-30")}>
                {/* Mocked/Existing Voices */}
                {DEFAULT_VOICE_PREVIEWS.map((v, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-muted/10 border border-primary/5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BrainCircuit className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-tight">{v.name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">{v.type}</p>
                        </div>
                    </div>
                ))}
                {!isAdmin && (
                  <div className="p-5 rounded-3xl border-2 border-dashed border-primary/5 flex items-center justify-center text-muted-foreground italic text-[10px]">
                      More clones restricted...
                  </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}