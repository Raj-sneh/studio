import { Poppins, Roboto } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { AppStateProvider } from '@/app/app-state-provider';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Header from "@/components/Header";

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
  title: 'Sargam by SKV - AI Music Teacher',
  description: 'Learn music with your AI-powered teacher.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className={cn("font-body antialiased min-h-screen bg-background", fontHeadline.variable, fontBody.variable)}>
        <FirebaseClientProvider>
          <AppStateProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
            </div>
          </AppStateProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
