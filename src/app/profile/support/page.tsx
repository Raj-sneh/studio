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
            <Card>
                <CardHeader>
                    <CardTitle>Get Assistance</CardTitle>
                    <CardDescription>We are here to help you with any issues or feedback.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex items-start gap-4">
                        <Instagram className="h-8 w-8 text-primary mt-1" />
                        <div className="space-y-1">
                            <h3 className="font-semibold">Instagram</h3>
                            <p className="text-sm text-muted-foreground">Follow us for updates, tips, and to see what others are creating!</p>
                            <a 
                                href="https://www.instagram.com/sargamskv.in?igsh=MTVkamx2em02dnFmOQ==" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary font-medium hover:underline flex items-center gap-1"
                            >
                                @sargamskv.in <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <LifeBuoy className="h-8 w-8 text-primary mt-1" />
                        <div className="space-y-1">
                            <h3 className="font-semibold">FAQ & Documentation</h3>
                            <p className="text-sm text-muted-foreground">Browse our frequently asked questions and guides to get the most out of Sargam AI.</p>
                            <Button variant="link" className="px-0 h-auto">Go to FAQ (coming soon)</Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <Mail className="h-8 w-8 text-primary mt-1" />
                        <div className="space-y-1">
                            <h3 className="font-semibold">Email Support</h3>
                            <p className="text-sm text-muted-foreground">For any technical issues or bug reports, please email us directly.</p>
                            <a href="mailto:hello@sargamskv.in" className="text-primary font-medium hover:underline">
                                hello@sargamskv.in
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <MessageSquare className="h-8 w-8 text-primary mt-1" />
                        <div className="space-y-1">
                            <h3 className="font-semibold">Feedback</h3>
                            <p className="text-sm text-muted-foreground">Have suggestions or want to share your experience? We&apos;d love to hear from you!</p>
                            <Button variant="outline" className="mt-2">Provide Feedback</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
