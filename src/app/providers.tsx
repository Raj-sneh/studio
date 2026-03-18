'use client';

import { FirebaseClientProvider } from '@/firebase';
import { AppStateProvider } from '@/app/app-state-provider';
import { GameProvider } from '@/context/GameContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <GameProvider>
        <AppStateProvider>
          {children}
        </AppStateProvider>
      </GameProvider>
    </FirebaseClientProvider>
  );
}
