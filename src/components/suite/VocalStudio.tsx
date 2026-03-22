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
  AlertCircle,
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
  { id: 'clara', label: 'Clara (Studio)' },
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
          text: `Hi there, I am ${voiceId}. I'm a professional AI voice artist.`,
          voice: voiceId,
          sing: false,
        }),
      });

      const resText = await res.text();
      let data;
      try {
        data = resText ? JSON.parse(resText) : {};
      } catch (e) {
        throw new Error("Invalid voice sample response");
      }

      if (!res.ok) throw new Error(data.message || "Preview failed");
      
      const audio = new Audio(data.media);
      audio.play().catch(err => {
        console.error("Audio playback error:", err);
        toast({ title: "Playback blocked", description: "Please click again to allow audio.", variant: "destructive" });
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
            const sortedNotes = [...result.notes].sort((a, b) => Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds());
            const lastNote = sortedNotes[sortedNotes.length - 1];
            // Sync BPM to vocal track duration
            const totalBeats = Tone.Time(lastNote.time).toSeconds() + Tone.Time(lastNote.duration).toSeconds();
            finalBpm = Math.max(60, Math.min(180, (totalBeats / vocalDuration) * 60));
            setPianoTempo(Math.round(finalBpm));
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
      toast({ title: "Problem playing", description: "I had some trouble starting the music.", variant: "destructive" });
    }
  }, [result, stopPlayback, toast, vocalVolume, vocalSpeed, pianoVolume, pianoTempo, isAutoSync]);

  const handleGenerate = useCallback(async (data: FormData, reinforcementRating?: 'good' | 'bad') => {
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
          throw new Error("The AI artist returned an invalid response.");
        }

        if (!res.ok) throw new Error(songData.message || "The AI artist was unable to complete the song.");

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

        if (!res.ok) throw new Error(speechResult.message || "Voice generation failed.");
        
        newResult = { vocalUri: speechResult.media };
      }

      setResult(newResult);

      if (user && firestore && newResult) {
        const historyRef = collection(firestore, 'users', user.uid, 'generatedMelodies');
        addDocumentNonBlocking(historyRef, {
          userId: user.uid,
          title: newResult.title || (data.singMode ? 'Vocal Studio' : 'Voice Speech'),
          notes: data.text.substring(0, 50) + (data.text.length > 50 ? '...' : ''),
          instrument: 'Voice + Piano',
          generationContext: 'Vocal Studio',
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: 'Ready!', description: 'Your AI performance is ready to play.' });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({ variant: 'destructive', title: 'Studio Error', description: error.message || "The AI artist encountered a problem." });
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

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => handleGenerate(data))} className="space-y-8">
          <FormField control={form.control} name="text" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-bold">What should the AI say or sing?</FormLabel>
              <FormControl>
                <Textarea placeholder="Type your text or lyrics here..." {...field} rows={4} disabled={isLoading} className="text-lg bg-background/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField control={form.control} name="voice" render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-base font-bold flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  Studio Artists (Inworld AI Powered)
                </FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {voices.map((voice) => (
                    <label 
                      key={voice.id} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors group relative overflow-hidden",
                        field.value === voice.id ? "bg-primary/10 border-primary shadow-inner" : "bg-muted/30 border-transparent hover:bg-muted/50"
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
                        <span className="text-[10px] font-bold truncate">{voice.label}</span>
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
                <div className="flex flex-row items-center justify-between rounded-xl border p-6 bg-primary/5 border-primary/20">
                  <div className="space-y-1">
                    <FormLabel className="text-lg font-bold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Ultra-Low Latency Mode
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">Using Inworld TTS 1.5 Max for sub-second responses.</p>
                  </div>
                  <div className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded uppercase">Active</div>
                </div>
              )}/>
              
              <div className="p-4 bg-muted/20 rounded-lg border border-dashed flex items-start gap-3">
                <Star className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Inworld AI Integration</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sargam AI now utilizes Inworld's leaderboard-topping voice quality to bring your scripts to life instantly.
                    </p>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} size="lg" className="w-full h-16 text-lg font-headline shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]">
            {isLoading ? <Loader2 className="mr-2 animate-spin h-6 w-6" /> : <Sparkles className="mr-2 h-6 w-6" />}
            {isLoading ? 'Synthesizing with Inworld AI...' : 'Generate Studio Performance'}
          </Button>
        </form>
      </Form>

      {result && (
        <div className="space-y-10 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-6 rounded-2xl border border-white/5">
            <div className="space-y-1">
              <h3 className="text-2xl font-headline font-bold text-primary">{result.title || 'Studio Output'}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">AI Performance Ready</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePlay} disabled={isPlaying} size="lg" className="h-12 px-8">
                <Play className="mr-2 h-5 w-5" /> Play
              </Button>
              <Button onClick={stopPlayback} disabled={!isPlaying} variant="destructive" size="lg" className="h-12 px-6">
                <StopCircle className="mr-2 h-5 w-5" /> Stop
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6 p-6 rounded-2xl bg-black/20 border border-white/5">
              <span className="text-sm font-bold flex items-center gap-2"><Volume2 className="h-4 w-4" /> Vocal Mix Controls</span>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span>Gain</span>
                  <span>{vocalVolume}dB</span>
                </div>
                <Slider value={[vocalVolume]} min={-20} max={6} step={1} onValueChange={(val) => setVocalVolume(val[0])} />
                
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span>Playback Rate</span>
                  <span>{vocalSpeed}x</span>
                </div>
                <Slider value={[vocalSpeed]} min={0.5} max={2.0} step={0.1} onValueChange={(val) => setVocalSpeed(val[0])} />
              </div>
            </div>

            <div className="space-y-6 p-6 rounded-2xl bg-black/20 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold flex items-center gap-2"><Keyboard className="h-4 w-4" /> Accompaniment Controls</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">AUTO SYNC</span>
                  <Switch checked={isAutoSync} onCheckedChange={setIsAutoSync} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span>Piano Gain</span>
                  <span>{pianoVolume}dB</span>
                </div>
                <Slider value={[pianoVolume]} min={-40} max={0} step={1} onValueChange={(val) => setPianoVolume(val[0])} />
                
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  <span>Manual Tempo</span>
                  <span>{pianoTempo} BPM</span>
                </div>
                <Slider value={[pianoTempo]} min={60} max={180} step={1} disabled={isAutoSync} onValueChange={(val) => setPianoTempo(val[0])} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
