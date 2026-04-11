'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User, ImagePlus, X, ChevronDown, Volume2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UserProfile } from '@/types';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  prompt: z.string().min(1, { message: 'Please enter a message.' }),
});

type Message = {
  role: 'user' | 'model';
  content: string;
  image?: string;
};

const CHAT_HISTORY_KEY = 'skv-ai-history';
const HISTORY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function AiAssistant({ onAction }: { onAction?: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<{ prompt: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  // Load history with 24h expiry check
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const savedAt = parsed.timestamp || 0;

        // Only load if within the 24 hour window
        if (now - savedAt < HISTORY_EXPIRY_MS) {
          if (parsed.messages) setMessages(parsed.messages);
        } else {
          // Automatic Deletion: Expired
          localStorage.removeItem(CHAT_HISTORY_KEY);
        }
      } catch (e) {
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      }
    }
  }, []);

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        const { scrollHeight, scrollTop, clientHeight } = viewport;
        setShowScrollButton(scrollHeight - (scrollTop + clientHeight) > 150);
      }
    }
  };

  // Save history with timestamp (Sliding Window Protocol)
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify({ 
        messages, 
        timestamp: Date.now() 
      }));
    }
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const speak = async (text: string, index: number) => {
    if (isSpeaking !== null) return;
    setIsSpeaking(index);
    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'clive', sing: false, language: 'en' })
      });
      const data = await res.json();
      if (data.media) {
        const audio = new Audio(data.media);
        audio.onended = () => setIsSpeaking(null);
        audio.play();
      } else {
        setIsSpeaking(null);
      }
    } catch (e) {
      setIsSpeaking(null);
    }
  };

  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      form.setValue('prompt', transcript, { shouldValidate: true });
    };

    recognition.start();
  };

  const handleSubmit = async (data: { prompt: string }) => {
    const userMessage: Message = { role: 'user', content: data.prompt, image: selectedImage || undefined };
    setMessages(prev => [...prev, userMessage]);
    const imageToSend = selectedImage;
    setSelectedImage(null);
    form.reset();
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          prompt: data.prompt,
          userName: userProfile?.displayName,
          userId: user?.uid,
          photoDataUri: imageToSend,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      
      setMessages(prev => [...prev, { role: 'model', content: result.responseText }]);
      if (result.actionUrl) {
        router.push(result.actionUrl);
        if (onAction) onAction();
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: "Glitch in the matrix. 🎹" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent overflow-hidden relative">
      <CardHeader className="px-4 pb-2 shrink-0 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="text-primary h-5 w-5" />
              Sargam AI Assistant
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClearHistory} className="h-8 w-8 opacity-50 hover:opacity-100" title="Clear History">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 relative overflow-hidden bg-background/20">
        <ScrollArea className="h-full px-4" ref={scrollAreaRef} onScroll={handleScroll}>
            <div className="space-y-6 py-6">
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'flex-row-reverse' : '')}>
                        <Avatar className={cn("h-8 w-8 shrink-0 border", message.role === 'user' ? 'border-secondary/20' : 'border-primary/20')}>
                            <AvatarFallback className={message.role === 'user' ? 'bg-secondary/10' : 'bg-primary/10'}>
                                {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "rounded-2xl p-4 max-w-[85%] text-sm shadow-sm relative group",
                          message.role === 'user' ? 'bg-secondary/10 border border-secondary/20 text-foreground rounded-tr-none' : 'bg-muted/50 border border-border/50 rounded-tl-none'
                        )}>
                            {message.image && (
                              <div className="mb-3 relative rounded-xl overflow-hidden border border-white/10 aspect-video">
                                <Image src={message.image} alt="User upload" fill className="object-cover" />
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            {message.role === 'model' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => speak(message.content, index)}
                                className={cn("h-6 w-6 mt-2 rounded-full", isSpeaking === index && "animate-pulse text-primary")}
                                title="Listen to response"
                              >
                                <Volume2 className="h-3 w-3" />
                              </Button>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                          <Bot className="h-4 w-4 animate-spin text-primary" />
                        </div>
                        <div className="rounded-2xl p-4 bg-muted/30 border border-dashed border-primary/20">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        {showScrollButton && (
            <Button
                size="icon"
                className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-lg border border-primary bg-background/90 z-10"
                onClick={() => scrollToBottom()}
            >
                <ChevronDown className="h-4 w-4" />
            </Button>
        )}
      </div>

      <div className="p-4 border-t bg-card/90 backdrop-blur-xl shrink-0 sticky bottom-0 z-20">
          {selectedImage && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20 mb-4 shadow-xl">
              <Image src={selectedImage} alt="Preview" fill className="object-cover" />
              <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-6 w-6 rounded-none" onClick={() => setSelectedImage(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex items-end gap-2">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setSelectedImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-12 w-12 shrink-0 rounded-2xl bg-muted/50" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                  <ImagePlus className="h-5 w-5 opacity-60" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className={cn("h-12 w-12 shrink-0 rounded-2xl bg-muted/50", isListening && "text-red-500 animate-pulse")} onClick={toggleListening} disabled={isLoading}>
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 opacity-60" />}
                </Button>
              </div>
              <FormField control={form.control} name="prompt" render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input 
                        placeholder={isListening ? "Listening..." : "Solve math, ask science..."} 
                        {...field} 
                        autoComplete="off" 
                        disabled={isLoading} 
                        className="bg-muted/50 border-none h-12 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-2xl px-4" 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !form.formState.isValid} size="icon" className="h-12 w-12 shrink-0 rounded-2xl shadow-xl shadow-primary/20">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </Form>
      </div>
    </Card>
  );
}
