'use client';

import React, { useState } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chat } from '@/ai/flows/conversational-flow';
import { cn } from '@/lib/utils';

export function AIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);

    const userMsg = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      // The AI flow needs a valid token to proceed. App Check is initialized in FirebaseClientProvider.
      const result = await chat({ history: [...messages, userMsg] });
      setMessages((prev) => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      console.error('AI chat failed:', error);
      // If it fails, it's usually because the App Check token wasn't sent or is invalid.
      setMessages((prev) => [...prev, { role: 'model', content: 'An error occurred. If this is your first request, the security handshake may be in progress. Please try again in 5 seconds. Ensure your App Check debug token is registered in Firebase.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return (
    <Button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg">
      <Bot className="h-8 w-8" />
    </Button>
  );

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-[28rem] shadow-2xl flex flex-col z-50">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-card">
        <CardTitle className="text-lg flex items-center gap-2"><Bot className="h-6 w-6 text-primary" />Socio AI</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 bg-card">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('p-3 rounded-lg max-w-[80%] text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-2 border-t bg-card">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Socio AI..." disabled={isLoading} />
          <Button type="submit" size="icon" disabled={isLoading}><Send className="h-4 w-4" /></Button>
        </form>
      </CardFooter>
    </Card>
  );
}
