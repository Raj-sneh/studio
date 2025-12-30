
import { Suspense } from 'react';
import ComposeLoader from './compose-loader';
import { Loader2 } from 'lucide-react';

/**
 * This is the main page component for the /compose route.
 * It's a Server Component that wraps the client-side loader in a Suspense boundary.
 */
export default function ComposePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-full text-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading Composer...</p>
        <p className="text-sm text-muted-foreground">This may take a moment.</p>
      </div>
    }>
      <ComposeLoader />
    </Suspense>
  );
}
