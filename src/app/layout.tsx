
import { Poppins, Roboto } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Header from "@/components/Header";
import { Providers } from './providers';
import { FloatingAssistantButton } from '@/components/FloatingAssistantButton';
import { GlobalCreditBar } from '@/components/GlobalCreditBar';
import { Heart } from 'lucide-react';

const fontHeadline = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
  weight: ['400', '600', '700'],
});

const fontBody = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sargam-ai.vercel.app'),
  title: "Voice Cloning AI | Sargam AI Piano Tutor & Neural Studio",
  description: "Sargam AI is the premier Voice Cloning AI and Piano Tutor. Features professional neural voice cloning, high-quality virtual piano, and interactive music lessons.",
  keywords: [
    "Voice Cloning AI",
    "AI Voice Cloning",
    "Sargam AI",
    "Virtual Piano",
    "AI Piano Tutor",
    "Neural Voice Synthesis",
    "AI Music Composition",
    "Sneh Kumar Verma",
    "ElevenLabs Voice Cloning",
    "Piano Lessons AI",
    "Music Research Preview",
    "Neural Song Swap"
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Voice Cloning AI | Sargam AI Piano Tutor & Studio",
    description: "Master the piano and clone voices with the future of neural sound at Sargam AI.",
    url: "https://sargam-ai.vercel.app",
    siteName: "Sargam AI",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn("font-body antialiased min-h-screen bg-background", fontHeadline.variable, fontBody.variable)}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-6 py-16 md:py-24">{children}</main>
            
            <footer className="py-12 bg-muted/20 border-t border-border/10 mt-20 px-6">
              <div className="container mx-auto max-w-4xl flex flex-col items-center gap-10 text-center">
                
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                    <Heart className="h-3 w-3 fill-primary" /> Support Neural Innovation
                  </div>
                  <h2 className="text-3xl font-bold font-headline">Fuel the Future of Sound</h2>
                </div>

                <div className="max-w-2xl">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    Sargam AI is a labor of love, crafted to bridge the gap between artificial intelligence and musical soul. 
                    Every contribution fuels our research into more complex neural models and brings us one step closer 
                    to the definitive mobile experience. If Sargam has touched your creative journey, 
                    please consider supporting Sneh's vision.
                  </p>
                </div>

                <div className="text-sm text-muted-foreground flex flex-col items-center gap-2 pt-4">
                  <p>Made with ❤️ by Sneh Kumar Verma</p>
                  <p className="text-[10px] opacity-50">© 2024 Sargam AI Studio • All Neural Rights Reserved</p>
                </div>
              </div>
            </footer>
          </div>
          <FloatingAssistantButton />
          <GlobalCreditBar />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
