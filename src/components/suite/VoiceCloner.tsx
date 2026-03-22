'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Mic, 
  Play, 
  StopCircle, 
  Sparkles, 
  Upload, 
  Volume2, 
  History,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cloneVoice } from '@/ai/flows/voice-cloning-flow';

const formSchema = z.object({
  text: z.string().min(10, { message: "Please enter at least 10 characters for the AI to speak." }),
});

export function VoiceCloner() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clonedAudioUri, setClonedAudioUri] = useState<string | null>(null);
  const [sampleDataUri, setSampleDataUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
    },
  });

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
      toast({ title: "Reference Missing", description: "Please upload a voice sample first.", variant: "destructive" });
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
      toast({ title: "Success!", description: "Your voice has been cloned." });
    } catch (error: any) {
      console.error("Cloning error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Cloning Failed', 
        description: error.message || "Make sure the Voice Engine is running on port 8080." 
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
              Upload a clear 5-10 second recording of your voice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/5 ${sampleDataUri ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="audio/*"
              />
              {sampleDataUri ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-primary animate-in zoom-in" />
                  <div className="text-center">
                    <p className="font-bold text-sm">Voice Sample Ready</p>
                    <p className="text-xs text-muted-foreground">Click to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">Click to upload sample</p>
                    <p className="text-xs text-muted-foreground">WAV or MP3 (Max 5MB)</p>
                  </div>
                </>
              )}
            </div>

            <div className="bg-muted/30 p-4 rounded-lg flex gap-3 items-start">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                For best results, use a high-quality microphone and ensure there is no background noise in your sample.
              </p>
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
              What should your cloned voice say?
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
                          placeholder="Type the script for your AI voice clone..." 
                          className="min-h-[150px] bg-background/50 text-lg"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-headline shadow-lg shadow-primary/20" 
                  disabled={isLoading || !sampleDataUri}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  {isLoading ? 'Synthesizing...' : 'Clone Voice & Speak'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Result Section */}
      {clonedAudioUri && (
        <Card className="border-primary/20 bg-primary/5 animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Volume2 className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="font-headline text-xl font-bold">Cloned Performance</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-2">
                  <Zap className="h-3 w-3 text-primary" /> Ready to listen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <audio 
                ref={audioPlayerRef} 
                src={clonedAudioUri} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <Button size="lg" className="h-12 px-8 rounded-full" onClick={togglePlayback}>
                {isPlaying ? <StopCircle className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isPlaying ? 'Stop' : 'Play Result'}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" asChild>
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
