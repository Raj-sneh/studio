'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Sparkles, Coffee } from 'lucide-react';

export function VoiceCloner() {
  const fundProject = () => {
    const upiId = "snehkumarverma@upi";
    alert(`🙏 Support Development\n\nYour contributions help keep Sargam AI growing. Send any amount to ${upiId} to support Sneh's research! 🚀`);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-primary/20 border-2 bg-card/40 backdrop-blur-md overflow-hidden relative shadow-2xl rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />
        <CardHeader className="text-center pt-12 pb-8">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border-2 border-primary/20">
                <Construction className="h-12 w-12 text-primary animate-bounce" />
            </div>
            <CardTitle className="text-4xl font-headline font-bold">In Development</CardTitle>
            <CardDescription className="text-lg mt-4 max-w-md mx-auto">
                Our high-fidelity Voice Cloning engine is currently being upgraded to support professional studio-grade quality.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10 px-10 pb-12">
          <div className="p-8 rounded-2xl bg-primary/5 border border-dashed border-primary/30 text-center space-y-4">
            <h4 className="text-xl font-bold text-primary flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" /> What's coming next?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2 max-w-sm mx-auto">
                <li>• Instant Zero-Shot Voice Cloning</li>
                <li>• Cross-Lingual Performance Support</li>
                <li>• High-Fidelity Emotion Control</li>
                <li>• Sub-500ms Synthesis Latency</li>
            </ul>
          </div>

          <div className="text-center space-y-6">
            <div className="space-y-2">
                <p className="font-bold text-foreground">Want to see this feature live soon?</p>
                <p className="text-sm text-muted-foreground">This project is purely community-funded. Support Sneh's research to speed up development.</p>
            </div>
            <Button onClick={fundProject} size="lg" className="h-14 px-10 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform bg-secondary text-secondary-foreground">
                <Coffee className="mr-2 h-6 w-6" /> Fund the Research
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
