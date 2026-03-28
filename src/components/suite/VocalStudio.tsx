'use client';

import { useState, useCallback } from 'react';
import * as Tone from 'tone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Play, StopCircle, Sparkles, Mic2, Upload, FileAudio, Check, BrainCircuit, Globe, Music, Link as LinkIcon, Lock
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { replaceVocals, speakWithClone } from '@/ai/flows/voice-cloning-flow';
import { cn } from '@/lib/utils';
import { languageOptions } from '@/ai/flows/text-to-speech-types';

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

export function VocalStudio({ initialPrompt, autogen, onGenerate }: { initialPrompt?: string | null; autogen?: boolean; onGenerate: () => void; }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'tts' | 'replacement'>('tts');

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
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        form.setValue('replacementAudio', base64, { shouldValidate: true });
        form.setValue('replacementFileName', file.name, { shouldValidate: true });
        toast({ title: "File Uploaded", description: `${file.name} is ready for neural transformation.` });
      };
      reader.readAsDataURL(file);
    }
  };

  const joinWaitingList = () => {
    const subject = encodeURIComponent("Sargam AI: Neural Vocal Replacement Waiting List");
    const body = encodeURIComponent("Hi Sneh,\n\nI would like to apply for access to the Neural Vocal Replacement protocol.\n\nThank you!");
    window.location.href = `mailto:hello@sargamskv.in?subject=${subject}&body=${body}`;
  };

  const handleRun = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    stopPlayback();

    try {
      if (activeSubTab === 'replacement') {
        if (!data.replacementAudio) {
          throw new Error("Please upload an audio file to transform.");
        }
        
        const res = await replaceVocals({
          audioDataUri: data.replacementAudio,
          voiceId: data.voice,
          language: data.language,
          settings: { stability: 0.5, similarity_boost: 0.75 }
        });
        setResult({ vocalUri: res.audioUri, title: "Neural Singer Master" });
      } else {
        if (!data.text) {
          throw new Error("Please provide a synthesis script.");
        }
        const res = await speakWithClone({
            text: data.text,
            voiceId: data.voice,
            settings: { stability: 0.5, similarity_boost: 0.75 }
        });
        setResult({ vocalUri: res.audioUri, title: "Neural Vocal Synthesis" });
      }
      toast({ title: "Mastering Complete", description: "Your AI track is ready." });
      onGenerate();
    } catch (e: any) {
      console.error("Vocal Studio Run Error:", e);
      toast({ title: "Studio Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-24">
      <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/40 rounded-2xl mb-8">
            <TabsTrigger value="tts" className="rounded-xl font-bold">Vocal Synthesis</TabsTrigger>
            <TabsTrigger value="replacement" className="rounded-xl font-bold">Vocal Replacement</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRun)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <TabsContent value="tts" className="mt-0">
                        <FormField control={form.control} name="text" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                    Synthesis Script (SKV AI)
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-3 w-3 text-primary" />
                                        <select 
                                            value={form.watch('language')} 
                                            onChange={(e) => form.setValue('language', e.target.value)}
                                            className="bg-transparent text-[10px] border-none focus:ring-0 cursor-pointer text-primary font-bold"
                                        >
                                            {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                        </select>
                                    </div>
                                </FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Type what you want SKV AI to perform..." {...field} className="min-h-[200px] text-lg rounded-3xl bg-muted/20 border-primary/10" />
                                </FormControl>
                            </FormItem>
                        )}/>
                    </TabsContent>
                    
                    <TabsContent value="replacement" className="mt-0 space-y-6 relative overflow-hidden rounded-[2rem]">
                        {/* Diagonal Metal Chains Overlay */}
                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none opacity-30 select-none overflow-hidden">
                            <div className="absolute rotate-45 flex gap-4">
                                {[...Array(20)].map((_, i) => <LinkIcon key={`c1-${i}`} className="h-8 w-8 text-primary stroke-[3px]" />)}
                            </div>
                            <div className="absolute -rotate-45 flex gap-4">
                                {[...Array(20)].map((_, i) => <LinkIcon key={`c2-${i}`} className="h-8 w-8 text-primary stroke-[3px]" />)}
                            </div>
                        </div>

                        {/* Restricted Message Overlay */}
                        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-background/40 backdrop-blur-md pointer-events-none">
                            <div className="pointer-events-auto bg-card border border-primary/40 shadow-2xl p-6 rounded-[2rem] text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Neural Protocol Restricted</p>
                                    <h3 className="text-md font-bold font-headline text-foreground leading-tight">Vocal Replacement Restricted</h3>
                                </div>
                                <Lock className="h-8 w-8 text-primary mx-auto opacity-80" />
                                <div className="space-y-3">
                                    <p className="text-[11px] text-muted-foreground leading-snug px-2 italic">
                                        Professional stem separation requires high-tier neural allocation.
                                    </p>
                                    <Button type="button" onClick={joinWaitingList} className="w-full h-10 text-xs font-black rounded-xl shadow-xl shadow-primary/20">
                                        Join Waiting List
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Blurred/Grayed Content behind chains */}
                        <div className="grayscale opacity-40 blur-sm">
                          <FormField control={form.control} name="language" render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                      Source Song Language
                                  </FormLabel>
                                  <select 
                                      disabled
                                      className="w-full bg-muted/20 border border-primary/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                                  >
                                      {languageOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                  </select>
                              </FormItem>
                          )}/>

                          <FormField control={form.control} name="replacementAudio" render={({ field }) => (
                              <FormItem className="mt-6">
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Master Recording</FormLabel>
                                  <div className="border-2 border-dashed border-primary/20 rounded-3xl p-16 text-center space-y-4 bg-muted/10">
                                      <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                          <Upload className="text-primary h-10 w-10" />
                                      </div>
                                      <p className="font-bold text-lg">Drop Song to Replace Vocals</p>
                                  </div>
                              </FormItem>
                          )}/>
                        </div>
                    </TabsContent>
                </div>

                <div className="space-y-6">
                    <FormField control={form.control} name="voice" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Neural Target Artist</FormLabel>
                            <div className="grid gap-2 h-[400px] overflow-y-auto pr-2 scrollbar-thin mt-2">
                                {savedVoices?.map(v => (
                                    <label key={v.voiceId} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", field.value === v.voiceId ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" : "bg-muted/20 border-transparent hover:bg-muted/30")}>
                                        <input type="radio" className="hidden" value={v.voiceId} checked={field.value === v.voiceId} onChange={() => field.onChange(v.voiceId)} />
                                        <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0 shadow-sm">
                                            <BrainCircuit className="h-5 w-5 text-secondary" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-bold uppercase truncate">{v.name}</p>
                                            <p className="text-[10px] text-muted-foreground">My Neural Clone</p>
                                        </div>
                                    </label>
                                ))}
                                {DEFAULT_VOICES.map(v => (
                                    <label key={v.id} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", field.value === v.id ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" : "bg-muted/20 border-transparent hover:bg-muted/30")}>
                                        <input type="radio" className="hidden" value={v.id} checked={field.value === v.id} onChange={() => field.onChange(v.id)} />
                                        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                            <Mic2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-bold uppercase truncate">{v.label}</p>
                                            <p className="text-[10px] text-muted-foreground">Studio Voice</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </FormItem>
                    )}/>
                </div>
            </div>

            <Button type="submit" disabled={isLoading || activeSubTab === 'replacement'} className="w-full h-16 text-xl rounded-2xl shadow-2xl shadow-primary/10 font-bold">
                {isLoading ? <Loader2 className="animate-spin mr-2 h-6 w-6" /> : <Sparkles className="mr-2 h-6 w-6" />}
                {activeSubTab === 'tts' ? 'Synthesize Neural Performance' : 'Neural Protocol Restricted'}
            </Button>
          </form>
        </Form>

        {result && (
            <Card className="p-10 bg-primary/5 border-primary/20 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in-95 duration-500 shadow-xl border-2 mt-8">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center shadow-inner">
                        <FileAudio className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-2xl font-headline">{result.title}</h3>
                        <p className="text-muted-foreground">Mastered neural output from SKV AI Studio.</p>
                    </div>
                </div>
                <audio controls className="w-full sm:w-auto">
                    <source src={result.vocalUri} type="audio/mpeg" />
                </audio>
            </Card>
        )}
      </Tabs>
    </div>
  );
}

