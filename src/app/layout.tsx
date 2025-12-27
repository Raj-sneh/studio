import '@/lib/firebase'; // This runs your App Check activation code
import { Poppins, Roboto } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { AppStateProvider } from '@/app/app-state-provider';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

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
  title: 'Socio - AI Music Teacher',
  description: 'Learn music with your AI-powered teacher.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8391391679719370"
     crossOrigin="anonymous"></script>
      </head>
      <body className={cn("font-body antialiased min-h-screen bg-background", fontHeadline.variable, fontBody.variable)}>
        <FirebaseClientProvider>
          <AppStateProvider>
            {children}
          </AppStateProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
