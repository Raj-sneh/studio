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
    User,
    Timer,
    AlertCircle,
    CheckCircle2,
    Save
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

const INITIAL_COST = 30;
const MODIFICATION_COST = 5;
const ADMIN_EMAILS = ['snehkumarverma2011@gmail.com'];

const STYLES = [
    { id: '3d-render', label: '3D CGI', icon: Box, description: 'Stand By Me Style.' },
    { id: '2d-animation', label: '2D Cartoon', icon: Layers, description: 'Classic animation.' },
    { id: 'cinematic', label: 'Cinematic', icon: Film, description: 'Film quality.' },
    { id: 'anime', label: 'Hybrid 3D', icon: Palette, description: 'Action anime style.' }
];

export function SargamStudio() {
    const { user } = useUser();
    const { toast } = useToast();
    
    // Core State
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('3d-render');
    const [instructions, setInstructions] = useState<string[]>([]);
    const [currentInstruction, setCurrentInstruction] = useState('');
    
    // Video Cache for Stitching
    const [sceneVideos, setSceneVideos] = useState<string[]>([]); // Array of data URIs
    
    // UI Logic State
    const [isGenerating, setIsGenerating] = useState(false);
    const [isStitching, setIsStitching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
    const [errorState, setErrorState] = useState<'none' | 'timeout' | 'error' | 'content-block'>('none');
    const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null);
    const [isRefinementMode, setIsRefinementMode] = useState(false);

    const handleGenerate = async (newInstruction?: string) => {
        if (!user) {
            toast({ title: "Account Required", description: "Please sign in to access Sargam Studio.", variant: "destructive" });
            return;
        }
        
        const isInitial = !isRefinementMode;
        if (isInitial && !prompt.trim()) {
            toast({ title: "Concept Required", description: "Describe your base animation vision.", variant: "destructive" });
            return;
        }

        const activeInstructions = newInstruction 
            ? [...instructions, newInstruction] 
            : instructions;

        setIsGenerating(true);
        setFinalVideoUrl(null); 
        setProgress(2);
        setErrorState('none');
        setLastErrorMessage(null);

        const interval = setInterval(() => {
            setProgress(prev => (prev >= 98 ? 99 : prev + 0.5));
        }, 3000);

        try {
            const isAdmin = user.email && ADMIN_EMAILS.includes(user.email);
            const cost = isInitial ? INITIAL_COST : MODIFICATION_COST;

            if (!isAdmin) {
                const creditRes = await fetch('/api/credits/use', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.uid, amount: cost })
                });

                if (!creditRes.ok) {
                    const text = await creditRes.text();
                    let errMessage = "Insufficient credits.";
                    try {
                        const errData = text ? JSON.parse(text) : {};
                        errMessage = errData.error || errMessage;
                    } catch (e) {}
                    throw new Error(errMessage);
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

            const contentType = response.headers.get("content-type");
            const isJson = contentType && contentType.includes("application/json");
            
            if (!response.ok) {
                const data = isJson ? await response.json().catch(() => ({})) : { message: "Neural Engine Connectivity Issue" };
                const msg = data.message || "Rendering failed.";
                if (msg.toLowerCase().includes('third-party')) setErrorState('content-block');
                else setErrorState('error');
                throw new Error(msg);
            }

            const data = await response.json();
            setCurrentVideoUrl(data.videoUrl);
            setSceneVideos(prev => [...prev, data.videoUrl]);
            
            if (newInstruction) setInstructions(activeInstructions);
            if (isInitial) setIsRefinementMode(true);
            
            setProgress(100);
            toast({ title: isInitial ? "Scene 1 Rendered!" : "Iteration Added!", description: "Continuity Protocol Synchronized." });
        } catch (e: any) {
            setLastErrorMessage(e.message);
            toast({ title: "Studio Error", description: e.message, variant: "destructive" });
        } finally {
            clearInterval(interval);
            setIsGenerating(false);
            setCurrentInstruction('');
        }
    };

    const handleFinish = async () => {
        if (sceneVideos.length === 0) return;
        if (sceneVideos.length === 1) {
            setFinalVideoUrl(sceneVideos[0]);
            toast({ title: "Project Finished", description: "Your single-scene render is ready." });
            return;
        }

        setIsStitching(true);
        try {
            const response = await fetch('/api/studio/stitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videos: sceneVideos })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Neural stitching failed.");
            
            setFinalVideoUrl(data.video);
            toast({ title: "Neural Synthesis Complete", description: "All scenes have been merged into one masterpiece." });
        } catch (e: any) {
            toast({ title: "Stitching Error", description: e.message, variant: "destructive" });
        } finally {
            setIsStitching(false);
        }
    };

    const resetStudio = () => {
        if (isGenerating || isStitching) return;
        setPrompt('');
        setInstructions([]);
        setCurrentVideoUrl(null);
        setFinalVideoUrl(null);
        setSceneVideos([]);
        setIsRefinementMode(false);
        setErrorState('none');
        setLastErrorMessage(null);
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
                                {isRefinementMode ? 'Project Evolution' : 'Initial Protocol'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                {isRefinementMode ? `Active Scenes: ${sceneVideos.length}` : 'Configure Base Animation'}
                            </p>
                        </div>
                        {isRefinementMode && (
                            <Button variant="ghost" size="icon" onClick={resetStudio} className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive transition-colors">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {!isRefinementMode ? (
                        <div className="space-y-6 animate-in slide-in-from-left duration-500">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex justify-between items-center">
                                    Base Concept (Scene 1)
                                    <span className="text-primary font-bold">{user?.email && ADMIN_EMAILS.includes(user.email) ? 'Unlimited' : `${INITIAL_COST} Credits`}</span>
                                </label>
                                <div className="relative z-10">
                                    <Textarea 
                                        placeholder="e.g. A robotic explorer stepping onto a neon planet."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        disabled={isGenerating}
                                        className="min-h-[120px] rounded-[1.5rem] bg-muted/20 border-primary/10 focus:border-primary/30 transition-none resize-none p-4 relative z-10"
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
                                Initialize Master
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="p-5 rounded-3xl bg-muted/20 border border-primary/10 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Master Concept</p>
                                <p className="text-sm italic text-muted-foreground leading-relaxed line-clamp-2">"{prompt}"</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-1">
                                    <History className="h-3 w-3" /> Scene Log ({sceneVideos.length})
                                </h4>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                        <p className="text-xs text-foreground font-medium truncate">Scene 1: Initialized</p>
                                    </div>
                                    {instructions.map((ins, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                            <CheckCircle2 className="h-3 w-3 text-primary" />
                                            <p className="text-xs text-foreground font-medium truncate">Scene {i+2}: {ins}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                onClick={handleFinish} 
                                disabled={isGenerating || isStitching || sceneVideos.length === 0}
                                className="w-full h-14 rounded-2xl font-black text-md bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xl shadow-secondary/20"
                            >
                                {isStitching ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                                Finish & Stitch Project
                            </Button>
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
                                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">
                                    {finalVideoUrl ? 'Final Production Master' : `Scene ${sceneVideos.length || 1} Preview`}
                                </h4>
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">
                                    {isGenerating ? 'Neural Rendering...' : isStitching ? 'Stitching Frames...' : 'Ready'}
                                </p>
                            </div>
                        </div>
                        {(currentVideoUrl || finalVideoUrl) && !isGenerating && !isStitching && (
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 hover:bg-primary/10 h-10 px-6 font-bold" asChild>
                                <a href={finalVideoUrl || currentVideoUrl || ''} download={`sargam-${finalVideoUrl ? 'final' : 'scene'}-${Date.now()}.mp4`}>
                                    <Download className="h-4 w-4 text-primary" /> Download {finalVideoUrl ? 'Final' : 'Clip'}
                                </a>
                            </Button>
                        )}
                    </div>

                    {/* Render Area */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
                        {!isGenerating && !isStitching && !currentVideoUrl && !finalVideoUrl && (
                            <div className="text-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-muted/10 border border-white/5 flex items-center justify-center mx-auto opacity-30 group-hover:opacity-50 transition-all duration-700">
                                    <Bot className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-lg font-headline font-bold text-muted-foreground italic">Studio Canvas Empty.</p>
                                    <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto font-medium">Describe your base concept to initialize Scene 1.</p>
                                </div>
                            </div>
                        )}

                        {(isGenerating || isStitching) && (
                            <div className="w-full max-w-md space-y-8 text-center animate-in fade-in duration-500">
                                <div className="relative h-72 w-full rounded-[2.5rem] overflow-hidden bg-muted/10 border border-primary/20 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,255,255,0.1)]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent animate-pulse" />
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
                                    <div className="space-y-1 relative z-10">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                                            {isStitching ? 'Neural Concatenation' : `Synthesizing Scene ${sceneVideos.length + 1}`}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground italic">
                                            {isStitching ? 'Merging frames into master clip...' : 'Calculating lighting & physics...'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Progress value={progress} className="h-1.5" />
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                        <span>Synthesis Progress</span>
                                        <span className="text-primary">{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(currentVideoUrl || finalVideoUrl) && !isGenerating && !isStitching && (
                            <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-700">
                                <div className="relative w-full rounded-3xl border-4 border-white/10 shadow-2xl overflow-hidden bg-black aspect-video max-h-[50vh]">
                                    <video 
                                        src={finalVideoUrl || currentVideoUrl || ''} 
                                        controls 
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        loop
                                        key={finalVideoUrl || currentVideoUrl}
                                    />
                                </div>
                                
                                {/* Assistant Command Prompt */}
                                {!finalVideoUrl && (
                                    <div className="w-full max-w-2xl mt-8 animate-in slide-in-from-bottom-4 duration-1000">
                                        <div className="relative z-10">
                                            <div className="relative flex items-center gap-3 bg-muted/40 backdrop-blur-xl border border-primary/20 rounded-[1.5rem] p-2 shadow-2xl z-10">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <Bot className="h-5 w-5 text-primary" />
                                                </div>
                                                <Input 
                                                    placeholder={`Scene ${sceneVideos.length + 1}: What happens next?`}
                                                    value={currentInstruction}
                                                    onChange={(e) => setCurrentInstruction(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && currentInstruction.trim() && handleGenerate(currentInstruction)}
                                                    className="bg-transparent border-none focus-visible:ring-0 text-sm h-12 relative z-20"
                                                    disabled={isGenerating}
                                                />
                                                <div className="flex items-center gap-2 px-2">
                                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full">{MODIFICATION_COST}c</span>
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
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-center mt-3 text-muted-foreground font-black uppercase tracking-[0.2em] italic">
                                            Describe the next action. Click "Finish" in the menu to stitch all clips into one.
                                        </p>
                                    </div>
                                )}

                                {finalVideoUrl && (
                                    <div className="mt-8 text-center space-y-4 animate-in fade-in duration-1000">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold uppercase tracking-widest">
                                            <CheckCircle2 className="h-4 w-4" /> Final Master Ready
                                        </div>
                                        <p className="text-sm text-muted-foreground italic">Project contains {sceneVideos.length} neural scenes.</p>
                                        <Button variant="outline" onClick={resetStudio} className="rounded-xl mt-4">Start New Project</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
