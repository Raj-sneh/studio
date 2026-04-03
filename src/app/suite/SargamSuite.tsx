
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIComposer } from '@/components/suite/AIComposer';
import { VocalStudio } from '@/components/suite/VocalStudio';
import { VoiceCloner } from '@/components/suite/VoiceCloner';
import { BgmGenerator } from '@/components/suite/BgmGenerator';
import { SargamStudio } from '@/components/suite/SargamStudio';
import { Music, Mic, UserRoundPlus, AlertCircle, LogIn, Disc, MonitorPlay } from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Defines the available tabs in the AI Creative Studio.
 */
const TABS = [
    { value: 'composer', label: 'Melody Maker', icon: Music },
    { value: 'bgm', label: 'BGM Composer', icon: Disc },
    { value: 'singer', label: 'Vocal Studio', icon: Mic },
    { value: 'cloner', label: 'Voice Cloner', icon: UserRoundPlus },
    { value: 'studio', label: 'Sargam Studio', icon: MonitorPlay },
];

/**
 * The unified UI for the AI Creative Studio.
 */
export function SargamSuite() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const initialPrompt = searchParams.get('prompt');
    const autogen = searchParams.get('autogen') === 'true';
    const autoplay = searchParams.get('autoplay') === 'true';

    // Initialize the active tab from URL or default to the first tab.
    const [activeTab, setActiveTab] = useState(requestedTab || TABS[0].value);

    // Sync tab state with URL changes.
    useEffect(() => {
        if (requestedTab && TABS.some(t => t.value === requestedTab)) {
            setActiveTab(requestedTab);
        }
    }, [requestedTab]);

    const isGuest = user?.isAnonymous;

    return (
        <div className="space-y-16 pb-20">
            <div className="space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">AI Creative Studio</h1>
                    <p className="text-muted-foreground">
                        Create unique piano melodies, generate synchronized background tracks, or render high-quality AI animations.
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
                    <div className="flex justify-center mb-12">
                        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 max-w-4xl h-auto p-1 bg-muted/50 border border-border/50 rounded-2xl">
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
                        {activeTab === 'studio' && (
                            <SargamStudio />
                        )}
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
