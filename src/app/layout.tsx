import { Poppins, Roboto } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Header from "@/components/Header";
import { Providers } from './providers';
import { FloatingAssistantButton } from '@/components/FloatingAssistantButton';

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
  title: "Sargam AI | Virtual Piano & AI Music Learning by SKV",
  description: "Sargam AI is an AI-powered virtual piano and music learning platform by Sneh Kumar Verma (SKV). Practice piano, learn music, and create melodies with AI.",
  keywords: ["Sargam AI", "Sneh Kumar Verma", "SKV AI", "piano AI", "virtual piano", "AI piano tutor", "music learning AI", "online piano practice"],
  authors: [{ name: "Sneh Kumar Verma", url: "https://github.com/snehkumarverma" }],
  creator: "Sneh Kumar Verma",
  publisher: "SKV AI Studio",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sargam-ai.vercel.app",
    title: "Sargam AI | Virtual Piano & AI Music Learning by SKV",
    description: "Sargam AI is an AI-powered virtual piano and music learning platform by Sneh Kumar Verma (SKV). Master the piano with the help of artificial intelligence.",
    siteName: "Sargam AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sargam AI Music Station",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sargam AI | AI Piano Tutor by SKV",
    description: "Practice piano and generate music with AI. Created by Sneh Kumar Verma.",
    images: ["/og-image.png"],
    creator: "@snehkumarverma",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
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
            <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border/10 mt-20">
              Made with ❤️ in 🇮🇳 By Sneh Kumar Verma (SKV)
            </footer>
          </div>
          <FloatingAssistantButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
