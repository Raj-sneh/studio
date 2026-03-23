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

          {/* 🎙️ AI VOICE GENERATOR APP & CREDIT SYSTEM */}
          <div 
            className="fixed bottom-0 left-0 w-full z-[100] bg-background/95 backdrop-blur border-t p-4 flex flex-col items-center justify-center gap-4 shadow-2xl"
            dangerouslySetInnerHTML={{ __html: `
              <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 24px; width: 100%; max-width: 1200px; margin: 0 auto;">
                
                <!-- 🔹 BALANCE SECTION -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 12px; border-right: 1px solid hsl(var(--border));">
                  <span style="font-size: 10px; font-weight: 900; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.1em;">Balance</span>
                  <div style="display: flex; items-center; gap: 8px;">
                    <span id="creditDisplay" style="font-size: 20px; font-weight: bold; color: hsl(var(--primary));">5</span>
                    <span style="font-size: 12px; color: hsl(var(--muted-foreground));">Credits</span>
                  </div>
                </div>

                <!-- 🔹 TTS GENERATOR SECTION -->
                <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 300px;">
                  <h2 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--primary)); display: flex; align-items: center; gap: 6px;">
                    🎙️ AI Voice Generator 
                    <span id="creditStatus" style="font-size: 10px; font-weight: normal; color: hsl(var(--muted-foreground));">(1 credit per generation)</span>
                  </h2>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="text" id="textInput" placeholder="Enter text to speak..." style="background: black; color: white; border: 1px solid hsl(var(--border)); padding: 8px 12px; border-radius: 8px; font-size: 14px; flex: 1;">
                    <button id="genBtn" onclick="generate()" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; font-size: 14px; white-space: nowrap; transition: all 0.2s;">Generate</button>
                    <audio id="player" controls style="height: 36px;"></audio>
                  </div>
                </div>

                <div style="width: 1px; height: 40px; background: hsl(var(--border)); display: none;" class="md:block"></div>

                <!-- 🔹 REFILL / PREMIUM SECTION -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--secondary));">💎 Refill Credits</h3>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="buyCredits(49, 100)" style="background: rgba(var(--secondary), 0.1); color: hsl(var(--secondary)); border: 1px solid hsl(var(--secondary)); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; transition: 0.2s;">₹49 (100 Cr)</button>
                    <button onclick="buyCredits(99, 250)" style="background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s;">₹99 (250 Cr)</button>
                  </div>
                </div>

              </div>
              
              <script>
                // --- CREDIT SYSTEM LOGIC ---
                let credits = parseInt(localStorage.getItem("sargam_credits"));
                if (isNaN(credits)) {
                    credits = 5; // Initial free credits
                    localStorage.setItem("sargam_credits", credits);
                }

                function updateCreditUI() {
                    const display = document.getElementById("creditDisplay");
                    const btn = document.getElementById("genBtn");
                    display.innerText = credits;
                    
                    if (credits <= 0) {
                        display.style.color = "hsl(var(--destructive))";
                        btn.innerText = "Buy Premium";
                        btn.style.background = "hsl(var(--secondary))";
                    } else {
                        display.style.color = "hsl(var(--primary))";
                        btn.innerText = "Generate";
                        btn.style.background = "hsl(var(--primary))";
                    }
                }
                
                // Initialize UI
                updateCreditUI();

                // 🔥 GENERATE TTS WITH CREDIT CHECK
                async function generate() {
                    if (credits <= 0) {
                        alert("⚠️ Out of credits! Please Buy Premium to continue generating voices.");
                        return;
                    }

                    const text = document.getElementById("textInput").value;
                    const btn = document.getElementById("genBtn");

                    if (!text) {
                        alert("Enter text first");
                        return;
                    }

                    btn.disabled = true;
                    btn.innerText = "Processing... ⏳";

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

                        // Deduct Credit on Success
                        credits -= 1;
                        localStorage.setItem("sargam_credits", credits);
                        updateCreditUI();

                        const url = URL.createObjectURL(blob);
                        const player = document.getElementById("player");
                        player.src = url;
                        player.play();

                    } catch (err) {
                        console.error(err);
                        alert("Connection Error ❌");
                    } finally {
                        if (credits > 0) btn.innerText = "Generate";
                        btn.disabled = false;
                    }
                }

                // 🔥 PREMIUM PURCHASE FLOW (MANUAL)
                function buyCredits(amount, count) {
                    const upiId = "snehkumarverma@upi"; // Example UPI
                    const message = \`💎 PREMIUM UPGRADE\\n\\n1. Send ₹\${amount} via UPI to: \${upiId}\\n2. Send a screenshot of the payment to: support.sargamskv@gmail.com\\n\\nYour account will be credited with \${count} credits manually after verification. ✨\`;
                    alert(message);
                }

                window.generate = generate;
                window.buyCredits = buyCredits;
              </script>
            `}}
          />
        </Providers>
      </body>
    </html>
  );
}
