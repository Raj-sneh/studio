
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Play, StopCircle, Sparkles, Headphones, Keyboard, Volume2, Zap, 
  History, ThumbsUp, ThumbsDown, PlayCircle, Mic2, Star, Globe, Upload, FileAudio
} from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { replaceVocals } from '@/ai/flows/voice-cloning-flow';
import { cn } from '@/lib/utils';
import { getSampler } from '@/lib/samplers';

const formSchema = z.object({
  text: z.string().optional(),
  voice: z.string(),
  singMode: z.boolean().default(false),
  replacementAudio: z.string().optional(),
});

const DEFAULT_VOICES = [
  { id: 'clive', label: 'Clive (Premium)', premium: true },
  { id: 'clara', label: 'Clara (Pro)' },
  { id: 'james', label: 'James' },
  { id: 'alex', label: 'Alex' },
];

export function VocalStudio({ initialPrompt, autogen, onGenerate }: { initialPrompt?: string | null; autogen?: boolean; onGenerate: () => void; }) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'tts' | 'replacement'>('tts');

  const voicesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'clonedVoices'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);
  const { data: savedVoices } = useCollection(voicesQuery);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { text: initialPrompt || '', voice: 'clive', singMode: false },
  });

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => form.setValue('replacementAudio', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRun = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setResult(null);
    stopPlayback();

    try {
      if (activeSubTab === 'replacement') {
        if (!data.replacementAudio) throw new Error("Please upload an audio file to transform.");
        const res = await replaceVocals({
          audioDataUri: data.replacementAudio,
          voiceId: data.voice,
          settings: { stability: 0.5, similarity_boost: 0.75 }
        });
        setResult({ vocalUri: res.audioUri, title: "Vocal Transformation" });
      } else {
        // Standard TTS or Song Gen logic
        const res = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.text, voice: data.voice, sing: data.singMode }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setResult({ vocalUri: json.media, title: "Studio Output" });
      }
      toast({ title: "Success", description: "Vocal track ready." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/40 rounded-2xl mb-8">
            <TabsTrigger value="tts" className="rounded-xl font-bold">Vocal Synthesis</TabsTrigger>
            <TabsTrigger value="replacement" className="rounded-xl font-bold">Vocal Replacement</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRun)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <TabsContent value="tts">
                        <FormField control={form.control} name="text" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Synthesis Script</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Type what you want to hear..." {...field} className="min-h-[150px] text-lg rounded-3xl" />
                                </FormControl>
                            </FormItem>
                        )}/>
                    </TabsContent>
                    <TabsContent value="replacement">
                        <FormField control={form.control} name="replacementAudio" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Upload Singer/Song</FormLabel>
                                <FormControl>
                                    <div className="border-2 border-dashed border-primary/20 rounded-3xl p-12 text-center space-y-4 hover:bg-primary/5 transition-all">
                                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            {field.value ? <Check className="text-primary h-8 w-8" /> : <Upload className="text-primary h-8 w-8" />}
                                        </div>
                                        <div>
                                            <p className="font-bold">{field.value ? "Audio Loaded" : "Drop song here"}</p>
                                            <p className="text-sm text-muted-foreground">SKV AI will replace the existing singer's voice.</p>
                                        </div>
                                        <Input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="sts-upload" />
                                        <Button asChild type="button" variant="outline" className="rounded-xl">
                                            <label htmlFor="sts-upload">Choose File</label>
                                        </Button>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}/>
                    </TabsContent>
                </div>

                <div className="space-y-6">
                    <FormField control={form.control} name="voice" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Artist / Neural Clone</FormLabel>
                            <div className="grid gap-2 h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                                {savedVoices?.map(v => (
                                    <label key={v.voiceId} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", field.value === v.voiceId ? "bg-primary/10 border-primary" : "bg-muted/20 border-transparent")}>
                                        <input type="radio" className="hidden" value={v.voiceId} checked={field.value === v.voiceId} onChange={() => field.onChange(v.voiceId)} />
                                        <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                                            <BrainCircuit className="h-4 w-4 text-secondary" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-[10px] font-bold uppercase truncate">{v.name}</p>
                                            <p className="text-[8px] text-muted-foreground">Neural Clone</p>
                                        </div>
                                    </label>
                                ))}
                                {DEFAULT_VOICES.map(v => (
                                    <label key={v.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", field.value === v.id ? "bg-primary/10 border-primary" : "bg-muted/20 border-transparent")}>
                                        <input type="radio" className="hidden" value={v.id} checked={field.value === v.id} onChange={() => field.onChange(v.id)} />
                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <Mic2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-[10px] font-bold uppercase truncate">{v.label}</p>
                                            <p className="text-[8px] text-muted-foreground">Studio Artist</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </FormItem>
                    )}/>
                </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-16 text-xl rounded-2xl shadow-xl">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {activeSubTab === 'tts' ? 'Synthesize Performance' : 'Replace Vocals in File'}
            </Button>
          </form>
        </Form>

        {result && (
            <Card className="p-8 bg-primary/5 border-primary/20 rounded-3xl flex items-center justify-between gap-6 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <FileAudio className="text-primary h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">Neural output generated by SKV AI.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button onClick={() => new Audio(result.vocalUri).play()} size="lg" className="h-14 px-8 rounded-xl">
                        <Play className="mr-2 h-5 w-5" /> Play Output
                    </Button>
                </div>
            </Card>
        )}
      </Tabs>
    </div>
  );
}
