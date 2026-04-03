
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, 
    Video, 
    Sparkles, 
    Zap, 
    MonitorPlay, 
    Layers, 
    Box, 
    Palette,
    Download,
    Film
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

const STUDIO_COST = 50;

const STYLES = [
    { id: '3d-render', label: '3D Studio', icon: Box, description: 'Hyper-realistic neural 3D animation.' },
    { id: '2d-animation', label: '2D Cartoon', icon: Layers, description: 'Fluid hand-drawn style animation.' },
    { id: 'cinematic', label: 'Cinematic', icon: Film, description: 'Movie-grade photorealistic motion.' },
    { id: 'anime', label: 'Anime', icon: Palette, description: 'Modern high-action anime style.' }
];

export function SargamStudio() {
    const { user } = useUser();
    const { toast } = useToast();
    
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('3d-render');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!user) return;
        if (!prompt.trim()) {
            toast({ title: "Prompt Required", description: "Describe your animation vision.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        setProgress(5);
        setResultUrl(null);

        // Progress simulation since the API is long-running
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 90 ? 95 : prev + 2));
        }, 2000);

        try {
            const creditRes = await fetch('/api/credits/use', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.uid, amount: STUDIO_COST })
            });

            if (!creditRes.ok) {
                const err = await creditRes.json();
                throw new Error(err.error || "Insufficient credits.");
            }

            const response = await fetch('/api/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, style: selectedStyle })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Neural Studio failed.");

            setResultUrl(data.videoUrl);
            setProgress(100);
            toast({ title: "Render Complete!", description: "Your AI animation is ready." });
        } catch (e: any) {
            toast({ title: "Studio Error", description: e.message, variant: "destructive" });
        } finally {
            clearInterval(interval);
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Panel */}
                <Card className="lg:col-span-1 border-primary/10 bg-card/30 rounded-[2rem] h-fit">
                    <CardHeader>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <MonitorPlay className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-headline font-bold">Animation Controls</CardTitle>
                        <CardDescription>Describe the motion and style.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Describe Vision</label>
                            <Textarea 
                                placeholder="e.g. A futuristic robot playing a grand piano in space..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isGenerating}
                                className="min-h-[120px] rounded-2xl bg-muted/20 border-primary/10"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Visual Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                {STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        disabled={isGenerating}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-left",
                                            selectedStyle === style.id 
                                                ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,255,255,0.1)]" 
                                                : "bg-muted/10 border-transparent hover:bg-muted/20"
                                        )}
                                    >
                                        <style.icon className={cn("h-4 w-4", selectedStyle === style.id ? "text-primary" : "text-muted-foreground")} />
                                        <span className="text-[10px] font-bold uppercase">{style.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleGenerate} 
                                disabled={isGenerating} 
                                className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20"
                            >
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Rendering...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-5 w-5" /> Generate ({STUDIO_COST} Credits)</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="lg:col-span-2 border-primary/10 bg-card/20 rounded-[2rem] min-h-[500px] flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                        <div>
                            <CardTitle className="text-lg">Neural Render Preview</CardTitle>
                            <CardDescription>View your high-fidelity animation result.</CardDescription>
                        </div>
                        {resultUrl && (
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20" asChild>
                                <a href={resultUrl} download="sargam-studio-render.mp4">
                                    <Download className="h-4 w-4" /> Export MP4
                                </a>
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
                        {!isGenerating && !resultUrl && (
                            <div className="text-center space-y-4">
                                <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto opacity-20">
                                    <Video className="h-10 w-10" />
                                </div>
                                <p className="text-sm text-muted-foreground italic">Neural stage is empty. Start a new render.</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="w-full max-w-md space-y-6 text-center">
                                <div className="relative h-64 w-full rounded-3xl overflow-hidden bg-muted/10 border border-primary/10 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent animate-pulse" />
                                    <div className="space-y-2 text-center z-10">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest text-primary">Assembling Neural Frames...</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Render Progress: {progress}%</p>
                                </div>
                            </div>
                        )}

                        {resultUrl && (
                            <div className="w-full h-full animate-in zoom-in-95 duration-500">
                                <video 
                                    src={resultUrl} 
                                    controls 
                                    className="w-full h-auto rounded-3xl border border-primary/20 shadow-2xl shadow-primary/10 max-h-[60vh] object-contain bg-black"
                                    autoPlay
                                    loop
                                />
                                <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                                    <Zap className="h-5 w-5 text-primary" />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Render optimized for {selectedStyle}. You can find this in your generation history soon.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
