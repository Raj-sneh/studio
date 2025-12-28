'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    if (typeof window !== 'undefined') {
      // 1. SET THE TOKEN BEFORE ANYTHING ELSE
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = "1E23C774-9D93-4324-9EE9-739B86DFD09A";
  
      const isDevelopment = window.location.hostname.includes('cloudworkstations.dev') || window.location.hostname === 'localhost';
      
      const RECAPTCHA_SITE_KEY = isDevelopment 
          ? "YOUR_DEV_RECAPTCHA_SITE_KEY" // Replace with your dev key
          : "6LdceDgsAAAAAG2u3dQNEXT6p7aUdIy1xgRoJmHE";

      console.log(`Using reCAPTCHA key: ${RECAPTCHA_SITE_KEY} for domain: ${window.location.hostname}`);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = 'gemini-1.5-flash-latest';
      console.log("Using model: gemini-2.5-flash"); // As requested by user
      const model = genAI.getGenerativeModel({ model: modelName });

      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(input);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [...prev, { role: 'model', content: text }]);
    } catch (error) {
      console.error('AI chat failed. Full error details:', error);
      setMessages((prev) => [...prev, { role: 'model', content: 'An error occurred. Please check the browser console for details.' }]);
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
