'use client';

import { useState, useRef, PointerEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, X, GripHorizontal } from 'lucide-react';
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

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (e.button !== 0) return;
    
    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      hasDragged: false,
    };
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (!dragInfo.current.isDragging) return;

    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    
    if (!dragInfo.current.hasDragged && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        dragInfo.current.hasDragged = true;
    }

    if (dragInfo.current.hasDragged) {
        const newRight = position.right - deltaX;
        const newBottom = position.bottom - deltaY;

        // Constrain within window
        const margin = 8;
        const width = isOpen ? 400 : 64;
        const height = isOpen ? 600 : 64;
        
        const constrainedRight = Math.max(margin, Math.min(newRight, window.innerWidth - width - margin));
        const constrainedBottom = Math.max(margin, Math.min(newBottom, window.innerHeight - height - margin));
        
        setPosition({ right: constrainedRight, bottom: constrainedBottom });
        
        dragInfo.current.startX = e.clientX;
        dragInfo.current.startY = e.clientY;
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement | HTMLDivElement>) => {
    if (dragInfo.current.isDragging) {
      dragInfo.current.isDragging = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    
    // Small timeout to allow toggle logic to see if it was a drag
    setTimeout(() => {
      if (dragInfo.current) {
        // We don't reset hasDragged yet, we wait for the click handler
      }
    }, 0);
  };

  const handleToggle = (e: React.MouseEvent) => {
    // If it was a drag, don't toggle
    if (dragInfo.current.hasDragged) {
      dragInfo.current.hasDragged = false;
      return;
    }
    setIsOpen(!isOpen);
  };

  if (!mounted) return null;

  return (
    <div
      ref={wrapperRef}
      className="fixed z-[100] flex flex-col items-end gap-2"
      style={{
        right: `${position.right}px`,
        bottom: `${position.bottom}px`,
      }}
    >
      {/* Movable Chat Window */}
      {isOpen && (
        <div 
          className="w-[300px] sm:w-[400px] h-[500px] sm:h-[600px] glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Drag Handle for the window */}
          <div 
            className="h-8 bg-primary/20 flex items-center justify-center cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <GripHorizontal className="h-4 w-4 text-primary/60" />
          </div>
          
          <div className="flex-1 relative">
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full hover:bg-destructive/20 hover:text-destructive"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <AiAssistant onAction={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
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
        onClick={handleToggle}
        style={{ touchAction: 'none' }}
      >
        <Bot className="h-8 w-8" />
      </Button>
    </div>
  );
}
