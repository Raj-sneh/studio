'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIComposer } from '@/components/suite/AIComposer';
import { VocalStudio } from '@/components/suite/VocalStudio';
import { VoiceCloner } from '@/components/suite/VoiceCloner';
import { Music, Mic, UserRoundPlus } from 'lucide-react';

/**
 * Defines the available tabs in the AI Creative Studio.
 */
const TABS = [
    { value: 'composer', label: 'Melody Maker', icon: Music },
    { value: 'singer', label: 'Vocal Studio', icon: Mic },
    { value: 'cloner', label: 'Voice Cloner', icon: UserRoundPlus },
];

/**
 * The unified UI for the AI Creative Studio.
 */
export function SargamSuite() {
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
                                <TabsTrigger 
                                    key={tab.value} 
                                    value={tab.value} 
                                    className="gap-2 py-3 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all rounded-xl"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
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
        </div>
    );
}
