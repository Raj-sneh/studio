'use client';

import { useState, useCallback } from 'react';
import * as Tone from 'tone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Play, StopCircle, Sparkles, Mic2, Upload, FileAudio, BrainCircuit, Globe, Music, Link as LinkIcon, Lock, Zap, AlertCircle, ShieldAlert
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { replaceVocals, speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { cn } from '@/lib/utils';
import { languageOptions } from '@/ai/flows/text-to-speech-types';
import type { UserProfile } from '@/types';

const formSchema = z.object({
  text: z.string().optional(),
  voice: z.string(),
  language: z.string().default('en'),
  singMode: z.boolean().default(false),
  replacementAudio: z.string().optional(),
  replacementFileName: z.string().optional(),
});

const DEFAULT_VOICES = [
  { id: 'clive', label: 'SKV Master (Default)' },
  { id: 'clara', label: 'Clara (Pro)' },
  { id: 'james', label: 'James' },
  { id: 'alex', label: 'Alex' },
];

const ADMIN_EMAIL = 'snehkumarverma2011@gmail.com';
const TTS_COST = 2;
const SWAP_COST = 15;
const MAX_FILE_SIZE_MB = 10;

export function VocalStudio({ initialPrompt, autogen, onGenerate }: { initialPrompt?: string | null; autogen?: boolean; onGenerate: () => void; }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [result, setResult] = useState<{ audioUri: string; title: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'tts' | 'replacement'>('tts');

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const isProfileLoading = profile === undefined;
  const isPremium = profile?.plan === 'creator' || profile?.plan === 'pro' || user?.email === ADMIN_EMAIL;

  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: savedVoices } = useCollection(voicesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: initialPrompt || '', voice: 'clive', language: 'en', singMode: false, replacementAudio: '', replacementFileName: '' },
  });

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('replacementAudio', reader.result as string, { shouldValidate: true });
        form.setValue('replacementFileName', file.name, { shouldValidate: true });
        toast({ title: "File Uploaded", description: `${file.name} is ready.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRun = async (data: z.infer<typeof formSchema>) => {
    if (!user) {
        toast({ title: "Sign in required", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    setResult(null);
    setLoadingStatus("Verifying credits...");
    stopPlayback();

    try {
      const cost = activeSubTab === 'replacement' ? SWAP_COST : TTS_COST;
      const creditRes = await fetch('/api/credits/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, amount: cost })
      });

      if (!creditRes.ok) {
        const errorData = await creditRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Insufficient credits.");
      }

      if (activeSubTab === 'replacement') {
        if (!data.replacementAudio) throw new Error("Please upload an audio file first.");
        setLoadingStatus("Waking up Neural Engine...");
        const res = await replaceVocals({ audioDataUri: data.replacementAudio, voiceId: data.voice });
        setResult({ audioUri: res.audioUri, title: "Neural Swap Complete" });
      } else {
        if (!data.text) throw new Error("Please enter some text first.");
        setLoadingStatus("Synthesizing neural voice...");
        const res = await speakWithClone({ text: data.text, voiceId: data.voice });
        setResult({ audioUri: res.audioUri, title: "Synthesis Complete" });
      }

      toast({ title: "Success!", description: "AI track generated successfully." });
      onGenerate();
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/40 rounded-2xl mb-8">
            <TabsTrigger value="tts" className="rounded-xl font-bold">TTS (Text to Speech)</TabsTrigger>
            <TabsTrigger value="replacement" className="rounded-xl font-bold">Voice Swap</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRun)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <TabsContent value="tts" className="mt-0">
                        <FormField control={form.control} name="text" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                    Enter Text
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                                        <Zap className="h-3 w-3 fill-primary" /> {TTS_COST} Credits
                                    </div>
                                </FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Type what you want the AI to say..." {...field} className="min-h-[200px] text-lg rounded-3xl bg-muted/20 border-primary/10" />
                                </FormControl>
                            </FormItem>
                        )}/>
                    </TabsContent>
                    
                    <TabsContent value="replacement" className="mt-0 space-y-6 relative overflow-hidden rounded-[2rem]">
                        {!isPremium && !isProfileLoading && (
                          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md">
                                <div className="bg-card border border-primary/40 shadow-2xl p-8 rounded-[2rem] text-center space-y-4 max-w-[280px]">
                                    <Lock className="h-10 w-10 text-primary mx-auto" />
                                    <h3 className="text-lg font-bold">Premium Required</h3>
                                    <p className="text-xs text-muted-foreground italic">Voice Swap requires a Creator or Pro plan.</p>
                                    <Button type="button" onClick={() => router.push('/pricing')} className="w-full rounded-xl">Upgrade Now</Button>
                                </div>
                          </div>
                        )}

                        <div className={cn((!isPremium && !isProfileLoading) && "grayscale opacity-40 blur-sm")}>
                          <FormField control={form.control} name="replacementAudio" render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                      Upload Audio
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                                          <Zap className="h-3 w-3 fill-primary" /> {SWAP_COST} Credits
                                      </div>
                                  </FormLabel>
                                  <div className="relative border-2 border-dashed border-primary/20 rounded-3xl p-16 text-center space-y-4 bg-muted/10">
                                      <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={!isPremium && !isProfileLoading} />
                                      <Upload className="text-primary h-10 w-10 mx-auto" />
                                      <p className="font-bold text-sm">{form.watch('replacementFileName') || 'Click to swap voice'}</p>
                                  </div>
                              </FormItem>
                          )}/>
                          <div className="mt-6 p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex gap-3">
                              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                  Use this tool at your own risk. By swapping vocals, you confirm you have permission to use the source audio. Sargam AI assumes no liability for unauthorized usage.
                              </p>
                          </div>
                        </div>
                    </TabsContent>
                </div>

                <div className="space-y-6">
                    <FormField control={form.control} name="voice" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Profile</FormLabel>
                            <div className="grid gap-2 h-[400px] overflow-y-auto pr-2 mt-2">
                                {savedVoices?.map(v => (
                                    <label key={v.voiceId} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", field.value === v.voiceId ? "bg-primary/10 border-primary" : "bg-muted/10 border-transparent hover:bg-muted/20")}>
                                        <input type="radio" className="hidden" value={v.voiceId} checked={field.value === v.voiceId} onChange={() => field.onChange(v.voiceId)} />
                                        <BrainCircuit className="h-5 w-5 text-secondary shrink-0" />
                                        <p className="text-xs font-bold uppercase truncate">{v.name}</p>
                                    </label>
                                ))}
                                {DEFAULT_VOICES.map(v => (
                                    <label key={v.id} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", field.value === v.id ? "bg-primary/10 border-primary" : "bg-muted/10 border-transparent hover:bg-muted/20")}>
                                        <input type="radio" className="hidden" value={v.id} checked={field.value === v.id} onChange={() => field.onChange(v.id)} />
                                        <Mic2 className="h-5 w-5 text-primary shrink-0" />
                                        <p className="text-xs font-bold uppercase truncate">{v.label}</p>
                                    </label>
                                ))}
                            </div>
                        </FormItem>
                    )}/>
                </div>
            </div>

            <Button type="submit" disabled={isLoading || (activeSubTab === 'replacement' && !isPremium && !isProfileLoading)} className="w-full h-16 text-xl rounded-2xl font-bold shadow-xl shadow-primary/20">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center"><Loader2 className="animate-spin mr-2 h-6 w-6" /> Processing...</div>
                    <span className="text-[10px] font-normal mt-1 text-primary-foreground/70">{loadingStatus}</span>
                  </div>
                ) : (
                  <><Sparkles className="mr-2 h-6 w-6" /> Start Neural Engine</>
                )}
            </Button>
          </form>
        </Form>

        {result && (
            <Card className="p-10 bg-primary/5 border-primary/20 rounded-3xl flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 mt-8 border-2">
                <div className="flex items-center gap-6 w-full">
                    <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                        <FileAudio className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl">{result.title}</h3>
                        <p className="text-muted-foreground">Neural performance ready for download.</p>
                    </div>
                </div>
                <audio controls className="w-full h-14" src={result.audioUri} />
            </Card>
        )}
      </Tabs>
    </div>
  );
}