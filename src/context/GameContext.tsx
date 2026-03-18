'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  isGameActive: boolean;
}

interface GameContextType extends GameState {
  setScore: (score: number) => void;
  setCombo: (combo: number) => void;
  setGameActive: (active: boolean) => void;
  updateStats: (hit: boolean, timingBonus: number) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isGameActive, setIsGameActive] = useState(false);
  const [totalNotes, setTotalNotes] = useState(0);
  const [hitNotes, setHitNotes] = useState(0);

  const updateStats = useCallback((hit: boolean, timingBonus: number) => {
    setTotalNotes(prev => prev + 1);
    if (hit) {
      setHitNotes(prev => prev + 1);
      setCombo(prev => {
        const next = prev + 1;
        setMaxCombo(m => Math.max(m, next));
        return next;
      });
      setScore(prev => prev + 100 + timingBonus + (combo * 10));
    } else {
      setCombo(0);
      setScore(prev => Math.max(0, prev - 50));
    }

    // Update accuracy
    setTimeout(() => {
        setAccuracy(prev => {
            const currentTotal = totalNotes + 1;
            const currentHits = hit ? hitNotes + 1 : hitNotes;
            return Math.round((currentHits / currentTotal) * 100);
        });
    }, 0);
  }, [combo, hitNotes, totalNotes]);

  const resetGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy(100);
    setTotalNotes(0);
    setHitNotes(0);
    setIsGameActive(false);
  }, []);

  return (
    <GameContext.Provider value={{
      score, combo, maxCombo, accuracy, isGameActive,
      setScore, setCombo, setGameActive: setIsGameActive,
      updateStats, resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}
