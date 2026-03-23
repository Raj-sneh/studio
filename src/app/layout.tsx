import { Poppins, Roboto } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import Header from "@/components/Header";
import { Providers } from './providers';
import { FloatingAssistantButton } from '@/components/FloatingAssistantButton';
import { Sparkles } from 'lucide-react';

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
  title: "Sargam AI | Virtual Piano & AI Music Learning",
  description: "Sargam AI is an AI-powered virtual piano and music learning platform. Practice piano, learn music, and create melodies with AI.",
  keywords: ["Sargam AI", "virtual piano", "AI piano tutor", "music learning AI", "online piano practice"],
  creator: "Sargam AI Studio",
  publisher: "Sargam AI Studio",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sargam-ai.vercel.app",
    title: "Sargam AI | Virtual Piano & AI Music Learning",
    description: "Sargam AI is an AI-powered virtual piano and music learning platform. Master the piano with the help of artificial intelligence.",
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
    title: "Sargam AI | AI Piano Tutor",
    description: "Practice piano and generate music with AI.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
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
            {/* Announcement Banner */}
            <div className="bg-primary/20 border-b border-primary/30 py-2 px-4 text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              Sargam AI is completely free for now!
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </div>
            
            <Header />
            <main className="flex-1 container mx-auto px-6 py-16 md:py-24">{children}</main>
            <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border/10 mt-20">
              Made with ❤️ for Musicians
            </footer>
          </div>
          <FloatingAssistantButton />
          <Toaster />

          {/* User Custom Snippet */}
          <div 
            className="fixed bottom-0 left-0 w-full z-[100] bg-background/95 backdrop-blur border-t p-4 flex flex-col items-center justify-center gap-4 shadow-2xl"
            dangerouslySetInnerHTML={{ __html: `
              <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 24px; width: 100%;">
                
                <!-- 🔹 TTS SECTION -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <h2 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--primary));">🎙️ AI Voice Generator</h2>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="text" id="text" placeholder="Enter text" style="background: black; color: white; border: 1px solid hsl(var(--border)); padding: 6px 12px; border-radius: 6px; font-size: 14px; width: 200px;">
                    <button onclick="generate()" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 14px;">Generate Voice</button>
                    <audio id="player" controls style="height: 32px;"></audio>
                  </div>
                </div>

                <div style="width: 1px; height: 40px; background: hsl(var(--border));"></div>

                <!-- 🔹 UPLOAD SECTION -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--secondary));">🎙️ Upload Your Voice (Premium)</h3>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="file" id="voiceFile" accept="audio/*" style="color: white; font-size: 12px;">
                    <button onclick="uploadVoice()" style="background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; font-size: 14px;">Upload Voice</button>
                    <p id="uploadStatus" style="margin: 0; font-size: 12px; color: hsl(var(--muted-foreground)); min-width: 100px;"></p>
                  </div>
                </div>

              </div>
              
              <script>
                // Persistent User ID Logic
                let user_id = localStorage.getItem("user_id");
                if (!user_id) {
                    user_id = Date.now().toString();
                    localStorage.setItem("user_id", user_id);
                }

                // 🔥 GENERATE TTS
                async function generate() {
                    const text = document.getElementById("text").value;

                    if (!text) {
                        alert("Enter text first");
                        return;
                    }

                    try {
                        const formData = new FormData();
                        formData.append("text", text);

                        const res = await fetch("https://lourdes-hesitant-jeraldine.ngrok-free.dev/tts", {
                            method: "POST",
                            body: formData
                        });

                        if (!res.ok) {
                            alert("TTS failed ❌");
                            return;
                        }

                        const blob = await res.blob();

                        if (blob.size === 0) {
                            alert("Empty audio ❌");
                            return;
                        }

                        const url = URL.createObjectURL(blob);
                        document.getElementById("player").src = url;
                        document.getElementById("player").play();

                    } catch (err) {
                        console.error(err);
                        alert("Error ❌");
                    }
                }

                // 🔥 UPLOAD VOICE
                async function uploadVoice() {
                    const fileInput = document.getElementById("voiceFile");
                    const status = document.getElementById("uploadStatus");
                    const file = fileInput.files[0];

                    if (!file) {
                        alert("Select a file first");
                        return;
                    }

                    status.innerText = "Uploading... ⏳";

                    try {
                        const formData = new FormData();
                        formData.append("file", file);

                        // Use the persistent user_id from localStorage
                        formData.append("user_id", user_id);

                        const res = await fetch("https://lourdes-hesitant-jeraldine.ngrok-free.dev/upload", {
                            method: "POST",
                            body: formData
                        });

                        if (!res.ok) {
                            status.innerText = "Upload failed ❌";
                            return;
                        }

                        status.innerText = "Voice uploaded ✅";
                        alert("Voice uploaded ✅");

                    } catch (err) {
                        console.error(err);
                        status.innerText = "Error ❌";
                        alert("Error ❌");
                    }
                }
                
                // Make functions globally available
                window.generate = generate;
                window.uploadVoice = uploadVoice;
              </script>
            `}}
          />
        </Providers>
      </body>
    </html>
  );
}
