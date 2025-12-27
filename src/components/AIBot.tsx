
'use client';

// Add these at the very top with your other imports
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { useFirebaseApp } from '@/firebase'; // Import your initialized Firebase app

import { useEffect, useState, useRef } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chat, type ChatInput } from '@/ai/flows/conversational-flow';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const GREETING_KEY = 'socio_ai_greeted';

export function AIBot() {
  const { user } = useUser();
  const firebaseApp = useFirebaseApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (firebaseApp) {
      // IMPORTANT: Replace with your actual ReCaptcha Enterprise Site Key from the Firebase Console
      const enterpriseSiteKey = '6LdceDgsAAAAAG2u3dQNEXT6p7aUdIy1xgRoJmHE';
      try {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(enterpriseSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("Firebase App Check initialized in AIBot.");
      } catch (error) {
        console.error("Firebase App Check initialization failed in AIBot:", error);
      }
    }
  }, [firebaseApp]);

  useEffect(() => {
    const hasBeenGreeted = localStorage.getItem(GREETING_KEY);
    if (!hasBeenGreeted) {
      setIsOpen(true);
      const initialMessage: Message = {
        role: 'model',
        content: "Hello! I'm Socio's AI assistant. What's your name?",
      };
      setMessages([initialMessage]);
      localStorage.setItem(GREETING_KEY, 'true');
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to the bottom
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const chatInput: ChatInput = {
        history: newMessages,
      };
      const result = await chat(chatInput);
      const aiMessage: Message = { role: 'model', content: result.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat failed:', error);
      const errorMessage: Message = {
        role: 'model',
        content: 'Sorry, I seem to be having some trouble right now. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg"
      >
        <Bot className="h-8 w-8" />
        <span className="sr-only">Open AI Chat</span>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-[28rem] shadow-2xl flex flex-col z-50">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Socio AI
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-end gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-[80%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                  <div className="p-3 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-2 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full items-center gap-2"
        >
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
