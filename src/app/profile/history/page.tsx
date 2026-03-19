'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash, Trash2, History, Mic, Piano, Calendar, Wand2, Loader2, ChevronLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import React from "react";

const deleteDocumentNonBlocking = (ref: any) => deleteDoc(ref);

export default function HistoryPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const historyQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'generatedMelodies'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: history, isLoading } = useCollection(historyQuery);

    const deleteItem = (id: string) => {
        if (!user || !firestore) return;
        const itemRef = doc(firestore, 'users', user.uid, 'generatedMelodies', id);
        deleteDocumentNonBlocking(itemRef);
    };

    const deleteAll = () => {
        if (!history || !user || !firestore) return;
        history.forEach(item => {
            const itemRef = doc(firestore, 'users', user.uid, 'generatedMelodies', item.id);
            deleteDocumentNonBlocking(itemRef);
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="font-headline text-3xl font-bold tracking-tighter flex items-center gap-3">
                        <History className="text-primary" />
                        Generation History
                    </h1>
                </div>
                {history && history.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" /> Clear All
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete everything?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently remove all your saved melodies.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={deleteAll}>Delete All</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {history && history.length > 0 ? (
                <div className="grid gap-4">
                    {history.map(item => (
                        <Card key={item.id} className="group overflow-hidden border-primary/5 hover:border-primary/20 transition-all bg-card/50">
                            <CardContent className="p-0">
                                <div className="flex items-stretch">
                                    <div className="w-16 bg-muted/50 flex flex-col items-center justify-center border-r">
                                        {item.generationContext === 'Vocal Studio' ? (
                                            <Mic className="h-6 w-6 text-secondary" />
                                        ) : (
                                            <Piano className="h-6 w-6 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 p-4 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-lg">{item.title}</h3>
                                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest bg-muted px-2 py-0.5 rounded">
                                                {item.generationContext}
                                            </span>
                                        </div>
                                        <p className="text-sm font-mono text-primary/80 line-clamp-1">
                                            {Array.isArray(item.notes) ? item.notes.join(' • ') : item.notes}
                                        </p>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {item.createdAt ? item.createdAt.toDate().toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : 'Just now'}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Wand2 className="h-3 w-3" />
                                                {item.instrument}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete this melody?</AlertDialogTitle>
                                                    <AlertDialogDescription>It will be removed from your history forever.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteItem(item.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed border-2 py-20 bg-muted/10">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                            <History className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-xl">Your stage is empty.</p>
                            <p className="text-muted-foreground max-w-xs">Start creating music in the AI Suite to build your history.</p>
                        </div>
                        <Button asChild variant="outline" size="lg">
                            <a href="/suite">Visit AI Suite</a>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
