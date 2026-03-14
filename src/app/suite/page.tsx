
import { SargamSuite } from '@/components/suite/SargamSuite';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function SuiteLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function SargamSuitePage() {
    return (
        <Suspense fallback={<SuiteLoader />}>
            <SargamSuite />
        </Suspense>
    );
}
