

'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useFirebase } from '@/firebase/provider';

function ProfileSkeleton() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  if (isUserLoading || isProfileLoading || !userProfile) {
    return <ProfileSkeleton />;
  }
  
  return (
    <div className="space-y-8">
       <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-2 text-lg text-muted-foreground">View your account details.</p>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={user?.photoURL || ''} alt={userProfile.displayName} />
            <AvatarFallback className="text-3xl"><UserIcon /></AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="font-headline text-3xl">{userProfile.displayName}</CardTitle>
            <CardDescription>{userProfile.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
             <div>
                <h3 className="font-semibold mb-2">Member Since</h3>
                <p className="text-muted-foreground">{format(new Date(userProfile.createdAt), 'PPP')}</p>
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
