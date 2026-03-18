'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Gamepad2, 
  Loader2, 
  RotateCcw, 
  Trophy, 
  Target, 
  Flame,
  AlertTriangle,
  Music2
} from 'lucide-react';
import { generateNotes } from '@/ai/flows/generate-notes-flow';
import type { NoteObject } from '@/ai/flows/generate-notes-types';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';
import * as Tone from 'tone';
import { getSampler } from '@/lib/samplers';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const RUNNER_X = 100;
const RUNNER_SIZE = 40;
const NOTE_SIZE = 30;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 60;
const BASE_SPEED = 5;

type GameObject = {
  id: string;
  x: number;
  y: number;
  type: 'note' | 'obstacle';
  data?: NoteObject;
  hit?: boolean;
};

export function PulseRunner() {
  const { toast } = useToast();
  const { 
    score, combo, accuracy, setGameActive, updateStats, resetGame 
  } = useGame();

  const [prompt, setPrompt] = useState('');
  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'gameover' | 'won'>('idle');
  const [progress, setProgress] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null); 
  const objectsRef = useRef<GameObject[]>([]);
  const melodyRef = useRef<NoteObject[]>([]);
  const pendingNotesRef = useRef<NoteObject[]>([]);
  const speedRef = useRef(BASE_SPEED);
  const distanceRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const synthRef = useRef<any>(null);

  const startNewGame = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe a tune to start the run!", variant: "destructive" });
      return;
    }

    setGameState('loading');
    resetGame();
    
    try {
      const result = await generateNotes({ text: prompt });
      if (!result || !result.notes.length) throw new Error("Could not generate tune.");

      melodyRef.current = [...result.notes].sort((a, b) => Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds());
      pendingNotesRef.current = [...melodyRef.current];
      objectsRef.current = [];
      distanceRef.current = 0;
      lastSpawnRef.current = 0;
      speedRef.current = BASE_SPEED;
      
      await Tone.start();
      synthRef.current = await getSampler('piano');
      
      setGameState('playing');
      setGameActive(true);
      requestRef.current = requestAnimationFrame(gameLoop);
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
      setGameState('idle');
    }
  };

  const handleInput = useCallback((noteKey: string) => {
    if (gameState !== 'playing') return;

    const nearestNote = objectsRef.current.find(obj => 
      obj.type === 'note' && 
      !obj.hit && 
      Math.abs(obj.x - RUNNER_X) < 60 && 
      obj.data?.key === noteKey
    );

    if (nearestNote) {
      nearestNote.hit = true;
      const timingBonus = Math.max(0, 50 - Math.abs(nearestNote.x - RUNNER_X));
      updateStats(true, Math.round(timingBonus));
      if (synthRef.current) synthRef.current.triggerAttackRelease(noteKey, "8n");
    }
  }, [gameState, updateStats]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = {
        'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5'
      };
      if (keyMap[e.key]) handleInput(keyMap[e.key]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  const gameLoop = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    distanceRef.current += speedRef.current;
    
    if (pendingNotesRef.current.length > 0) {
      const nextNote = pendingNotesRef.current[0];
      const noteTime = Tone.Time(nextNote.time).toSeconds() * 100;
      if (distanceRef.current / speedRef.current >= noteTime) {
        objectsRef.current.push({
          id: Math.random().toString(),
          x: GAME_WIDTH,
          y: GAME_HEIGHT / 2,
          type: 'note',
          data: nextNote
        });
        pendingNotesRef.current.shift();
      }
    }

    if (time - lastSpawnRef.current > 2000 / (speedRef.current / 5)) {
        if (Math.random() > 0.7) {
            objectsRef.current.push({
                id: Math.random().toString(),
                x: GAME_WIDTH,
                y: GAME_HEIGHT - OBSTACLE_HEIGHT - 10,
                type: 'obstacle'
            });
            lastSpawnRef.current = time;
        }
    }

    objectsRef.current = objectsRef.current.filter(obj => {
      obj.x -= speedRef.current;

      if (obj.x < RUNNER_X - 50 && obj.type === 'note' && !obj.hit) {
        updateStats(false, 0);
        pendingNotesRef.current.push(obj.data!);
        return false;
      }

      if (obj.type === 'obstacle' && 
          obj.x < RUNNER_X + RUNNER_SIZE && 
          obj.x + OBSTACLE_WIDTH > RUNNER_X && 
          obj.y < GAME_HEIGHT) {
        setGameState('gameover');
        setGameActive(false);
        return false;
      }

      return obj.x > -50;
    });

    const totalNotes = melodyRef.current.length;
    const notesHandled = totalNotes - pendingNotesRef.current.length;
    const currentProgress = (notesHandled / totalNotes) * 100;
    setProgress(currentProgress);

    if (pendingNotesRef.current.length === 0 && objectsRef.current.filter(o => o.type === 'note').length === 0) {
       setGameState('won');
       setGameActive(false);
    }

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT - 10);
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - 10);
    ctx.stroke();

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(RUNNER_X, GAME_HEIGHT - RUNNER_SIZE - 10, RUNNER_SIZE, RUNNER_SIZE);
    
    objectsRef.current.forEach(obj => {
      if (obj.type === 'note') {
        ctx.shadowColor = obj.hit ? '#4ade80' : '#f472b6';
        ctx.fillStyle = obj.hit ? '#4ade80' : '#f472b6';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, NOTE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obj.data?.key || '', obj.x, obj.y + 4);
      } else {
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(obj.x, obj.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      }
    });
    ctx.shadowBlur = 0;

    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <section className="mt-20 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2">
        <div className="space-y-1">
          <h2 className="text-5xl font-black font-headline tracking-tighter italic uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary">
            Pulse Runner
          </h2>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">AI Rhythm Action Studio</p>
        </div>
        
        {gameState === 'playing' && (
          <div className="flex items-center gap-8 bg-card/40 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Score</span>
              <span className="text-2xl font-black font-mono text-primary">{score.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Combo</span>
              <span className="text-2xl font-black font-mono text-secondary">x{combo}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Accuracy</span>
              <span className="text-2xl font-black font-mono text-white">{accuracy}%</span>
            </div>
          </div>
        )}
      </div>

      <Card className="overflow-hidden border-primary/20 bg-black/60 backdrop-blur-xl shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        
        <CardContent className="p-0">
          {gameState === 'idle' && (
            <div className="p-12 space-y-8 flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                <Gamepad2 className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-4 max-w-lg">
                <h3 className="text-3xl font-headline font-bold">Describe Your Challenge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Enter any mood or theme, and our AI will compose a unique piano runner track for you to master.
                </p>
                <div className="space-y-4 pt-4">
                  <Textarea 
                    placeholder="e.g., 'Aggressive techno piano', 'Melancholic rain melody'..." 
                    className="min-h-[100px] bg-white/5 border-white/10 text-lg rounded-2xl focus:ring-primary/40"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <Button onClick={startNewGame} className="w-full h-16 text-lg font-bold rounded-2xl group overflow-hidden">
                    <Zap className="mr-2 h-5 w-5 fill-primary transition-transform group-hover:scale-125" />
                    GENERATE & START RUN
                  </Button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'loading' && (
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <Music2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-secondary animate-pulse" />
              </div>
              <p className="text-xl font-headline font-bold animate-pulse">Composing Original Run...</p>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'gameover' || gameState === 'won') && (
            <div className="relative group">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                  <Music2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground truncate max-w-[200px]">{prompt}</span>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-xs mx-8">
                  <Progress value={progress} className="h-1.5" />
                  <span className="text-[10px] font-bold font-mono text-muted-foreground w-8">{Math.round(progress)}%</span>
                </div>
              </div>

              <div className="relative overflow-hidden bg-black h-[200px]">
                <canvas 
                  ref={canvasRef} 
                  width={GAME_WIDTH} 
                  height={GAME_HEIGHT}
                  className="w-full h-full"
                />
                
                {gameState === 'gameover' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-300">
                    <div className="flex flex-col items-center">
                        <AlertTriangle className="h-16 w-16 text-destructive mb-2" />
                        <h3 className="text-4xl font-black font-headline uppercase italic text-destructive">CRASHED!</h3>
                        <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Obstacle Hit</p>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={startNewGame} size="lg" className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90">
                            <RotateCcw className="mr-2 h-5 w-5" /> REPLAY
                        </Button>
                        <Button onClick={() => setGameState('idle')} variant="outline" size="lg" className="h-14 px-8 rounded-2xl">
                            EXIT
                        </Button>
                    </div>
                  </div>
                )}

                {gameState === 'won' && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-md flex flex-col items-center justify-center space-y-6 animate-in zoom-in duration-500">
                    <div className="flex flex-col items-center">
                        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(0,255,255,0.5)] mb-4">
                            <Trophy className="h-10 w-10 text-black" />
                        </div>
                        <h3 className="text-5xl font-black font-headline uppercase italic text-white tracking-tighter">RUN COMPLETED</h3>
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={startNewGame} size="lg" className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 shadow-2xl shadow-primary/20">
                            <RotateCcw className="mr-2 h-5 w-5" /> NEW RUN
                        </Button>
                        <Button onClick={() => setGameState('idle')} variant="outline" size="lg" className="h-14 px-8 rounded-2xl">
                            STUDIO
                        </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/20 grid grid-cols-4 md:grid-cols-8 gap-2">
                {[
                    {k: 'A', n: 'C4'}, {k: 'S', n: 'D4'}, {k: 'D', n: 'E4'}, {k: 'F', n: 'F4'},
                    {k: 'G', n: 'G4'}, {k: 'H', n: 'A4'}, {k: 'J', n: 'B4'}, {k: 'K', n: 'C5'}
                ].map(key => (
                  <Button 
                    key={key.k} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 rounded-xl bg-black/40 border-white/5 hover:border-primary/50"
                    onClick={() => handleInput(key.n)}
                    disabled={gameState !== 'playing'}
                  >
                    <span className="text-[10px] font-black opacity-40">{key.k}</span>
                    <span className="font-mono text-sm">{key.n}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-6 bg-card/40 rounded-3xl border border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h4 className="font-bold">Focus Mode</h4>
                <p className="text-xs text-muted-foreground">Hit piano notes to fuel your runner.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-card/40 rounded-3xl border border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <Flame className="h-6 w-6 text-secondary" />
            </div>
            <div>
                <h4 className="font-bold">Combo Multiplier</h4>
                <p className="text-xs text-muted-foreground">Consecutive hits skyrocket your score.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-card/40 rounded-3xl border border-white/5">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
                <h4 className="font-bold">Zero Death</h4>
                <p className="text-xs text-muted-foreground">Avoid obstacles to keep the tune alive.</p>
            </div>
          </div>
      </div>
    </section>
  );
}
