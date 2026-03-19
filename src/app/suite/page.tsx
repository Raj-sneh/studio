'use client';

import { SargamSuite } from '@/components/suite/SargamSuite';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading fallback for the AI Studio.
 */
function SuiteLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * The main AI Studio route.
 * Uses a Suspense boundary to handle useSearchParams and lazy loading.
 */
export default function SargamSuitePage() {
  return (
    <Suspense fallback={<SuiteLoader />}>
      <SargamSuite />
    </Suspense>
  );
}
