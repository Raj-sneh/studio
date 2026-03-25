export default function PricingPage() {
  return (
    <div className="space-y-8 text-center max-w-2xl mx-auto py-20">
      <h1 className="font-headline text-4xl font-bold tracking-tight">Simple Pricing</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Every feature in Sargam AI is currently 100% free to use. We believe in making professional music tools accessible to everyone.
      </p>
      <div className="pt-10">
        <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 shadow-xl">
           <h2 className="text-2xl font-bold text-primary mb-4">Community Plan</h2>
           <p className="text-4xl font-black mb-6">₹0 <span className="text-sm font-normal text-muted-foreground">/ forever</span></p>
           <ul className="text-left space-y-3 mb-8 text-sm">
              <li>✅ Unlimited AI Melodies</li>
              <li>✅ Unlimited Vocal Synthesis</li>
              <li>✅ Full Virtual Piano Access</li>
              <li>✅ Real-time Voice Cloning</li>
              <li>✅ AI Music Tutor & Lessons</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
