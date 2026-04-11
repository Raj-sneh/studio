
'use client';

import { useState, useMemo } from 'react';
import { 
    useFirestore, 
    useCollection, 
    useMemoFirebase,
    updateDocumentNonBlocking
} from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { 
    Users, 
    Zap, 
    ShieldCheck, 
    Search, 
    Edit, 
    ArrowUpCircle, 
    ArrowDownCircle,
    Music,
    Mic2,
    Calendar,
    Settings2,
    Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [creditDelta, setCreditDelta] = useState<string>('0');

    // Fetch all users
    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u => 
            u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.id.includes(searchTerm)
        );
    }, [users, searchTerm]);

    const stats = useMemo(() => {
        if (!users) return { totalUsers: 0, totalCredits: 0, proUsers: 0 };
        return {
            totalUsers: users.length,
            totalCredits: users.reduce((acc, u) => acc + (u.credits || 0), 0),
            proUsers: users.filter(u => u.plan === 'pro' || u.plan === 'creator').length
        };
    }, [users]);

    const handleUpdateCredits = (userId: string, currentCredits: number) => {
        if (!firestore) return;
        const delta = parseInt(creditDelta);
        if (isNaN(delta)) {
            toast({ title: "Invalid Amount", variant: "destructive" });
            return;
        }

        const userRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userRef, { 
            credits: Math.max(0, currentCredits + delta) 
        });
        
        toast({ title: "Credits Updated", description: `${delta > 0 ? '+' : ''}${delta} credits applied.` });
        setEditingUserId(null);
        setCreditDelta('0');
    };

    const handleUpdatePlan = (userId: string, newPlan: string) => {
        if (!firestore) return;
        const userRef = doc(firestore, 'users', userId);
        updateDocumentNonBlocking(userRef, { plan: newPlan });
        toast({ title: "Plan Updated", description: `User switched to ${newPlan} plan.` });
    };

    return (
        <div className="space-y-10 pb-32">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/10 rounded-3xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Total Registered</CardDescription>
                        <CardTitle className="text-4xl font-bold flex items-center gap-3">
                            <Users className="h-6 w-6 text-primary" />
                            {stats.totalUsers}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-secondary/5 border-secondary/10 rounded-3xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-secondary">Neural Allocation</CardDescription>
                        <CardTitle className="text-4xl font-bold flex items-center gap-3">
                            <Zap className="h-6 w-6 text-secondary" />
                            {Math.floor(stats.totalCredits)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-accent/5 border-accent/10 rounded-3xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-accent">Premium Members</CardDescription>
                        <CardTitle className="text-4xl font-bold flex items-center gap-3">
                            <ShieldCheck className="h-6 w-6 text-accent" />
                            {stats.proUsers}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Tabs defaultValue="users" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto border border-border/50">
                    <TabsTrigger value="users" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-background">User Directory</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-xl px-8 py-2.5 font-bold data-[state=active]:bg-background">Platform Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name, email, or UID..." 
                                className="pl-10 rounded-xl bg-muted/20 border-primary/10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {filteredUsers.map(u => (
                            <Card key={u.id} className="border-primary/5 hover:border-primary/20 transition-all bg-card/50 overflow-hidden rounded-[1.5rem]">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                                                <AvatarImage src={u.avatarUrl || ''} />
                                                <AvatarFallback>{u.displayName?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="truncate">
                                                <h3 className="font-bold text-lg truncate flex items-center gap-2">
                                                    {u.displayName}
                                                    {u.plan !== 'free' && <ShieldCheck className="h-3 w-3 text-primary" />}
                                                </h3>
                                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                <p className="text-[8px] font-mono text-muted-foreground/50 truncate mt-1">UID: {u.id}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:items-center">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Neural Plan</p>
                                                <div className="flex gap-1">
                                                    {['free', 'creator', 'pro'].map(p => (
                                                        <Button 
                                                            key={p} 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => handleUpdatePlan(u.id, p)}
                                                            className={cn(
                                                                "h-6 px-2 text-[9px] uppercase font-black rounded-md",
                                                                u.plan === p ? "bg-primary/20 text-primary" : "text-muted-foreground opacity-50"
                                                            )}
                                                        >
                                                            {p}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Credits</p>
                                                {editingUserId === u.id ? (
                                                    <div className="flex items-center gap-2 animate-in zoom-in-95">
                                                        <Input 
                                                            type="number" 
                                                            value={creditDelta} 
                                                            onChange={(e) => setCreditDelta(e.target.value)}
                                                            className="h-8 w-20 bg-muted/50 border-primary/20 text-xs"
                                                        />
                                                        <Button size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleUpdateCredits(u.id, u.credits || 0)}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-primary">{u.credits ?? 0}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-50 hover:opacity-100" onClick={() => {
                                                            setEditingUserId(u.id);
                                                            setCreditDelta('0');
                                                        }}>
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="hidden sm:block space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Joined</p>
                                                <p className="text-[10px]">{u.createdAt ? new Date(u.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="activity" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-primary/10 bg-muted/10 rounded-[2rem] p-12 text-center">
                        <Settings2 className="h-12 w-12 text-primary mx-auto mb-4 opacity-20" />
                        <h3 className="font-bold text-xl">Advanced Monitoring Protocol</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">
                            Platform activity logs are being optimized for high-volume neural research. Real-time stream coming in future update.
                        </p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
