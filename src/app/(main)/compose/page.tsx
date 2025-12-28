import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import the client-side component with SSR turned off. 
// This is crucial because Tone.js is a client-side library.
const ComposeClientPage = dynamic(() => import('./client-page'), {
  ssr: false,
  // Provide a loading component that will be displayed while the client page is loading.
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading Composer...</p>
      <p className="text-sm text-muted-foreground">This may take a moment.</p>
    </div>
  ),
});

/**
 * This is the main page component for the /compose route.
 * It uses Suspense to handle the asynchronous loading of the client-side component.
 * This setup ensures that the server does not attempt to render any components that rely on browser-specific APIs, preventing crashes.
 */
export default function ComposePage() {
  return (
    <Suspense fallback={null}> {/* The dynamic import's loading component is used instead */}
      <ComposeClientPage />
    </Suspense>
  );
}
