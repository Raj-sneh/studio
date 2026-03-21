'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ChevronRight, Loader2, User as UserIcon, Calendar, Mail, Save, ChevronLeft, Camera } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import React from 'react';

const profileSchema = z.object({
    displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    dob: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
    const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: '',
            dob: '',
            gender: 'prefer-not-to-say',
        },
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                displayName: profile.displayName || '',
                dob: profile.dob ? new Date(profile.dob.toDate()).toISOString().split('T')[0] : '',
                gender: (profile.gender as any) || 'prefer-not-to-say',
            });
        }
    }, [profile, form]);

    const onSubmit = async (values: ProfileFormValues) => {
        if (!userDocRef) return;

        const updatedData: any = {
            displayName: values.displayName,
            gender: values.gender,
        };

        if (values.dob) {
            updatedData.dob = Timestamp.fromDate(new Date(values.dob));
        }

        try {
          await updateDoc(userDocRef, updatedData);
          toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
        } catch (e) {
          toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    if (isProfileLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="font-headline text-3xl font-bold tracking-tighter">Your Profile</h1>
            </div>

            {/* Profile Avatar Header */}
            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-card border border-primary/10 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        <AvatarImage 
                            src={user?.photoURL || profile?.avatarUrl || undefined} 
                            alt={user?.displayName || "User"} 
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/20 text-primary flex items-center justify-center">
                            <UserIcon className="h-16 w-16 opacity-50" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg">
                        <Camera className="h-4 w-4 text-primary-foreground" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold font-headline">{user?.displayName || "Guest User"}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email || "No email linked"}</p>
                </div>
            </div>
            
            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <UserIcon className="h-5 w-5 text-primary" />
                        Personal Information
                    </CardTitle>
                    <CardDescription>Update your public identity and details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="dob"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Birth</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input type="date" className="pl-10 h-10 w-full rounded-md border bg-background" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <select 
                                              {...field}
                                              className="flex h-10 w-full rounded-md border border-input bg-black text-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                              <option value="male">Male</option>
                                              <option value="female">Female</option>
                                              <option value="other">Other</option>
                                              <option value="prefer-not-to-say">Prefer not to say</option>
                                            </select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <FormLabel className="text-muted-foreground">Linked Email</FormLabel>
                                <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-xl text-sm text-muted-foreground border border-dashed border-primary/20">
                                    <Mail className="h-4 w-4 text-primary" />
                                    {user?.email || 'N/A'}
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/10">
                                <Save className="mr-2 h-5 w-5" />
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="border-primary/10 overflow-hidden">
                <CardHeader>
                    <CardTitle>Account Activity</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Link href="/profile/history" className="flex items-center justify-between p-5 rounded-2xl bg-muted/50 hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ChevronRight className="h-6 w-6 text-primary rotate-180" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Generation History</h3>
                                <p className="text-sm text-muted-foreground">Review your AI-composed tracks and lyrics.</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
