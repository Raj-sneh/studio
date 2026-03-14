'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Music } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50),
});

interface WelcomeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveName: (name: string) => Promise<void>;
  isSaving: boolean;
  currentName: string;
}

export function WelcomeModal({ isOpen, onOpenChange, onSaveName, isSaving, currentName }: WelcomeModalProps) {
  const form = useForm<{ displayName: string }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: (currentName && currentName !== 'Guest User') ? currentName : '',
    },
  });
  
  const handleSubmit = (data: { displayName: string }) => {
    onSaveName(data.displayName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline font-bold">Welcome to Sargam AI</DialogTitle>
          <DialogDescription>
            Enter your name to start your musical journey.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Stage Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name..." {...field} disabled={isSaving} className="h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving} className="w-full h-12 font-bold text-lg">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Started
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
