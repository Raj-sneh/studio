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
  Loader2, 
  Music2, 
  Play, 
  StopCircle, 
  Sparkles, 
  Headphones, 
  Keyboard, 
  Volume2, 
  Zap, 
  History, 
  ThumbsUp, 
  ThumbsDown,
  PlayCircle,
  Mic2,
  Star
} from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getSampler } from '@/lib/samplers';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  text: z.string().min(5, { message: "Please enter at least 5 characters." }),
  voice: z.string(),
  singMode: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const voices = [
  { id: 'clive', label: 'Clive (Premium)', premium: true },
  { id: 'clara', label: 'Clara (Pro)' },
  { id: 'james', label: 'James (Narrator)' },
  { id: 'alex', label: 'Alex (Balanced)' },
  { id: 'marcus', label: 'Marcus (Warm)' },
  { id: 'elena', label: 'Elena (Bright)' },
  { id: 'maya', label: 'Maya (Crisp)' },
  { id: 'silas', label: 'Silas (Mellow)' },
  { id: 'victor', label: 'Victor (Bold)' },
  { id: 'sophie', label: 'Sophie (Gentle)' },
  { id: 'kai', label: 'Kai (Cool)' },
];

interface VocalStudioProps {
  initialPrompt?: string | null;
  autogen?: boolean;
  onGenerate: () => void;
}

export function VocalStudio({ initialPrompt, autogen, onGenerate }: VocalStudioProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const [vocalVolume, setVocalVolume] = useState(0);
  const [vocalSpeed, setVocalSpeed] = useState(1.0);
  const [pianoVolume, setPianoVolume] = useState(-10);
  const [pianoTempo, setPianoTempo] = useState(120);
  const [isAutoSync, setIsAutoSync] = useState(true);
  
  const [feedbackComment, setFeedbackComment] = useState('');

  const vocalPlayerRef = useRef<Tone.Player | null>(null);
  const pianoPartRef = useRef<Tone.Part | null>(null);
  const initialAutoRunDone = useRef(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: initialPrompt || '',
      voice: 'clive',
      singMode: false,
    },
  });

  const stopPlayback = useCallback(() => {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }
    if (vocalPlayerRef.current) {
      vocalPlayerRef.current.stop();
      vocalPlayerRef.current.dispose();
      vocalPlayerRef.current = null;
    }
    if (pianoPartRef.current) {
      pianoPartRef.current.dispose();
      pianoPartRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const checkAndDeductCredit = (isSinging: boolean) => {
      const cost = isSinging ? 3 : 1;
      const storedCredits = localStorage.getItem("sargam_credits");
      let credits = storedCredits ? parseInt(storedCredits) : 5;
      if (isNaN(credits)) credits = 0;
      
      if (credits < cost) {
          toast({ 
              title: "Insufficient Credits", 
              description: `This performance requires ${cost} credits. You currently have ${credits}. Please refill your balance using the credit bar at the bottom.`, 
              variant: "destructive" 
          });
          return false;
      }
      
      const newTotal = credits - cost;
      localStorage.setItem("sargam_credits", newTotal.toString());
      window.dispatchEvent(new Event('creditsUpdated'));
      return true;
  };

  const handlePreviewVoice = async (voiceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (previewLoading || isLoading || isPlaying) return;

    setPreviewLoading(voiceId);
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Checking frequency. I am ${voiceId}, your Resemble AI studio voice.`,
          voice: voiceId,
          sing: false,
        }),
      });

      const resText = await res.text();
      let data;
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch (e) {
        throw new Error("Invalid voice sample response from Resemble AI.");
      }

      if (!res.ok) throw new Error(data.message || "Preview failed. Check API key.");
      
      const audio = new Audio(data.media);
      audio.play().catch(err => {
        console.error("Audio playback error:", err);
        toast({ title: "Playback blocked", description: "Click the play icon again to allow audio.", variant: "destructive" });
      });
    } catch (e: any) {
      console.error("Preview Error:", e);
      toast({ title: "Preview failed", description: e.message || "Could not play sample.", variant: "destructive" });
    } finally {
      setPreviewLoading(null);
    }
  };

  const handlePlay = useCallback(async () => {
    if (!result) return;
    
    stopPlayback();
    await Tone.start();
    setIsPlaying(true);

    try {
      vocalPlayerRef.current = new Tone.Player(result.vocalUri).toDestination();
      vocalPlayerRef.current.volume.value = vocalVolume;
      vocalPlayerRef.current.playbackRate = vocalSpeed;
      
      await Tone.loaded();
      const vocalDuration = vocalPlayerRef.current.buffer.duration / vocalSpeed;

      let finalBpm = pianoTempo;

      if (result.notes && result.notes.length > 0) {
        const pianoSampler = await getSampler('piano');
        if (pianoSampler && !pianoSampler.disposed) {
          (pianoSampler as any).volume.value = pianoVolume; 
          
          if (isAutoSync) {
            const sortedNotes = [...result.notes].sort((a, b) => {
               try {
                 return Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds();
               } catch(e) { return 0; }
            });
            const lastNote = sortedNotes[sortedNotes.length - 1];
            if (lastNote) {
              const totalBeats = Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds();
              finalBpm = Math.max(60, Math.min(180, (totalBeats / vocalDuration) * 60));
              setPianoTempo(Math.round(finalBpm));
            }
          }

          pianoPartRef.current = new Tone.Part((time, note) => {
            if (pianoSampler && !pianoSampler.disposed) {
              (pianoSampler as any).triggerAttackRelease(note.key, note.duration, time);
            }
          }, result.notes).start(0);
          
          Tone.Transport.bpm.value = finalBpm;
        }
      } else {
        Tone.Transport.bpm.value = finalBpm;
      }

      Tone.Transport.scheduleOnce(() => {
        stopPlayback();
      }, Tone.now() + vocalDuration + 0.5);

      vocalPlayerRef.current.start(0);
      Tone.Transport.start("+0.1");
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
      toast({ title: "Studio Error", description: "I had some trouble mixing the tracks.", variant: "destructive" });
    }
  }, [result, stopPlayback, toast, vocalVolume, vocalSpeed, pianoVolume, pianoTempo, isAutoSync]);

  const handleGenerate = useCallback(async (data: FormData, reinforcementRating?: 'good' | 'bad') => {
    if (!checkAndDeductCredit(data.singMode)) return;

    setIsLoading(true);
    setResult(null);
    stopPlayback();
    
    try {
      onGenerate();
      let newResult: any = null;

      if (data.singMode) {
        const res = await fetch('/api/generate-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: data.text,
            vocalStyle: data.voice,
            instruments: ['piano'],
            feedback: reinforcementRating ? {
              rating: reinforcementRating,
              comment: feedbackComment
            } : undefined
          }),
        });

        const resText = await res.text();
        let songData;
        try {
          songData = resText ? JSON.parse(resText) : {};
        } catch (e) {
          throw new Error("The Studio engine returned an invalid response.");
        }

        if (!res.ok) throw new Error(songData.message || "Synthesis failed.");

        newResult = {
          vocalUri: songData.vocalAudioUri,
          notes: songData.notes,
          tempo: songData.tempo || 120,
          title: songData.title
        };
        
        if (songData.tempo) setPianoTempo(songData.tempo);
        
        if (reinforcementRating) {
          setFeedbackComment('');
        }
      } else {
        const res = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: data.text,
            voice: data.voice,
            sing: false,
          }),
        });

        const resText = await res.text();
        let speechResult;
        try {
          speechResult = resText ? JSON.parse(resText) : {};
        } catch (e) {
          throw new Error("Voice synthesis engine returned an invalid response.");
        }

        if (!res.ok) throw new Error(speechResult.message || "Resemble AI generation failed.");
        
        newResult = { vocalUri: speechResult.media };
      }

      setResult(newResult);

      if (user && firestore && newResult) {
        const historyRef = collection(firestore, 'users', user.uid, 'generatedMelodies');
        addDocumentNonBlocking(historyRef, {
          userId: user.uid,
          title: newResult.title || (data.singMode ? 'Vocal Studio' : 'Resemble Speech'),
          notes: data.text.substring(0, 50) + (data.text.length > 50 ? '...' : ''),
          instrument: 'Studio Voice',
          generationContext: 'Vocal Studio',
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: 'Mastering Complete!', description: 'Your AI performance is ready.' });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({ variant: 'destructive', title: 'Studio Error', description: error.message || "The synthesis engine is currently offline." });
    } finally {
      setIsLoading(false);
    }
  }, [stopPlayback, toast, feedbackComment, onGenerate, user, firestore]);

  useEffect(() => {
    if (autogen && initialPrompt && !initialAutoRunDone.current && !isLoading) {
      initialAutoRunDone.current = true;
      form.setValue('text', initialPrompt);
      form.handleSubmit((data) => handleGenerate(data))();
    }
  }, [autogen, initialPrompt, form, handleGenerate, isLoading]);

  const currentCost = form.watch('singMode') ? 3 : 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center px-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {currentCost} Credit{currentCost > 1 ? 's' : ''} per performance
          </span>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => handleGenerate(data))} className="space-y-8">
          <FormField control={form.control} name="text" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-bold flex items-center gap-2">
                <Mic2 className="h-5 w-5 text-primary" />
                Input Performance Script
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter lyrics for a song or text for a high-fidelity speech performance..." 
                  {...field} 
                  rows={4} 
                  disabled={isLoading} 
                  className="text-lg bg-background/50 border-primary/20 focus:ring-primary/30" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField control={form.control} name="voice" render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-base font-bold flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  Select Studio Artist
                </FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {voices.map((voice) => (
                    <label 
                      key={voice.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all group relative overflow-hidden",
                        field.value === voice.id ? "bg-primary/10 border-primary shadow-lg" : "bg-muted/30 border-transparent hover:bg-muted/50"
                      )}
                    >
                      <input 
                        type="radio" 
                        className="hidden" 
                        name="voice" 
                        value={voice.id} 
                        checked={field.value === voice.id}
                        onChange={() => field.onChange(voice.id)}
                      />
                      <div className="flex items-center gap-1 z-10 truncate pr-1">
                        {voice.premium && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                        <span className="text-[11px] font-bold truncate uppercase tracking-tight">{voice.label}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-40 group-hover:opacity-100 hover:text-primary z-10"
                        onClick={(e) => handlePreviewVoice(voice.id, e)}
                        disabled={previewLoading === voice.id}
                      >
                        {previewLoading === voice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                      </Button>
                      {field.value === voice.id && (
                        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                      )}
                    </label>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}/>

            <div className="space-y-6">
              <FormField control={form.control} name="singMode" render={({ field }) => (
                <div className="flex flex-row items-center justify-between rounded-2xl border p-6 bg-primary/5 border-primary/20 shadow-inner">
                  <div className="space-y-1">
                    <FormLabel className="text-lg font-bold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Studio Mode
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">Enabled: Singing & Piano (3 Credits).</p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                </div>
              )}/>
              
              <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-primary/20 flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">AI Studio Mastery</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      All studio voices are generated via high-fidelity neural engines for professional clarity.
                    </p>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} size="lg" className="w-full h-16 text-xl font-headline shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] rounded-2xl">
            {isLoading ? <Loader2 className="mr-3 animate-spin h-7 w-7" /> : <Sparkles className="mr-3 h-7 w-7" />}
            {isLoading ? 'Synthesizing Performance...' : 'Synthesize AI Master'}
          </Button>
        </form>
      </Form>

      {result && (
        <div className="space-y-10 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="bg-primary/5 border-primary/20 border-2 overflow-hidden rounded-3xl relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-headline font-bold text-primary">{result.title || 'Studio Performance'}</h3>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full">High-Fidelity Neural Output</span>
                    <p className="text-xs text-muted-foreground italic">Ready for playback</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button onClick={handlePlay} disabled={isPlaying} size="lg" className="h-14 px-10 rounded-2xl shadow-xl hover:scale-105 transition-transform">
                  <Play className="mr-2 h-6 w-6" /> Play Master
                </Button>
                <Button onClick={stopPlayback} disabled={!isPlaying} variant="destructive" size="lg" className="h-14 px-8 rounded-2xl shadow-xl hover:scale-105 transition-transform">
                  <StopCircle className="mr-2 h-6 w-6" /> Stop
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6 bg-muted/10 border-white/5 rounded-3xl">
              <span className="text-sm font-bold flex items-center gap-2 mb-6"><Volume2 className="h-4 w-4 text-primary" /> Vocal Mixing Deck</span>
              <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <span>Gain Level</span>
                    <span>{vocalVolume} dB</span>
                    </div>
                    <Slider value={[vocalVolume]} min={-20} max={10} step={1} onValueChange={(val) => setVocalVolume(val[0])} />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <span>Playback Speed</span>
                    <span>{vocalSpeed}x</span>
                    </div>
                    <Slider value={[vocalSpeed]} min={0.5} max={1.5} step={0.05} onValueChange={(val) => setVocalSpeed(val[0])} />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-muted/10 border-white/5 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold flex items-center gap-2"><Keyboard className="h-4 w-4 text-primary" /> Instrumentation Deck</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Auto Sync</span>
                  <Switch checked={isAutoSync} onCheckedChange={setIsAutoSync} />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <span>Piano Presence</span>
                    <span>{pianoVolume} dB</span>
                    </div>
                    <Slider value={[pianoVolume]} min={-40} max={6} step={1} onValueChange={(val) => setPianoVolume(val[0])} />
                </div>
                
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <span>Performance Tempo</span>
                    <span>{pianoTempo} BPM</span>
                    </div>
                    <Slider value={[pianoTempo]} min={60} max={180} step={1} disabled={isAutoSync} onValueChange={(val) => setPianoTempo(val[0])} />
                </div>
              </div>
            </Card>
          </div>

          {!reinforcementRating && (
            <div className="space-y-4 border-t pt-8">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                  <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary">Refine Your Song</h4>
                  </div>
                  <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Is the melody or rhythm not right? Describe what to fix and I'll learn from your rating.</p>
                      <div className="flex gap-2">
                          <Input 
                              placeholder="e.g., 'Make the piano more soulful'..." 
                              value={feedbackComment} 
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              className="flex-1 bg-background/50"
                              disabled={isLoading}
                          />
                          <Button variant="outline" size="icon" onClick={() => handleGenerate(form.getValues(), 'good')} title="It's good" disabled={isLoading}>
                              <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleGenerate(form.getValues(), 'bad')} title="Needs work" disabled={isLoading}>
                              <ThumbsDown className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}