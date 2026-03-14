'use client';

import { useState, useRef, PointerEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bot } from 'lucide-react';
import { AiAssistant } from '@/components/suite/AiAssistant';
import { cn } from '@/lib/utils';

export function FloatingAssistantButton() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ right: 32, bottom: 32 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    hasDragged: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    
    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      hasDragged: false,
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!dragInfo.current.isDragging) return;

    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    
    if (!dragInfo.current.hasDragged && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        dragInfo.current.hasDragged = true;
    }

    if (dragInfo.current.hasDragged && wrapperRef.current) {
        const newRight = position.right - deltaX;
        const newBottom = position.bottom - deltaY;

        const margin = 8;
        const constrainedRight = Math.max(margin, Math.min(newRight, window.innerWidth - wrapperRef.current.offsetWidth - margin));
        const constrainedBottom = Math.max(margin, Math.min(newBottom, window.innerHeight - wrapperRef.current.offsetHeight - margin));
        
        setPosition({ right: constrainedRight, bottom: constrainedBottom });
        
        dragInfo.current.startX = e.clientX;
        dragInfo.current.startY = e.clientY;
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (dragInfo.current.hasDragged) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (dragInfo.current.isDragging) {
      dragInfo.current.isDragging = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    
    setTimeout(() => {
      if (dragInfo.current) {
        dragInfo.current.hasDragged = false;
      }
    }, 0);
  };

  if (!mounted) return null;

  return (
    <div
      ref={wrapperRef}
      className="fixed z-[100]"
      style={{
        right: `${position.right}px`,
        bottom: `${position.bottom}px`,
      }}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={cn(
              "rounded-full h-16 w-16 shadow-2xl transition-transform hover:scale-110 bg-primary",
              dragInfo.current.isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            aria-label="Open AI Assistant"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
          >
            <Bot className="h-8 w-8" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-[400px] h-[600px] p-0 overflow-hidden rounded-2xl shadow-2xl mb-2"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <AiAssistant onAction={() => setIsOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
