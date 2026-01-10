import { Wand2 } from 'lucide-react';

export default function ComposePageComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh] bg-background rounded-lg p-8">
      <div className="p-5 bg-primary/10 rounded-full border-4 border-primary/20">
        <Wand2 className="h-12 w-12 text-primary" />
      </div>
      <div className="max-w-md">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
          AI Composer Coming Soon!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We're hard at work tuning our AI to help you create amazing music. This feature will be available shortly. Stay tuned!
        </p>
      </div>
    </div>
  );
}
