
'use client';

import { FirebaseClientProvider } from '@/firebase';
import { AppStateProvider } from '@/app/app-state-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppStateProvider>
        {children}
      </AppStateProvider>
    </FirebaseClientProvider>
  );
}
