

'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the client-side page with SSR turned off inside a Client Component.
// This is the correct pattern for Next.js App Router.
const ComposeClientPage = dynamic(() => import('./client-page'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading Composer...</p>
      <p className="text-sm text-muted-foreground">This may take a moment.</p>
    </div>
  ),
});

/**
 * This component is responsible for loading the actual client-side
 * composer page, which cannot be rendered on the server.
 */
export default function ComposeLoader() {
  return <ComposeClientPage />;
}
