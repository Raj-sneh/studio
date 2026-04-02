
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Mail, MessageSquare, Instagram, ExternalLink, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
    const router = useRouter();

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tighter">Support & Help</h1>
            </div>
            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Get Assistance</CardTitle>
                    <CardDescription>We are here to help you with any issues or feedback regarding Sargam AI.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 pt-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <Instagram className="h-8 w-8 text-primary mt-1 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">Official Instagram</h3>
                            <p className="text-sm text-muted-foreground">Follow us for updates, tips, and to share your musical creations!</p>
                            <a 
                                href="https://www.instagram.com/sargamskv.in/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary font-bold hover:underline flex items-center gap-1 pt-2"
                            >
                                @sargamskv.in <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <Mail className="h-8 w-8 text-primary mt-1 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">Email Support</h3>
                            <p className="text-sm text-muted-foreground">For technical issues, bug reports, or partnership inquiries, please reach out directly.</p>
                            <a href="mailto:hello@sargamskv.in" className="text-primary font-bold hover:underline text-lg block pt-2">
                                hello@sargamskv.in
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <LifeBuoy className="h-8 w-8 text-primary mt-1 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">FAQ & Documentation</h3>
                            <p className="text-sm text-muted-foreground">Browse our guides to get the most out of our Virtual Piano and Voice Cloner.</p>
                            <Button variant="link" onClick={() => router.push('/blog')} className="px-0 h-auto font-bold pt-2">Visit Learning Hub</Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                        <MessageSquare className="h-8 w-8 text-primary mt-1 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg">Feedback</h3>
                            <p className="text-sm text-muted-foreground">Have suggestions? We&apos;d love to hear how we can improve Sargam AI for you.</p>
                            <Button variant="outline" className="mt-3 rounded-xl border-primary/20 hover:bg-primary/5">Provide Feedback</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="text-center pt-8 text-muted-foreground text-xs italic">
                Sargam AI is developed with passion by Sneh Kumar Verma.
            </div>
        </div>
    );
}
