
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ADMIN_EMAILS = ['snehkumarverma2011@gmail.com'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, isFirebaseReady } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const adminRoleRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, 'roles_admin', user.uid) : null),
    [firestore, user?.uid]
  );
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  useEffect(() => {
    if (isFirebaseReady && !isUserLoading && !isAdminLoading) {
      const isHardcodedAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
      if (!user || (!adminDoc && !isHardcodedAdmin)) {
        router.push('/');
      } else {
        setAuthChecked(true);
      }
    }
  }, [user, isUserLoading, adminDoc, isAdminLoading, router, isFirebaseReady]);

  if (!isFirebaseReady || isUserLoading || isAdminLoading || !authChecked) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
          Authenticating Admin Protocol...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
            <ShieldCheck className="h-3 w-3" /> System Administrator
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Sargam Command Center</h1>
          <p className="text-sm text-muted-foreground">Manage users, credits, and platform neural activity.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-full border-primary/20">
                <Link href="/">Exit Admin</Link>
            </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
