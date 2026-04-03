
'use client';

import { useState, useEffect } from 'react';
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
    Film,
    ArrowRight
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
        if (!user) {
            toast({ title: "Account Required", description: "Please sign in to access Sargam Studio.", variant: "destructive" });
            return;
        }
        if (!prompt.trim()) {
            toast({ title: "Prompt Required", description: "Describe your animation vision.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        setProgress(5);
        setResultUrl(null);

        // Progress simulation for user engagement
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 90 ? 95 : prev + 1.5));
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
        <div className="p-6 md:p-12 space-y-10 animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Controls Panel */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                            <MonitorPlay className="h-5 w-5 text-primary" />
                            Animation Protocol
                        </h3>
                        <p className="text-xs text-muted-foreground">Configure your animation parameters using Prototyper AI.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex justify-between items-center">
                                Neural Prompt Description
                                <span className="text-primary font-bold">{STUDIO_COST} Credits</span>
                            </label>
                            <Textarea 
                                placeholder="Describe the motion, lighting, and subjects... e.g. A neon-lit piano floating through a digital nebula."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isGenerating}
                                className="min-h-[150px] rounded-[1.5rem] bg-muted/20 border-primary/10 focus:border-primary/30 transition-all resize-none p-4"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Visual Style</label>
                            <div className="grid grid-cols-2 gap-3">
                                {STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedStyle(style.id)}
                                        disabled={isGenerating}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center group",
                                            selectedStyle === style.id 
                                                ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,255,255,0.1)]" 
                                                : "bg-muted/10 border-transparent hover:border-primary/20 hover:bg-muted/20"
                                        )}
                                    >
                                        <style.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", selectedStyle === style.id ? "text-primary" : "text-muted-foreground")} />
                                        <span className={cn("text-[10px] font-black uppercase tracking-tighter", selectedStyle === style.id ? "text-foreground" : "text-muted-foreground")}>{style.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleGenerate} 
                                disabled={isGenerating} 
                                className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isGenerating ? (
                                    <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Rendering...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-6 w-6 fill-primary-foreground" /> Initiate Render</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-2 min-h-[500px] flex flex-col bg-black/20 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                    
                    <div className="p-6 border-b border-white/5 flex items-center justify-between z-10">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <Film className="h-4 w-4" /> Studio Stage
                            </h4>
                            <p className="text-[10px] text-muted-foreground">Status: {isGenerating ? 'Computing Frames...' : resultUrl ? 'Render Ready' : 'Idle'}</p>
                        </div>
                        {resultUrl && (
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 hover:bg-primary/10 transition-colors" asChild>
                                <a href={resultUrl} download={`sargam-studio-${Date.now()}.mp4`}>
                                    <Download className="h-4 w-4 text-primary" /> Export MP4
                                </a>
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                        {!isGenerating && !resultUrl && (
                            <div className="text-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-muted/10 border border-white/5 flex items-center justify-center mx-auto opacity-30 group-hover:opacity-50 transition-opacity">
                                    <MonitorPlay className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-headline font-bold text-muted-foreground italic">Stage is dark.</p>
                                    <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">Describe your animation vision on the left to begin the neural rendering process.</p>
                                </div>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="w-full max-w-md space-y-8 text-center animate-in fade-in duration-500">
                                <div className="relative h-72 w-full rounded-[2.5rem] overflow-hidden bg-muted/10 border border-primary/20 flex flex-col items-center justify-center shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent animate-pulse" />
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Neural Synthesis Active</p>
                                        <p className="text-[10px] text-muted-foreground italic">Prototyper AI is assembling frames...</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Progress value={progress} className="h-1.5" />
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                        <span>Progress Protocol</span>
                                        <span className="text-primary">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {resultUrl && (
                            <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-700">
                                <div className="relative w-full rounded-3xl border-4 border-white/10 shadow-2xl overflow-hidden bg-black aspect-video max-h-[55vh]">
                                    <video 
                                        src={resultUrl} 
                                        controls 
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        loop
                                    />
                                </div>
                                <div className="mt-8 p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4 max-w-xl">
                                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                        <Zap className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold uppercase tracking-tight">Render Optimized: {selectedStyle}</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                            "Your neural animation has been successfully synthesized. High-fidelity motion blur and cinematic lighting have been applied to match your style protocol."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
