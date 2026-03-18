'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiComposer } from './AiComposer';
import { VocalStudio } from './VocalStudio';
import { PulseRunner } from './PulseRunner';
import { Music, Mic, UserRoundPlus, Lock, Gamepad2 } from 'lucide-react';
import Image from 'next/image';

const TABS = [
    { value: 'composer', label: 'Melody Maker', icon: Music },
    { value: 'singer', label: 'Vocal Studio', icon: Mic },
    { value: 'cloner', label: 'Voice Cloner', icon: UserRoundPlus },
];

export function SargamSuite() {
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const initialPrompt = searchParams.get('prompt');
    const autogen = searchParams.get('autogen') === 'true';
    const autoplay = searchParams.get('autoplay') === 'true';

    const [activeTab, setActiveTab] = useState(requestedTab || TABS[0].value);

    useEffect(() => {
        if (requestedTab && TABS.some(t => t.value === requestedTab)) {
            setActiveTab(requestedTab);
        }
    }, [requestedTab]);

    return (
        <div className="space-y-16 pb-20">
            <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">AI Creative Studio</h1>
                    <p className="text-muted-foreground">
                        Create unique piano melodies, generate vocal tracks, or clone voices with our AI-powered tools.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid w-full grid-cols-3 max-w-lg h-auto p-1 bg-muted/50 border border-border/50 rounded-2xl">
                            {TABS.map(tab => (
                                <TabsTrigger key={tab.value} value={tab.value} className="gap-2 py-3 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all rounded-xl">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="mt-0">
                        {activeTab === 'composer' && (
                            <AiComposer 
                                initialPrompt={initialPrompt}
                                autogen={autogen}
                                autoplay={autoplay}
                                onGenerate={() => {}}
                            />
                        )}
                        {activeTab === 'singer' && (
                            <VocalStudio 
                                initialPrompt={initialPrompt}
                                autogen={autogen}
                                onGenerate={() => {}}
                            />
                        )}
                        {activeTab === 'cloner' && (
                            <div className="relative min-h-[400px] overflow-hidden rounded-3xl border border-white/10">
                                <div className="absolute inset-0 z-0">
                                    <Image 
                                        src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1080" 
                                        alt="Studio" 
                                        fill 
                                        className="object-cover blur-xl grayscale opacity-30"
                                        data-ai-hint="music studio"
                                    />
                                </div>
                                <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 space-y-6 backdrop-blur-md bg-black/40">
                                    <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Lock className="h-10 w-10 text-primary animate-pulse" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-headline font-bold">Voice Cloning</h2>
                                        <p className="text-xl text-muted-foreground max-w-md mx-auto">
                                            Coming Soon: Support us to bring it soon!
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground/60 italic">
                                        Our engineers are fine-tuning the vocal patterns. Stay tuned.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </Tabs>
            </div>

            <div className="relative pt-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <PulseRunner />
            </div>
        </div>
    );
}
