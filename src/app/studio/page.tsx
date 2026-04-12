'use client';

import { SargamStudio } from '@/components/suite/SargamStudio';
import { Sparkles, MonitorPlay, Info, Lock, LogIn } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudioPage() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="space-y-12 pb-24">
      {/* Page Header */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
          <Sparkles className="h-3 w-3" /> Powered by Prototyper AI
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <MonitorPlay className="h-10 w-10 text-primary" />
          Sargam Studio
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          The Premier AI Animation Lab. Turn your text descriptions into cinematic 2D and 3D animations using advanced neural rendering.
        </p>
      </div>

      {/* Access Gate: Mandatory Login for Studio */}
      <div className="max-w-7xl mx-auto">
        {isUserLoading ? (
          <div className="h-[600px] flex flex-col items-center justify-center bg-card/20 rounded-[3rem] border border-dashed border-primary/20">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authenticating Studio Session...</p>
          </div>
        ) : !user ? (
          <div className="h-[600px] flex flex-col items-center justify-center bg-card/20 backdrop-blur-xl rounded-[3rem] border border-primary/10 p-12 text-center space-y-8 animate-in fade-in duration-700">
            <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">Neural Studio Locked</h2>
              <p className="text-muted-foreground max-w-md mx-auto italic">
                Cinematic video synthesis requires high computational intensity and verified identity. Please log in to your permanent account to manage your rendering projects and history.
              </p>
            </div>
            <Button asChild size="lg" className="h-14 px-10 rounded-2xl font-black text-lg">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> Sign In to Render
              </Link>
            </Button>
          </div>
        ) : (
          <div className="p-1 rounded-[3rem] bg-gradient-to-br from-primary/20 via-transparent to-primary/5 border border-primary/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <div className="bg-card/40 backdrop-blur-xl rounded-[2.9rem] overflow-hidden relative z-10">
              <SargamStudio />
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
        <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> Cinematic Intelligence
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sargam Studio utilizes state-of-the-art Google Veo models to build entire worlds from scratch. Simply describe your scene, and the AI handles the lighting, physics, and character motion.
          </p>
        </div>
        <div className="p-6 rounded-3xl bg-muted/20 border border-border/50 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Neural Style Protocols
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose between hyper-realistic 3D, fluid 2D animation, or high-action anime. Each protocol uses specialized neural weights to ensure your vision matches the intended artistic style.
          </p>
        </div>
      </div>
    </div>
  );
}
