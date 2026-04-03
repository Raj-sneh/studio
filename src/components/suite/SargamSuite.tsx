'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIComposer } from '@/components/suite/AIComposer';
import { VocalStudio } from '@/components/suite/VocalStudio';
import { VoiceCloner } from '@/components/suite/VoiceCloner';
import { BgmGenerator } from '@/components/suite/BgmGenerator';
import { SargamStudio } from '@/components/suite/SargamStudio';
import { Music, Mic, UserRoundPlus, AlertCircle, LogIn, Disc, MonitorPlay, Sparkles } from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Defines the available tabs for music-specific tools.
 * Sargam Studio is now moved to a separate section below.
 */
const TABS = [
    { value: 'composer', label: 'Melody Maker', icon: Music },
    { value: 'bgm', label: 'BGM Composer', icon: Disc },
    { value: 'singer', label: 'Vocal Studio', icon: Mic },
    { value: 'cloner', label: 'Voice Cloner', icon: UserRoundPlus },
];

/**
 * The unified UI for the AI Creative Studio.
 * Features a tabbed music suite and a separate "Room Card" for Sargam Studio animations.
 */
export function SargamSuite() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const initialPrompt = searchParams.get('prompt');
    const autogen = searchParams.get('autogen') === 'true';
    const autoplay = searchParams.get('autoplay') === 'true';

    // Initialize the active tab from URL or default to the first tab.
    const [activeTab, setActiveTab] = useState(requestedTab && requestedTab !== 'studio' ? requestedTab : TABS[0].value);

    // Sync tab state with URL changes (excluding studio as it's separate).
    useEffect(() => {
        if (requestedTab && TABS.some(t => t.value === requestedTab)) {
            setActiveTab(requestedTab);
        }
    }, [requestedTab]);

    const isGuest = user?.isAnonymous;

    return (
        <div className="space-y-24 pb-20">
            <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">AI Creative Studio</h1>
                    <p className="text-muted-foreground text-sm">
                        Access our suite of neural tools to compose music, sync tracks, or transform vocals.
                    </p>
                </div>

                {/* Guest Mode Banner */}
                {isGuest && (
                    <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <AlertCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-foreground">You are in Guest Mode</p>
                                <p className="text-xs text-muted-foreground">Sign in to save your melodies and research history permanently.</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" size="sm" className="rounded-full px-6">
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" /> Login Now
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Music Suite Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
                    <div className="flex justify-center mb-12">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-3xl h-auto p-1 bg-muted/50 border border-border/50 rounded-2xl">
                            {TABS.map(tab => (
                                <TabsTrigger 
                                    key={tab.value} 
                                    value={tab.value} 
                                    className="gap-2 py-3 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all rounded-xl"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="mt-0">
                        {activeTab === 'composer' && (
                            <AIComposer 
                                initialPrompt={initialPrompt}
                                autogen={autogen}
                                autoplay={autoplay}
                                onGenerate={() => {}}
                            />
                        )}
                        {activeTab === 'bgm' && (
                            <BgmGenerator />
                        )}
                        {activeTab === 'singer' && (
                            <VocalStudio 
                                initialPrompt={initialPrompt}
                                autogen={autogen}
                                onGenerate={() => {}}
                            />
                        )}
                        {activeTab === 'cloner' && (
                            <VoiceCloner />
                        )}
                    </div>
                </Tabs>
            </div>

            {/* Sargam Studio Room Section */}
            <section id="sargam-studio" className="max-w-6xl mx-auto pt-16 border-t border-border/10">
                <div className="flex flex-col items-center text-center space-y-4 mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                        <Sparkles className="h-3 w-3" /> Prototyper AI Enabled
                    </div>
                    <h2 className="font-headline text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <MonitorPlay className="h-8 w-8 text-primary" />
                        Sargam Studio Room
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        A dedicated environment for neural video generation. Transform your words into high-fidelity 2D and 3D animations using professional Prototyper AI.
                    </p>
                </div>

                <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-transparent to-primary/5 border border-primary/10 shadow-2xl">
                    <div className="bg-card/40 backdrop-blur-md rounded-[2.4rem] overflow-hidden">
                        <SargamStudio />
                    </div>
                </div>
            </section>
        </div>
    );
}
