'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Loader2, Send, User, Trash2, ImagePlus, X, ChevronDown } from 'lucide-react';
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
const CHAT_HISTORY_TTL = 24 * 60 * 60 * 1000;
const CHAT_HISTORY_API_LIMIT = 20;

export function AiAssistant({ onAction }: { onAction?: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory && savedHistory !== 'undefined' && savedHistory !== 'null') {
        const { timestamp, messages: savedMessages } = JSON.parse(savedHistory);
        if (Date.now() - timestamp > CHAT_HISTORY_TTL) {
          localStorage.removeItem(CHAT_HISTORY_KEY);
          return [];
        }
        return savedMessages || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to parse chat history from localStorage', error);
      localStorage.removeItem(CHAT_HISTORY_KEY);
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior
            });
        }
    }
  };

  const handleScroll = () => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            const isAtBottom = viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + 100;
            setShowScrollButton(!isAtBottom);
        }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const historyToSave = {
          timestamp: Date.now(),
          messages: messages,
        };
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(historyToSave));
      } catch (error) {
        console.error('Failed to save chat history to localStorage', error);
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (data: { prompt: string }) => {
    const userMessage: Message = { 
      role: 'user', 
      content: data.prompt,
      image: selectedImage || undefined
    };
    
    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    
    const imageToSend = selectedImage;
    setSelectedImage(null);
    form.reset();
    setIsLoading(true);

    try {
      const historyForApi = messages.slice(-CHAT_HISTORY_API_LIMIT).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyForApi,
          prompt: data.prompt,
          userName: userProfile?.displayName,
          userId: user?.uid,
          photoDataUri: imageToSend,
        }),
      });
      
      const resText = await res.text();
      let result;
      try {
        result = resText ? JSON.parse(resText) : {};
      } catch (e) {
        throw new Error("I received an unexpected response from the server. Please try again in a moment.");
      }
      
      if (!res.ok) {
        throw new Error(result.responseText || result.message || `API error: ${res.status}`);
      }
      
      const responseText = result.responseText || "I'm sorry, I couldn't generate a response.";
      const actionUrl = result.actionUrl;

      const botMessage: Message = { role: 'model', content: responseText };
      setMessages(prev => [...prev, botMessage]);

      if (actionUrl) {
        router.push(actionUrl);
        if (onAction) {
          onAction();
        }
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      const errorMessage: Message = {
        role: 'model',
        content: error.message || "I had a quick glitch. Please try saying that again! 🎹",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  return (
    <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
      <CardHeader className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
              <Bot className="text-primary h-6 w-6" />
              SKV AI
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClearChat}
            disabled={messages.length === 0 || isLoading}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
             Ask me anything about music or how to use Sargam.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden px-4 relative">
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
                {messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'model' && (
                            <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                                <div className="bg-primary/10 h-full w-full flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-primary" />
                                </div>
                            </Avatar>
                        )}
                        <div className={cn(
                            "rounded-2xl p-3 max-w-[85%] md:max-w-[300px] text-sm",
                            message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'
                        )}>
                            {message.image && (
                              <div className="mb-2 relative rounded-lg overflow-hidden border border-white/10 aspect-video">
                                <Image src={message.image} alt="User upload" fill className="object-cover" />
                              </div>
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                         {message.role === 'user' && (
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]"><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                            <div className="bg-primary/10 h-full w-full flex items-center justify-center">
                                <Bot className="h-4 w-4 animate-spin text-primary" />
                            </div>
                        </Avatar>
                        <div className="rounded-2xl p-3 bg-muted rounded-tl-none">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>

        {showScrollButton && (
            <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-20 right-8 h-10 w-10 rounded-full shadow-lg border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50"
                onClick={() => scrollToBottom()}
            >
                <ChevronDown className="h-5 w-5 text-primary" />
            </Button>
        )}

        <div className="mt-auto pt-4 border-t space-y-4">
          {selectedImage && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted">
              <Image src={selectedImage} alt="Preview" fill className="object-cover" />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-0 right-0 h-5 w-5 rounded-none rounded-bl-md"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageSelect}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 shrink-0 border-primary/20"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input 
                        placeholder="Say something..." 
                        {...field} 
                        disabled={isLoading} 
                        className="bg-muted/50 border-none h-10 focus-visible:ring-1 focus-visible:ring-primary/30"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading || !form.formState.isValid} size="icon" className="h-10 w-10 shrink-0 shadow-lg shadow-primary/20">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
