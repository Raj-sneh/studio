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
  Info,
  CheckCircle2,
  Zap,
  Trash2,
  Radio
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
import { cn } from '@/lib/utils';

const formSchema = z.object({
  text: z.string().min(10, { message: "Please enter at least 10 characters for the AI to speak." }),
});

export function VoiceCloner() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clonedAudioUri, setClonedAudioUri] = useState<string | null>(null);
  const [sampleDataUri, setSampleDataUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Recording State
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

      toast({ title: "Recording Started", description: "Speak clearly into your microphone." });
    } catch (err) {
      console.error("Recording error:", err);
      toast({ title: "Mic Error", description: "Could not access microphone.", variant: "destructive" });
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
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload a sample smaller than 5MB.", variant: "destructive" });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSampleDataUri(reader.result as string);
        toast({ title: "Sample Loaded", description: "Voice reference captured successfully." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (values: z.infer<typeof formSchema>) => {
    if (!sampleDataUri) {
      toast({ title: "Reference Missing", description: "Please provide a voice sample first.", variant: "destructive" });
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
      toast({ title: "Success!", description: "Your voice performance has been synthesized." });
    } catch (error: any) {
      console.error("Cloning error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Cloning Failed', 
        description: error.message || "Synthesis engine is currently unavailable." 
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Voice Reference
            </CardTitle>
            <CardDescription>
              Record your voice live or upload a clear 5-10 second sample.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {!sampleDataUri && !isRecording && (
                <Button 
                  variant="outline" 
                  className="flex-1 h-24 flex-col gap-2 border-dashed border-2 hover:bg-primary/5 hover:border-primary/40 transition-all"
                  onClick={startRecording}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <span>Start Recording</span>
                </Button>
              )}

              {isRecording && (
                <Button 
                  variant="destructive" 
                  className="flex-1 h-24 flex-col gap-2 border-2 animate-pulse"
                  onClick={stopRecording}
                >
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <StopCircle className="h-5 w-5" />
                  </div>
                  <span>Stop ({formatTime(recordingTime)})</span>
                </Button>
              )}

              {sampleDataUri && !isRecording && (
                <div className="flex-1 h-24 border-2 border-primary/40 bg-primary/5 rounded-md flex flex-col items-center justify-center relative group">
                  <CheckCircle2 className="h-8 w-8 text-primary mb-1" />
                  <span className="text-xs font-bold text-primary">Sample Ready</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSampleDataUri(null)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
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
                  className="w-full h-24 flex-col gap-2 border-dashed border-2 hover:bg-secondary/5 hover:border-secondary/40 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording}
                >
                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-secondary" />
                  </div>
                  <span>Upload File</span>
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg flex gap-3 items-start border border-border/50">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quality Tip</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  For the best clone, record in a quiet room and speak with your natural emotion and pitch.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Script Section */}
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Performance Script
            </CardTitle>
            <CardDescription>
              Enter the text you want your AI clone to perform.
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
                          placeholder="Type your script here..." 
                          className="min-h-[150px] bg-background/50 text-lg focus:ring-1 focus:ring-primary/30"
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
                  className="w-full h-14 text-lg font-headline shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]" 
                  disabled={isLoading || !sampleDataUri || isRecording}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? 'Synthesizing Performance...' : 'Synthesize AI Performance'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Result Section */}
      {clonedAudioUri && (
        <Card className="border-primary/20 bg-primary/5 border-2 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                <Volume2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline text-2xl font-bold">Studio Performance</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-primary-foreground bg-primary px-2 py-0.5 rounded font-black uppercase tracking-tighter">AI Ready</span>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-2">
                    <Zap className="h-3 w-3 text-primary" /> Synthetic Output
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <audio 
                ref={audioPlayerRef} 
                src={clonedAudioUri} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <Button size="lg" className="h-14 px-10 rounded-full font-bold shadow-lg" onClick={togglePlayback}>
                {isPlaying ? <StopCircle className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isPlaying ? 'Stop' : 'Play Performance'}
              </Button>
              <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-primary/20 hover:bg-primary/10" asChild>
                <a href={clonedAudioUri} download="cloned_voice.mp3">
                  <Upload className="h-5 w-5 rotate-180" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
