'use client';

import { useState, useCallback } from 'react';
import * as Tone from 'tone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Sparkles, Mic2, Upload, FileAudio, BrainCircuit, Globe, Lock, Zap, ShieldAlert
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

export function VocalStudio({ initialPrompt, onGenerate }: { initialPrompt?: string | null; autogen?: boolean; onGenerate: () => void; }) {
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
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isPremium = profile?.plan === 'creator' || profile?.plan === 'pro' || isAdmin;

  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: savedVoices } = useCollection(voicesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: initialPrompt || '', voice: 'clive', language: 'en', replacementAudio: '', replacementFileName: '' },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Max ${MAX_FILE_SIZE_MB}MB allowed.`, variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('replacementAudio', reader.result as string, { shouldValidate: true });
        form.setValue('replacementFileName', file.name, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRun = async (values: z.infer<typeof formSchema>) => {
    if (!user) return router.push('/login');
    setIsLoading(true);
    setResult(null);
    setLoadingStatus("Verifying credits...");

    try {
      if (!isAdmin) {
        const cost = activeSubTab === 'replacement' ? SWAP_COST : TTS_COST;

        const creditRes = await fetch('/api/credits/use', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.uid, amount: cost })
        });

        const errData = await creditRes.json().catch(() => ({}));
        if (!creditRes.ok) {
            throw new Error(errData.error || "Neural Engine connection failed. Please try again.");
        }
      }

      if (activeSubTab === 'replacement') {
        if (!values.replacementAudio) throw new Error("Please upload audio.");
        setLoadingStatus("Waking up Neural Engine...");
        
        const res = await replaceVocals({
          audioDataUri: values.replacementAudio,
          voiceId: values.voice,
          language: values.language,
          settings: { stability: 0.35, similarity_boost: 0.85 }
        });
        if (!res.success) throw new Error(res.error);
        setResult({ audioUri: res.data.audioUri, title: "Neural Swap Complete" });
      } else {
        if (!values.text) throw new Error("Please enter text.");
        setLoadingStatus("Synthesizing voice...");
        
        const res = await speakWithClone({
            text: values.text,
            voiceId: values.voice,
            settings: { stability: 0.5, similarity_boost: 0.75 }
        });
        if (!res.success) throw new Error(res.error);
        setResult({ audioUri: res.data.audioUri, title: "Synthesis Complete" });
      }
      toast({ title: "Success!", description: "AI track generated successfully." });
      onGenerate();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/40 rounded-2xl mb-8">
            <TabsTrigger value="tts" className="rounded-xl font-bold">TTS (Synthesis)</TabsTrigger>
            <TabsTrigger value="replacement" className="rounded-xl font-bold">Voice Swap (Cloner)</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRun)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <TabsContent value="tts" className="mt-0">
                        <FormField control={form.control} name="text" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase flex items-center justify-between">
                                    Text Input
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full text-primary border border-primary/20">
                                            <Zap className="h-3 w-3 fill-primary" /> {isAdmin ? 'Unlimited' : `${TTS_COST} Credits`}
                                        </div>
                                        <Globe className="h-3 w-3 text-primary" />
                                        <select value={form.watch('language')} onChange={(e) => form.setValue('language', e.target.value)} className="bg-transparent text-[10px] font-bold outline-none">
                                            {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </div>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative group z-0">
                                        <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                                        <Textarea placeholder="What should the AI say?" {...field} className="relative z-10 min-h-[200px] rounded-3xl bg-muted/20 border-primary/10" />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}/>
                    </TabsContent>
                    
                    <TabsContent value="replacement" className="mt-0 relative overflow-hidden rounded-[2rem]">
                        {!isPremium && !isProfileLoading && profile && (
                          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-background/60 backdrop-blur-md text-center p-6">
                                <Lock className="h-10 w-10 text-primary mb-4" />
                                <h3 className="text-lg font-bold">Premium Required</h3>
                                <p className="text-xs text-muted-foreground italic mb-4">Voice Swap requires Creator or Pro plan.</p>
                                <Button type="button" onClick={() => router.push('/pricing')} className="rounded-xl">Upgrade Now</Button>
                          </div>
                        )}

                        <div className={cn((!isPremium && !isProfileLoading && profile) && "grayscale opacity-40 blur-sm")}>
                          <FormField control={form.control} name="language" render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase flex items-center justify-between">
                                      Source Language
                                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full text-primary border border-primary/20">
                                          <Zap className="h-3 w-3 fill-primary" /> {isAdmin ? 'Unlimited' : `${SWAP_COST} Credits`}
                                      </div>
                                  </FormLabel>
                                  <select value={field.value} onChange={(e) => field.onChange(e.target.value)} disabled={!isPremium} className="w-full bg-muted/20 border border-primary/10 rounded-xl px-4 py-2 text-sm h-12">
                                      {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                  </select>
                              </FormItem>
                          )}/>

                          <FormField control={form.control} name="replacementAudio" render={() => (
                              <FormItem className="mt-6">
                                  <FormLabel className="text-[10px] font-black uppercase">Upload Audio (Max 10MB)</FormLabel>
                                  <div className="relative border-2 border-dashed border-primary/20 rounded-3xl p-16 text-center bg-muted/10 transition-all hover:bg-primary/5">
                                      <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={!isPremium && !isProfileLoading} />
                                      <Upload className="text-primary h-10 w-10 mx-auto mb-2" />
                                      <p className="font-bold text-xs">{form.watch('replacementFileName') || 'Click to upload voice sample'}</p>
                                  </div>
                              </FormItem>
                          )}/>
                          
                          <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                              <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                  Neural Voice Swap is for research and creative use. By using this tool, you confirm you have permission to use the source audio. Sargam AI assumes no liability for misuse.
                              </p>
                          </div>
                        </div>
                    </TabsContent>
                </div>

                <div className="space-y-6">
                    <FormField control={form.control} name="voice" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase">Neural Profile</FormLabel>
                            <div className="grid gap-2 h-[400px] overflow-y-auto pr-2 mt-2">
                                {savedVoices?.map(v => (
                                    <label key={v.voiceId} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", field.value === v.voiceId ? "bg-primary/10 border-primary" : "bg-muted/10 border-transparent hover:bg-muted/20")}>
                                        <input type="radio" className="hidden" value={v.voiceId} checked={field.value === v.voiceId} onChange={() => field.onChange(v.voiceId)} />
                                        <BrainCircuit className="h-5 w-5 text-secondary shrink-0" />
                                        <div className="truncate"><p className="text-xs font-bold uppercase truncate">{v.name}</p></div>
                                    </label>
                                ))}
                                {DEFAULT_VOICES.map(v => (
                                    <label key={v.id} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", field.value === v.id ? "bg-primary/10 border-primary" : "bg-muted/10 border-transparent hover:bg-muted/20")}>
                                        <input type="radio" className="hidden" value={v.id} checked={field.value === v.id} onChange={() => field.onChange(v.id)} />
                                        <Mic2 className="h-5 w-5 text-primary shrink-0" />
                                        <div className="truncate"><p className="text-xs font-bold uppercase truncate">{v.label}</p></div>
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
                    <div className="flex items-center"><Loader2 className="animate-spin mr-2 h-6 w-6" /> Running Neural Engine...</div>
                    <span className="text-[10px] font-normal mt-1 opacity-70">{loadingStatus}</span>
                  </div>
                ) : (
                  <><Sparkles className="mr-2 h-6 w-6" /> Start Transformation</>
                )}
            </Button>
          </form>
        </Form>

        {result && (
            <Card className="p-10 bg-primary/5 border-primary/20 rounded-3xl mt-8 border-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-14 w-14 bg-primary/20 rounded-xl flex items-center justify-center">
                        <FileAudio className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">Neural track ready for preview.</p>
                    </div>
                </div>
                <audio controls className="w-full h-14" src={result.audioUri} key={result.audioUri} />
            </Card>
        )}
      </Tabs>
    </div>
  );
}
