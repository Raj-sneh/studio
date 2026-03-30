
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
  title: "Sargam AI | AI Piano Tutor & Neural Voice Cloning Studio",
  description: "Sargam AI is an advanced AI music platform featuring a virtual piano, interactive lessons, and professional neural voice cloning. Compose, learn, and clone voices with research-grade AI.",
  keywords: [
    "Sargam AI",
    "Virtual Piano",
    "AI Piano Tutor",
    "Voice Cloning",
    "AI Voice Cloning",
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
    title: "Sargam AI | AI Piano Tutor & Voice Cloning Studio",
    description: "Master the piano and explore the future of neural sound with Sargam AI.",
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
                
                {/* QR Code Section */}
                <div className="flex flex-col items-center gap-4 group">
                  <div className="p-4 bg-white rounded-3xl shadow-2xl transition-transform duration-500 hover:scale-105 border-4 border-primary/20">
                    <div className="relative h-64 w-64 overflow-hidden rounded-2xl bg-gray-100 flex items-center justify-center">
                       <img 
                         src="https://firebasestorage.googleapis.com/v0/b/studio-4164192500-df01a.firebasestorage.app/o/upi-qr.png.jpg?alt=media&token=32be5ec3-371c-4144-be40-1a55a5917be8" 
                         alt="UPI QR Code for payment" 
                         className="h-full w-full object-contain p-2"
                       />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-foreground">Official Sargam AI UPI</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Verified Merchant Account</p>
                  </div>
                </div>

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
