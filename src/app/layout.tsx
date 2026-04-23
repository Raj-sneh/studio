'use client';

import { Poppins, Roboto } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import Header from "@/components/Header";
import { Providers } from './providers';
import { FloatingAssistantButton } from '@/components/FloatingAssistantButton';
import { GlobalCreditBar } from '@/components/GlobalCreditBar';
import UserNotice from '@/components/user-notice';
import { Heart, LifeBuoy } from 'lucide-react';
import Script from 'next/script';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

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

function AdScriptManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const showAds = !profile || profile.plan === 'free';

  if (!showAds) return null;

  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8391391679719370"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <Script 
        id="aclib" 
        src="//acscdn.com/script/aclib.js" 
        strategy="lazyOnload"
      />
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Sargam AI | Neural Studio & AI Music Creative Suite</title>
        <meta name="description" content="Sargam AI is the definitive Neural Studio for creators. Render cinematic animations, clone voices, or practice on our professional virtual grand piano." />
        <meta name="keywords" content="Neural Studio, AI Music Generator, Virtual Piano, AI Piano Tutor, Voice Cloning, Sargam AI, AI Vocal Studio, Music Learning AI, Neural Artist" />
        
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-ZKVHFQNVN0"
          strategy="afterInteractive"
        />
        <Script id="neural-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZKVHFQNVN0');
          `}
        </Script>
      </head>
      <body className={cn("font-body antialiased min-h-screen bg-background", fontHeadline.variable, fontBody.variable)}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <AdScriptManager />
            <UserNotice />
            <Header />
            <main className="flex-1 container mx-auto px-6 py-16 md:py-24">{children}</main>
            
            <footer className="py-12 bg-muted/20 border-t border-border/10 mt-20 px-6">
              <div className="container mx-auto max-w-4xl flex flex-col items-center gap-10 text-center">
                
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                    <Heart className="h-3 w-3 fill-primary" /> Support Neural Innovation
                  </div>
                  <h2 className="text-3xl font-bold font-headline">Fuel the Future of Sound with Sargam AI</h2>
                </div>

                <div className="flex items-center gap-6">
                  <Link href="/profile/support" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors">
                    <LifeBuoy className="h-3 w-3" /> Help & Support
                  </Link>
                  <Link href="/blog" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Learning Hub
                  </Link>
                  <Link href="/pricing" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </div>

                <div className="max-w-2xl">
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    Sargam AI is a labor of love, crafted to bridge the gap between human creativity and neural intelligence. 
                    Every contribution fuels our research into more complex generative models.
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
