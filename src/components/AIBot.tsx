'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { chat } from '@/ai/flows/conversational-flow';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { app } from '../lib/firebase';

export type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function AIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const isDevelopment = window.location.hostname === 'localhost';
        
        const siteKey = isDevelopment 
          ? process.env.NEXT_PUBLIC_RECAPTCHA_DEV_SITE_KEY 
          : process.env.NEXT_PUBLIC_RECAPTCHA_PROD_SITE_KEY;

        if (!siteKey || siteKey.includes('PASTE_YOUR_DEV_RECAPTCHA_KEY_HERE')) {
            if (isDevelopment) {
                console.warn("⚠️ App Check: Development reCAPTCHA key is missing. Please add NEXT_PUBLIC_RECAPTCHA_DEV_SITE_KEY to your .env.local file.");
            }
            return;
        }
        
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log("✅ App Check Initialized");

      } catch (err) {
        console.warn("App Check already initialized or failed to initialize.");
      }
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const result = await chat({ 
        history: [...messages, userMsg]
      });
      setMessages((prev) => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      console.error('AI chat failed:', error);
      setMessages((prev) => [...prev, { role: 'model', content: 'Security handshake in progress. Please ensure you have configured your development reCAPTCHA key and try again in 5 seconds.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return (
    <Button 
      onClick={() => setIsOpen(true)} 
      className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg z-50"
    >
      <Bot className="h-8 w-8" />
    </Button>
  );

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 h-[60vh] max-h-[700px] flex flex-col bg-card border rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-bold">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'p-3 rounded-lg max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-muted">
                    <span className="animate-pulse">...</span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
