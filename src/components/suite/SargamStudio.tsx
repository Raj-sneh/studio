'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
    Loader2, 
    Sparkles, 
    MonitorPlay, 
    Layers, 
    Box, 
    Palette,
    Download,
    Film,
    Zap,
    Clock,
    Send,
    History,
    RefreshCw,
    Bot,
    User
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

const STUDIO_COST = 50;
const ADMIN_EMAILS = ['snehkumarverma2011@gmail.com', 'snehkumatverma2011@gmail.com'];

const STYLES = [
    { id: '3d-render', label: '3D Movie', icon: Box, description: 'High-quality stylized CGI.' },
    { id: '2d-animation', label: '2D Flipbook', icon: Layers, description: 'Hand-drawn pencil sketch.' },
    { id: 'cinematic', label: 'Cinematic', icon: Film, description: 'Photorealistic film quality.' },
    { id: 'anime', label: 'Anime', icon: Palette, description: 'Sharp action shonen style.' }
];

export function SargamStudio() {
    const { user } = useUser();
    const { toast } = useToast();
    
    // Core State
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('3d-render');
    const [instructions, setInstructions] = useState<string[]>([]);
    const [currentInstruction, setCurrentInstruction] = useState('');
    
    // UI Logic State
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<'none' | 'timeout' | 'error'>('none');
    const [isRefinementMode, setIsRefinementMode] = useState(false);

    const handleGenerate = async (newInstruction?: string) => {
        if (!user) {
            toast({ title: "Account Required", description: "Please sign in to access Sargam Studio.", variant: "destructive" });
            return;
        }
        if (!prompt.trim()) {
            toast({ title: "Concept Required", description: "Describe your base animation vision.", variant: "destructive" });
            return;
        }

        const activeInstructions = newInstruction 
            ? [...instructions, newInstruction] 
            : instructions;

        setIsGenerating(true);
        setProgress(2);
        setErrorState('none');
        if (!isRefinementMode) setIsRefinementMode(true);

        const interval = setInterval(() => {
            setProgress(prev => (prev >= 98 ? 99 : prev + 0.5));
        }, 3000);

        try {
            const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);

            if (!isAdmin) {
                const creditRes = await fetch('/api/credits/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.uid, amount: STUDIO_COST })
                });

                if (!creditRes.ok) {
                    const errData = await creditRes.json().catch(() => ({}));
                    throw new Error(errData.error || "Insufficient credits.");
                }
            }

            const response = await fetch('/api/studio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt, 
                    style: selectedStyle,
                    instructions: activeInstructions 
                })
            });

            // Handle Network Timeouts Gracefully (504/502)
            if (response.status === 504 || response.status === 502) {
                setErrorState('timeout');
                toast({ 
                    title: "Neural Engine Processing", 
                    description: "High-fidelity rendering is ongoing in the cloud. This can take up to 10 minutes." 
                });
                return;
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const errorText = await response.text().catch(() => "Unknown Server Error");
                throw new Error(`Neural Studio Connectivity Issue (Status ${response.status}): ${errorText.substring(0, 50)}...`);
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Neural Studio rendering failed.");

            setResultUrl(data.videoUrl);
            if (newInstruction) setInstructions(activeInstructions);
            setProgress(100);
            toast({ title: "Render Complete!", description: "Iteration successful." });
        } catch (e: any) {
            console.error("Studio Logic Error:", e);
            toast({ title: "Studio Error", description: e.message, variant: "destructive" });
            setErrorState('error');
        } finally {
            clearInterval(interval);
            setIsGenerating(false);
            setCurrentInstruction('');
        }
    };

    const resetStudio = () => {
        setPrompt('');
        setInstructions([]);
        setResultUrl(null);
        setIsRefinementMode(false);
        setErrorState('none');
    };

    return (
        <div className="p-6 md:p-12 space-y-10 animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Protocol Settings Panel */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                                <MonitorPlay className="h-5 w-5 text-primary" />
                                {isRefinementMode ? 'Refinement Protocol' : 'Initial Protocol'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                {isRefinementMode ? 'Prototype Animator Active' : 'Configure Base Concept'}
                            </p>
                        </div>
                        {isRefinementMode && (
                            <Button variant="ghost" size="icon" onClick={resetStudio} className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {!isRefinementMode ? (
                        <div className="space-y-6 animate-in slide-in-from-left duration-500">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex justify-between items-center">
                                    Visual Concept
                                    <span className="text-primary font-bold">{user?.email && ADMIN_EMAILS.includes(user.email) ? 'Unlimited' : `${STUDIO_COST} Credits`}</span>
                                </label>
                                <div className="relative">
                                    <Textarea 
                                        placeholder="e.g. A duck swimming in a pond."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="min-h-[150px] rounded-[1.5rem] bg-muted/20 border-primary/10 focus:border-primary/30 transition-none resize-none p-4 relative z-10"
                                    />
                                    <div className="absolute inset-0 bg-primary/5 blur-xl pointer-events-none -z-10" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Art Style</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {STYLES.map(style => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => setSelectedStyle(style.id)}
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

                            <Button 
                                onClick={() => handleGenerate()} 
                                disabled={isGenerating || !prompt.trim()} 
                                className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20"
                            >
                                <Sparkles className="mr-2 h-6 w-6 fill-primary-foreground" /> 
                                Initialize Render
                            </Button>
                            
                            <p className="text-[9px] text-center text-muted-foreground uppercase tracking-widest font-bold px-4">
                                Supports high-fidelity renders up to 10 minutes in the neural cloud.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="p-5 rounded-3xl bg-muted/20 border border-primary/10 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Master Concept</p>
                                <p className="text-sm italic text-muted-foreground leading-relaxed">"{prompt}"</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                    <Box className="h-3 w-3" /> {selectedStyle.toUpperCase()} Protocol
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-1">
                                    <History className="h-3 w-3" /> Instruction Log
                                </h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {instructions.length === 0 ? (
                                        <p className="text-[10px] text-muted-foreground italic px-1">No refinements yet. Use the command prompt to make changes.</p>
                                    ) : (
                                        instructions.map((ins, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                                <Zap className="h-3 w-3 text-primary mt-1 shrink-0" />
                                                <p className="text-xs text-foreground font-medium">{ins}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas & Studio Assistant Panel */}
                <div className="lg:col-span-2 min-h-[600px] flex flex-col bg-black/20 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
                    
                    {/* Canvas Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Film className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Neural Canvas</h4>
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">
                                    {isGenerating ? 'Synthesizing Protocol...' : resultUrl ? 'Frame Sequence Ready' : errorState === 'timeout' ? 'Background Rendering' : 'Idle'}
                                </p>
                            </div>
                        </div>
                        {resultUrl && !isGenerating && (
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 hover:bg-primary/10 h-10 px-6 font-bold" asChild>
                                <a href={resultUrl} download={`sargam-render-${Date.now()}.mp4`}>
                                    <Download className="h-4 w-4 text-primary" /> Export
                                </a>
                            </Button>
                        )}
                    </div>

                    {/* Render Area */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
                        {!isGenerating && !resultUrl && errorState === 'none' && (
                            <div className="text-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-muted/10 border border-white/5 flex items-center justify-center mx-auto opacity-30 group-hover:opacity-50 transition-all duration-700">
                                    <Bot className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-headline font-bold text-muted-foreground italic">Canvas sequence empty.</p>
                                    <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto font-medium">Initialize your base concept on the left to begin the Prototype Animator workflow.</p>
                                </div>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="w-full max-w-md space-y-8 text-center animate-in fade-in duration-500">
                                <div className="relative h-72 w-full rounded-[2.5rem] overflow-hidden bg-muted/10 border border-primary/20 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,255,255,0.1)]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent animate-pulse" />
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
                                    <div className="space-y-1 relative z-10">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Prototyper AI Active</p>
                                        <p className="text-[10px] text-muted-foreground italic">Processing iteration {instructions.length + 1}...</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Progress value={progress} className="h-1.5" />
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                        <span>Synthesis Progress</span>
                                        <span className="text-primary">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">Complex cinematic sequences can take several minutes to finalize.</p>
                            </div>
                        )}

                        {resultUrl && !isGenerating && (
                            <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-700">
                                <div className="relative w-full rounded-3xl border-4 border-white/10 shadow-2xl overflow-hidden bg-black aspect-video max-h-[50vh]">
                                    <video 
                                        src={resultUrl} 
                                        controls 
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        loop
                                    />
                                </div>
                                
                                {/* Assistant Command Prompt */}
                                <div className="w-full max-w-2xl mt-8 animate-in slide-in-from-bottom-4 duration-1000">
                                    <div className="relative">
                                        <div className="relative flex items-center gap-3 bg-muted/40 backdrop-blur-xl border border-primary/20 rounded-[1.5rem] p-2 shadow-2xl z-10">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <Bot className="h-5 w-5 text-primary" />
                                            </div>
                                            <Input 
                                                placeholder="Tell me what modification to make next..."
                                                value={currentInstruction}
                                                onChange={(e) => setCurrentInstruction(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && currentInstruction.trim() && handleGenerate(currentInstruction)}
                                                className="bg-transparent border-none focus-visible:ring-0 text-sm h-12 relative z-20"
                                                disabled={isGenerating}
                                            />
                                            <Button 
                                                size="icon" 
                                                type="button"
                                                onClick={() => handleGenerate(currentInstruction)}
                                                disabled={isGenerating || !currentInstruction.trim()}
                                                className="h-10 w-10 rounded-xl shadow-lg shadow-primary/20 shrink-0"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 transition-opacity pointer-events-none -z-10" />
                                    </div>
                                    <p className="text-[9px] text-center mt-3 text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                                        Assistant is listening. Describe colors, motion, or additions to your concept.
                                    </p>
                                </div>
                            </div>
                        )}

                        {!isGenerating && errorState === 'timeout' && (
                            <div className="w-full max-w-md space-y-6 text-center animate-in zoom-in-95 duration-500">
                                <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-10 w-10 text-primary animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold font-headline">Neural Synthesis Ongoing</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        The animation is still being rendered in the cloud. Professional {selectedStyle} frames can take up to 10 minutes for high-fidelity output. 
                                        Please stay on this page or check your gallery in a few minutes.
                                    </p>
                                    <div className="flex gap-2 justify-center">
                                        <Button variant="outline" onClick={() => handleGenerate()} className="rounded-xl mt-4">Refresh Status</Button>
                                        <Button variant="ghost" onClick={() => setResultUrl(null)} className="rounded-xl mt-4">Clear Canvas</Button>
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
