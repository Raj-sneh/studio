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
            <Header />
            <main className="flex-1 container mx-auto px-6 py-16 md:py-24">{children}</main>
            <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border/10 mt-20">
              Made with ❤️ for Musicians
            </footer>
          </div>
          <FloatingAssistantButton />
          <Toaster />

          {/* 🎙️ GLOBAL CREDIT & SUPPORT BAR */}
          <div 
            className="fixed bottom-0 left-0 w-full z-[100] bg-background/95 backdrop-blur border-t p-4 flex flex-col items-center justify-center gap-4 shadow-2xl"
            dangerouslySetInnerHTML={{ __html: `
              <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 24px; width: 100%; max-width: 1200px; margin: 0 auto;">
                
                <!-- 🔹 BALANCE SECTION -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 24px; border-right: 1px solid hsl(var(--border));">
                  <span style="font-size: 10px; font-weight: 900; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.1em;">Your Balance</span>
                  <div style="display: flex; items-center; gap: 8px;">
                    <span id="creditDisplay" style="font-size: 24px; font-weight: bold; color: hsl(var(--primary));">5</span>
                    <span style="font-size: 12px; color: hsl(var(--muted-foreground));">Credits</span>
                  </div>
                </div>

                <!-- 🔹 STATUS MESSAGE -->
                <div style="flex: 1; min-width: 250px; text-align: left;">
                  <h2 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--primary));">✨ AI Features Active</h2>
                  <p style="margin: 4px 0 0; font-size: 12px; color: hsl(var(--muted-foreground));">
                    Use Melody Maker or Vocal Studio (1 Credit per generation).
                  </p>
                </div>

                <!-- 🔹 COUPON REDEMPTION -->
                <div style="display: flex; flex-direction: column; gap: 8px; border-right: 1px solid hsl(var(--border)); padding-right: 24px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--primary)); text-align: center;">🎟️ Redeem Coupon</h3>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <input type="text" id="couponInput" placeholder="Enter code..." style="background: hsl(var(--background)); color: white; border: 1px solid hsl(var(--border)); padding: 6px 12px; border-radius: 8px; font-size: 12px; width: 120px;">
                    <button id="redeemBtn" onclick="redeemCoupon()" style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s;">Redeem</button>
                  </div>
                </div>

                <!-- 🔹 PREMIUM REFILL -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: hsl(var(--secondary)); text-align: center;">💎 Get More Credits</h3>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <button onclick="buyCredits(49, 100)" style="background: rgba(var(--secondary), 0.1); color: hsl(var(--secondary)); border: 1px solid hsl(var(--secondary)); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s;">₹49 (100 Cr)</button>
                    <button onclick="buyCredits(99, 250)" style="background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground)); padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s;">₹99 (250 Cr)</button>
                  </div>
                </div>

                <div style="width: 1px; height: 40px; background: hsl(var(--border));" class="hidden md:block"></div>

                <!-- 🔹 FUNDING SECTION -->
                <div style="display: flex; flex-direction: column; gap: 4px; align-items: center;">
                  <span style="font-size: 10px; font-weight: bold; color: hsl(var(--primary)); text-transform: uppercase;">Support Sneh</span>
                  <button onclick="fundProject()" style="background: transparent; color: white; border: 1px solid white; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer;">☕ Fund My Research</button>
                </div>

              </div>
              
              <script>
                // --- GLOBAL CREDIT SYSTEM ---
                const API_BASE_URL = "https://lourdes-hesitant-jeraldine.ngrok-free.dev";

                function getCredits() {
                    let c = parseInt(localStorage.getItem("sargam_credits"));
                    if (isNaN(c)) {
                        c = 5;
                        localStorage.setItem("sargam_credits", c);
                    }
                    return c;
                }

                function updateCreditUI() {
                    const display = document.getElementById("creditDisplay");
                    if (display) {
                        const credits = getCredits();
                        display.innerText = credits;
                        display.style.color = credits <= 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))";
                    }
                }
                
                async function redeemCoupon() {
                    const input = document.getElementById("couponInput");
                    const btn = document.getElementById("redeemBtn");
                    const code = input.value.trim();
                    
                    if (!code) {
                        alert("Please enter a coupon code.");
                        return;
                    }

                    btn.disabled = true;
                    btn.innerText = "⏳...";

                    try {
                        const formData = new FormData();
                        formData.append("code", code);

                        const res = await fetch(\`\${API_BASE_URL}/redeem\`, {
                            method: "POST",
                            body: formData
                        });

                        const data = await res.json();

                        if (data.status === "success") {
                            // Add credits to local storage
                            let current = getCredits();
                            localStorage.setItem("sargam_credits", current + data.credits);
                            
                            input.value = "";
                            window.dispatchEvent(new Event('creditsUpdated'));
                            alert(\`✅ Success! \${data.credits} credits added to your account. ✨\`);
                        } else {
                            alert(\`❌ \${data.message || "Invalid coupon code."}\`);
                        }
                    } catch (err) {
                        console.error("Redeem error:", err);
                        alert("❌ Backend is offline. Please try again later.");
                    } finally {
                        btn.disabled = false;
                        btn.innerText = "Redeem";
                    }
                }

                function buyCredits(amount, count) {
                    const upiId = "snehkumarverma@upi";
                    const message = \`💎 PREMIUM UPGRADE\\n\\n1. Send ₹\${amount} via UPI to: \${upiId}\\n2. Email payment proof to: support.sargamskv@gmail.com\\n\\nCredits will be added within 24h. ✨\`;
                    alert(message);
                }

                function fundProject() {
                    const upiId = "snehkumarverma@upi";
                    alert(\`🙏 Support Development\\n\\nYour contributions help keep Sargam AI growing. Send any amount to \${upiId} to support Sneh's research! 🚀\`);
                }

                // Initialize
                updateCreditUI();
                window.addEventListener('creditsUpdated', updateCreditUI);
                window.buyCredits = buyCredits;
                window.fundProject = fundProject;
                window.redeemCoupon = redeemCoupon;
              </script>
            `}}
          />
        </Providers>
      </body>
    </html>
  );
}
