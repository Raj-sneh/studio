'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinishSignInPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeSignIn = async () => {
      if (!auth) return;

      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation:');
        }

        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            toast({
              title: 'Success!',
              description: 'You have been successfully signed in.',
            });
            router.push('/profile');
          } catch (err: any) {
            setError(err.message || 'Failed to sign in. The link may be expired or invalid.');
            toast({ variant: 'destructive', title: 'Sign-in Failed', description: err.message });
            setLoading(false);
          }
        } else {
          setError('Email not found. Please try the sign-in process again.');
          toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'Email not provided.' });
          setLoading(false);
        }
      } else {
        setError('This is not a valid sign-in link.');
        toast({ variant: 'destructive', title: 'Invalid Link', description: 'Please return to the login page and try again.' });
        setLoading(false);
      }
    };

    if (auth) {
        completeSignIn();
    }

  }, [auth, router, toast]);

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Completing Sign-In</CardTitle>
          <CardDescription>Please wait while we securely sign you in.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-24">
          {loading && <Loader2 className="h-8 w-8 animate-spin" />}
          {error && <p className="text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
