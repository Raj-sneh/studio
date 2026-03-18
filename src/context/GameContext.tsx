'use client';
/**
 * Game context has been removed.
 */
export const useGame = () => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  accuracy: 0,
  isGameActive: false,
  setScore: () => {},
  setCombo: () => {},
  setGameActive: () => {},
  updateStats: () => {},
  resetGame: () => {},
});
export function GameProvider({ children }: { children: any }) { return children; }
