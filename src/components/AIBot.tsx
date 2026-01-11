
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Bot, Send, User, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { conversationalFlow } from '@/ai/flows/conversational-flow';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUser } from '@/firebase';

type Message = {
    role: 'user' | 'bot';
    content: string;
};

export default function AIBot() {
    const { toast } = useToast();
    const { user } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', content: "Hello! How can I help you with your musical journey today?" }
    ]);
    const [input, setInput] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const botResponseContent = await conversationalFlow(input);
            const botResponse: Message = { role: 'bot', content: botResponseContent };
            setMessages((prev) => [...prev, botResponse]);
        } catch (error) {
            console.error("AI chat failed:", error);
            toast({
                title: "AI Assistant Error",
                description: "Could not get a response from the AI. Please check the console.",
                variant: 'destructive'
            });
             setMessages((prev) => [...prev, {role: 'bot', content: "Sorry, I ran into a problem. Please try again."}]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-lg"
            >
                <Bot className="w-8 h-8" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-80 h-[28rem] flex flex-col shadow-lg rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="text-primary" /> AI Assistant
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === 'bot' && (
                                    <Avatar className="w-8 h-8 border-2 border-primary">
                                        <AvatarFallback><Bot size={20}/></AvatarFallback>
                                    </Avatar>
                                )}
                                <div
                                    className={cn(
                                        "p-3 rounded-lg max-w-[80%] text-sm",
                                        message.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    {message.content}
                                </div>
                                {message.role === 'user' && (
                                     <Avatar className="w-8 h-8">
                                         <AvatarImage src={user?.photoURL || ''} />
                                        <AvatarFallback><User size={20}/></AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3 justify-start">
                                <Avatar className="w-8 h-8 border-2 border-primary">
                                    <AvatarFallback><Bot size={20}/></AvatarFallback>
                                </Avatar>
                                <div className="p-3 rounded-lg bg-muted">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-2 border-t">
                <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about music..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
