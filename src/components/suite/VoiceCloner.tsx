'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Mic, 
  Play, 
  StopCircle, 
  Sparkles, 
  Upload, 
  Volume2, 
  CheckCircle2,
  Zap,
  Trash2,
  BookOpen,
  RefreshCw,
  Quote,
  Wand2
} from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cloneVoice } from '@/ai/flows/voice-cloning-flow';
import { generateTrainingParagraphs } from '@/ai/flows/voice-training-flow';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  text: z.string().min(10, { message: "Please enter at least 10 characters for the AI to speak." }),
});

export function VoiceCloner() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [clonedAudioUri, setClonedAudioUri] = useState<string | null>(null);
  const [sampleDataUri, setSampleDataUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [suggestedScripts, setSuggestedScripts] = useState<string[]>([]);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
    },
  });

  const fetchScripts = async () => {
    setIsGeneratingScript(true);
    try {
      const scripts = await generateTrainingParagraphs();
      setSuggestedScripts(scripts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setSampleDataUri(reader.result as string);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({ title: "Mic Active", description: "Recording started. Read the script clearly!" });
    } catch (err) {
      console.error("Recording error:", err);
      toast({ title: "Mic Error", description: "Please allow microphone access to record.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload a sample smaller than 10MB.", variant: "destructive" });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSampleDataUri(reader.result as string);
        toast({ title: "Voice Sample Loaded", description: "The reference voice is ready for cloning." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (values: z.infer<typeof formSchema>) => {
    if (!sampleDataUri) {
      toast({ title: "No Voice Sample", description: "Record or upload a voice first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setClonedAudioUri(null);

    try {
      const result = await cloneVoice({
        text: values.text,
        sampleAudioDataUri: sampleDataUri,
      });

      setClonedAudioUri(result.clonedAudioUri);
      toast({ title: "Clone Ready!", description: "The AI has finished synthesizing your performance." });
    } catch (error: any) {
      console.error("Cloning error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Synthesis Error', 
        description: error.message || "The voice engine is temporarily busy. Try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                Voice Reference Studio
              </CardTitle>
              <CardDescription>
                Provide a short audio clip (5-10s) of the target voice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                {!sampleDataUri && !isRecording && (
                  <Button 
                    variant="outline" 
                    className="flex-1 h-28 flex-col gap-2 border-dashed border-2 hover:bg-primary/10 hover:border-primary/50 transition-all group"
                    onClick={startRecording}
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-bold">Record Voice</span>
                  </Button>
                )}

                {isRecording && (
                  <Button 
                    variant="destructive" 
                    className="flex-1 h-28 flex-col gap-2 border-2 animate-pulse"
                    onClick={stopRecording}
                  >
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                      <StopCircle className="h-6 w-6" />
                    </div>
                    <span className="font-bold">Stop Recording ({formatTime(recordingTime)})</span>
                  </Button>
                )}

                {sampleDataUri && !isRecording && (
                  <div className="flex-1 h-28 border-2 border-primary/50 bg-primary/10 rounded-xl flex flex-col items-center justify-center relative group shadow-inner">
                    <CheckCircle2 className="h-10 w-10 text-primary mb-1 animate-in zoom-in-50" />
                    <span className="text-xs font-black text-primary uppercase tracking-tighter">Sample Captured</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => setSampleDataUri(null)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex-1">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="audio/*"
                  />
                  <Button 
                    variant="outline" 
                    className="w-full h-28 flex-col gap-2 border-dashed border-2 hover:bg-secondary/10 hover:border-secondary/50 transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isRecording}
                  >
                    <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-secondary" />
                    </div>
                    <span className="font-bold">Upload Audio</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/40 backdrop-blur-md overflow-hidden shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Training Scripts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[100px] p-6 bg-muted/40 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center justify-center text-center relative group">
                <Quote className="absolute top-2 left-2 h-6 w-6 text-primary/10 group-hover:text-primary/30 transition-colors" />
                {isGeneratingScript ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <p className="text-base font-medium italic text-foreground leading-relaxed px-4">
                    "{suggestedScripts[currentScriptIndex] || 'Hit refresh to generate training scripts...'}"
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                   <Zap className="h-3 w-3 text-primary" /> Read clearly for best results
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 font-bold rounded-full hover:bg-primary/10"
                    onClick={() => setCurrentScriptIndex((prev) => (prev + 1) % suggestedScripts.length)}
                    disabled={suggestedScripts.length === 0}
                  >
                    Next Script
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full"
                    onClick={fetchScripts}
                    disabled={isGeneratingScript}
                  >
                    <RefreshCw className={cn("h-4 w-4", isGeneratingScript && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10 bg-card/40 backdrop-blur-md shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              AI Performance Script
            </CardTitle>
            <CardDescription>
              Write the text you want the cloned voice to perform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="What should your AI clone say? Type it here..." 
                          className="min-h-[180px] bg-background/50 text-lg focus:ring-2 focus:ring-primary/20 p-6 rounded-2xl transition-all"
                          disabled={isLoading || isRecording}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-16 text-xl font-headline shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] rounded-2xl" 
                  disabled={isLoading || !sampleDataUri || isRecording}
                >
                  {isLoading ? (
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  ) : (
                    <Sparkles className="mr-3 h-6 w-6" />
                  )}
                  {isLoading ? 'Synthesizing Performance...' : 'Synthesize AI Performance'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {clonedAudioUri && (
        <Card className="border-primary/40 bg-primary/10 border-2 animate-in slide-in-from-bottom-8 duration-700 overflow-hidden relative shadow-2xl rounded-3xl">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                <Volume2 className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline text-3xl font-bold">AI Studio Master</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-primary-foreground bg-primary px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-sm">Instant Ready</span>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary animate-pulse" /> Synthetic Performance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <audio 
                ref={audioPlayerRef} 
                src={clonedAudioUri} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform" onClick={togglePlayback}>
                {isPlaying ? <StopCircle className="mr-3 h-6 w-6" /> : <Play className="mr-3 h-6 w-6" />}
                {isPlaying ? 'Stop' : 'Play Performance'}
              </Button>
              <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl border-primary/30 hover:bg-primary/20 hover:scale-105 transition-all shadow-xl" asChild title="Download Result">
                <a href={clonedAudioUri} download="sargam_ai_clone.mp3">
                  <Upload className="h-6 w-6 rotate-180" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
