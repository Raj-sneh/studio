'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chat } from '@/ai/flows/conversational-flow';
import { cn } from '@/lib/utils';

// SECURITY IMPORTS
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
// This relative path fixes the 'module not found' error
import { app } from '@/lib/firebase'; 

export function AIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Activate Debug Mode
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  
      // 2. FORCE AN ALERT BOX WITH THE TOKEN
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('AppCheck debug token')) {
          alert("COPY THIS TOKEN: " + args[0]); // This forces a popup!
        }
        originalLog.apply(console, args);
      };
  
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider('6LdceDgsAAAAAG2u3dQNEXT6p7aUdIy1xgRoJmHE'),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn("App Check active.");
      }
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chat({ history: [...messages, userMsg] });
      setMessages((prev) => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      console.error('AI chat failed:', error);
      setMessages((prev) => [...prev, { role: 'model', content: 'Security Error: Please register Debug Token in Firebase.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg z-50">
        <Bot className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-[28rem] shadow-2xl flex flex-col z-50">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />Socio AI
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('p-3 rounded-lg max-w-[80%] text-sm break-words', m.role === 'user' ? 'bg-primary text-white' : 'bg-muted')}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-2 border-t">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-center gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Type a message..." 
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
