
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { ChevronRight, Loader2, User as UserIcon, Calendar, Mail, Save } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
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
        <div className="space-y-8 max-w-2xl mx-auto">
            <h1 className="font-headline text-3xl font-bold tracking-tighter">Your Profile</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <UserIcon className="h-5 w-5 text-primary" />
                        Personal Information
                    </CardTitle>
                    <CardDescription>Update your name, age, and other details.</CardDescription>
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
                                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                <FormLabel className="text-muted-foreground">Email Address (Primary)</FormLabel>
                                <div className="flex items-center gap-2 p-3 bg-muted rounded-md text-sm text-muted-foreground border border-dashed">
                                    <Mail className="h-4 w-4" />
                                    {profile?.email || user?.email || 'N/A'}
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-lg">
                                <Save className="mr-2 h-5 w-5" />
                                Save Changes
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Activity</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Link href="/profile/history" className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-primary/5 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <ChevronRight className="h-5 w-5 text-primary rotate-180" />
                            </div>
                            <div>
                                <h3 className="font-bold">Generation History</h3>
                                <p className="text-sm text-muted-foreground">See all the melodies you've created.</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
