'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { cn } from '@/lib/utils';
import { getSampler } from '@/lib/samplers';
import { Loader2, ZoomIn, ZoomOut, RotateCw, Sparkles, Music } from 'lucide-react';
import { PIANO_KEYS } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface PianoProps {
  onNoteDown?: (note: string) => void;
  onNoteUp?: (note: string) => void;
  onNotePlay?: (note: string) => void;
  disabled?: boolean;
  highlightedKeys?: string[];
  activeKeys?: string[] | null;
  holdState?: { key: string | string[]; progress: number } | null;
  interactiveMode?: boolean;
}

interface VisualEffect {
  id: number;
  note: string;
  x: number;
  y: number;
  type: 'ripple' | 'sparkle';
  icon?: any;
}

const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
const blackKeys = PIANO_KEYS.filter(k => k.isBlack);

const blackKeyPositions = blackKeys.reduce((acc, key) => {
  const keyIndex = PIANO_KEYS.findIndex(k => k.note === key.note);
  if (keyIndex > 0) {
    const precedingKey = PIANO_KEYS[keyIndex - 1];
    if (!precedingKey.isBlack) {
      const whiteKeyIndex = whiteKeys.findIndex(wk => wk.note === precedingKey.note);
      if (whiteKeyIndex > -1) {
        acc[key.note] = whiteKeyIndex + 1;
      }
    }
  }
  return acc;
}, {} as Record<string, number>);

const BASE_WHITE_KEY_WIDTH = 45;
const BASE_WHITE_KEY_MARGIN = 1;
const BASE_BLACK_KEY_WIDTH = 26;
const BASE_BLACK_KEY_OFFSET = -15;
const BASE_PIANO_HEIGHT = 240;
const BASE_WHITE_KEY_HEIGHT = 220;
const BASE_BLACK_KEY_HEIGHT = 140;
const BASE_FONT_SIZE = 10;

type PianoSynth = Tone.Sampler | Tone.PolySynth;

export default function Piano({ onNoteDown, onNoteUp, onNotePlay, disabled = false, highlightedKeys = [], activeKeys = null, holdState = null, interactiveMode = false }: PianoProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [effects, setEffects] = useState<VisualEffect[]>([]);
    
    const synthRef = useRef<PianoSynth | null>(null);
    const keyRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
    const pressedNotes = useRef<Set<string>>(new Set());
    const effectCounter = useRef(0);

    const whiteKeyWidth = BASE_WHITE_KEY_WIDTH * zoom;
    const whiteKeyMargin = BASE_WHITE_KEY_MARGIN * zoom;
    const totalWhiteKeyWidth = whiteKeyWidth + whiteKeyMargin * 2;
    const blackKeyWidth = BASE_BLACK_KEY_WIDTH * zoom;
    const blackKeyOffset = BASE_BLACK_KEY_OFFSET * zoom;
    const pianoHeight = BASE_PIANO_HEIGHT * zoom;
    const whiteKeyHeight = BASE_WHITE_KEY_HEIGHT * zoom;
    const blackKeyHeight = BASE_BLACK_KEY_HEIGHT * zoom;
    const fontSize = Math.max(BASE_FONT_SIZE * zoom, 9); 

    useEffect(() => {
        getSampler('piano').then(sampler => {
            synthRef.current = sampler as PianoSynth;
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load piano sounds", err);
            setIsLoading(false);
        });

        const handleGlobalPointerUp = () => {
            if (pressedNotes.current.size > 0 && synthRef.current && !synthRef.current.disposed) {
                pressedNotes.current.forEach(note => {
                    synthRef.current?.triggerRelease(note);
                    onNoteUp?.(note);
                });
                pressedNotes.current.clear();
            }
        };

        window.addEventListener('pointerup', handleGlobalPointerUp);

        return () => {
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            if (synthRef.current && !synthRef.current.disposed) {
                synthRef.current.releaseAll();
            }
        };
    }, [onNoteUp]);

    useEffect(() => {
        if (highlightedKeys && highlightedKeys.length > 0) {
            const keyToScrollTo = highlightedKeys[0];
            const keyElement = keyRefs.current.get(keyToScrollTo);
            if (keyElement) {
                keyElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [highlightedKeys]);

    const triggerVisualEffect = (note: string) => {
        const keyElement = keyRefs.current.get(note);
        if (!keyElement) return;

        const rect = keyElement.getBoundingClientRect();
        const parentRect = keyElement.parentElement?.getBoundingClientRect();
        if (!parentRect) return;

        const x = rect.left - parentRect.left + rect.width / 2;
        const y = rect.top - parentRect.top + rect.height / 2;

        const newEffects: VisualEffect[] = [
            { id: ++effectCounter.current, note, x, y, type: 'ripple' },
            { id: ++effectCounter.current, note, x, y: y - 20, type: 'sparkle', icon: Math.random() > 0.5 ? Sparkles : Music }
        ];

        setEffects(prev => [...prev, ...newEffects]);

        // Cleanup effects after animation
        setTimeout(() => {
            setEffects(prev => prev.filter(e => !newEffects.some(ne => ne.id === e.id)));
        }, 1000);
    };

    const playNoteTone = useCallback(async (note: string) => {
        await Tone.start();
        if (!synthRef.current || synthRef.current.disposed) {
            const piano = await getSampler('piano') as PianoSynth;
            synthRef.current = piano;
        }
        
        if (!pressedNotes.current.has(note)) {
            pressedNotes.current.add(note);
            synthRef.current.triggerAttack(note);
            triggerVisualEffect(note);
        }
    }, []);

    const releaseNoteTone = useCallback(async (note: string) => {
      if (!synthRef.current || synthRef.current.disposed) return;
      if (pressedNotes.current.has(note)) {
          pressedNotes.current.delete(note);
          synthRef.current.triggerRelease(note);
      }
    }, []);

    const handleNoteDown = (note: string) => {
      playNoteTone(note);
      onNoteDown?.(note);
      onNotePlay?.(note);
    };

    const handleNoteUp = (note: string) => {
      releaseNoteTone(note);
      onNoteUp?.(note);
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };
    
    if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center bg-card rounded-lg w-full border border-dashed border-primary/20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground font-headline">Concert Grand Tuning...</p>
          </div>
      );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center p-2 md:p-6 overflow-hidden">
            <div className="w-full max-w-md flex items-center gap-4 self-center mb-8 px-4 bg-muted/30 py-3 rounded-full border shadow-sm backdrop-blur-sm">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    aria-label="Zoom Piano"
                    className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <div className="w-px h-4 bg-border mx-1" />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleRotate} 
                    className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
                    title="Rotate Piano"
                >
                    <RotateCw className="h-4 w-4" />
                </Button>
            </div>
            <div 
                className="w-full transition-all duration-500 ease-in-out origin-center"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <ScrollArea className="w-full max-w-full rounded-2xl border-4 border-muted bg-muted p-2 shadow-2xl">
                    <div 
                      className="relative flex bg-black rounded-xl select-none"
                      style={{
                        width: whiteKeys.length * totalWhiteKeyWidth,
                        height: pianoHeight
                      }}
                    >
                        {/* Visual Effects Layer */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                            {effects.map(effect => (
                                <div 
                                    key={effect.id}
                                    className={effect.type === 'ripple' ? 'piano-ripple' : 'piano-sparkle'}
                                    style={{
                                        left: effect.x,
                                        top: effect.y,
                                        width: effect.type === 'ripple' ? '40px' : 'auto',
                                        height: effect.type === 'ripple' ? '40px' : 'auto',
                                        marginLeft: effect.type === 'ripple' ? '-20px' : '0',
                                        marginTop: effect.type === 'ripple' ? '-20px' : '0',
                                    }}
                                >
                                    {effect.type === 'sparkle' && effect.icon && (
                                        <effect.icon className="h-6 w-6" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {whiteKeys.map(({ note }) => {
                            const isKeyActive = !disabled && (!activeKeys || activeKeys.includes(note));
                            const isHighlighted = highlightedKeys?.includes(note);
                            const isHolding = holdState?.key === note || (Array.isArray(holdState?.key) && holdState?.key.includes(note));

                            return (
                                <div
                                    key={note}
                                    ref={(el) => { keyRefs.current.set(note, el) }}
                                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); if(isKeyActive) handleNoteDown(note); }}
                                    onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); if(isKeyActive) handleNoteUp(note); }}
                                    onPointerLeave={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) handleNoteUp(note); }}
                                    className={cn(
                                        "key flex items-end justify-center pb-4 cursor-pointer transition-all duration-100 rounded-b-lg user-select-none relative",
                                        "bg-gradient-to-b from-gray-100 to-white border-x border-gray-200 shadow-sm text-gray-400 font-bold",
                                        isHighlighted && "from-primary/20 to-primary/40 border-primary ring-4 ring-primary/30 z-30 text-primary-foreground",
                                        !isKeyActive && 'opacity-40 cursor-not-allowed bg-gray-300'
                                    )}
                                    style={{
                                    width: whiteKeyWidth,
                                    height: whiteKeyHeight,
                                    margin: `0 ${whiteKeyMargin}px`,
                                    touchAction: interactiveMode ? 'none' : 'auto'
                                    }}
                                >
                                    {isHolding && holdState && (
                                        <div
                                            className="absolute bottom-0 left-0 w-full rounded-b-lg overflow-hidden"
                                            style={{
                                                height: `${holdState.progress}%`,
                                                background: 'linear-gradient(to top, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.7))',
                                                transition: 'height 0.016s linear',
                                            }}
                                        />
                                    )}
                                    <span className="pointer-events-none z-10 select-none" style={{ fontSize: fontSize }}>{note}</span>
                                </div>
                            )
                        })}
                        {blackKeys.map(({ note }) => {
                             const isKeyActive = !disabled && (!activeKeys || activeKeys.includes(note));
                             const isHighlighted = highlightedKeys?.includes(note);
                             const isHolding = holdState?.key === note || (Array.isArray(holdState?.key) && holdState?.key.includes(note));
                             return (
                                <div
                                    key={note}
                                    ref={(el) => { keyRefs.current.set(note, el) }}
                                    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); if(isKeyActive) handleNoteDown(note); }}
                                    onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); if(isKeyActive) handleNoteUp(note); }}
                                    onPointerLeave={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) handleNoteUp(note); }}
                                    className={cn(
                                        "key flex items-end justify-center pb-4 cursor-pointer transition-all duration-100 rounded-b-md user-select-none text-gray-500 font-bold",
                                        "bg-gradient-to-b from-gray-900 to-black border-x border-gray-800 shadow-lg z-20 absolute",
                                        isHighlighted && "from-primary/60 to-primary border-primary ring-4 ring-primary/40 text-white",
                                        !isKeyActive && "opacity-30 cursor-not-allowed bg-black"
                                    )}
                                    style={{ 
                                    width: blackKeyWidth,
                                    height: blackKeyHeight,
                                    left: `${(blackKeyPositions[note] || 0) * totalWhiteKeyWidth + blackKeyOffset}px`,
                                    touchAction: interactiveMode ? 'none' : 'auto'
                                    }}
                                >
                                    {isHolding && holdState && (
                                         <div
                                            className="absolute bottom-0 left-0 w-full rounded-b-md overflow-hidden"
                                            style={{
                                                height: `${holdState.progress}%`,
                                                background: 'linear-gradient(to top, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.7))',
                                                transition: 'height 0.016s linear',
                                            }}
                                        />
                                    )}
                                    <span className="pointer-events-none z-10 select-none" style={{ fontSize: fontSize }}>{note}</span>
                                </div>
                            )
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
}