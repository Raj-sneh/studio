'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, sendSignInLinkToEmail, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

import { useAuth, useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleIcon from '@/components/icons/GoogleIcon';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AnimatedMusicBackground } from '@/components/AnimatedMusicBackground';

const emailFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const phoneFormSchema = z.object({
  phone: z.string().min(10, { message: 'Please enter a valid phone number with country code.' }),
});

const otpFormSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});

function EmailLoginForm({ onLoadingChange }: { onLoadingChange: (isLoading: boolean) => void }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isEmailLoading, setEmailLoading] = useState(false);

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    onLoadingChange(isEmailLoading);
  }, [isEmailLoading, onLoadingChange]);

  const handleEmailSignIn = async (values: z.infer<typeof emailFormSchema>) => {
    if (!auth) return;
    setEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Success!',
        description: 'You have successfully signed in.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: 'Invalid email or password. Please try again.',
      });
      setEmailLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleEmailSignIn)} className="space-y-4">
        <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" disabled={isEmailLoading} className="w-full">
          {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}

function PhoneLoginForm({ onLoadingChange }: { onLoadingChange: (isLoading: boolean) => void }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const phoneForm = useForm<z.infer<typeof phoneFormSchema>>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: '' },
  });
  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  const handleSendOtp = async (values: z.infer<typeof phoneFormSchema>) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-login', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, values.phone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'OTP Sent', description: 'Check your phone for the verification code.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send OTP',
        description: error.message || 'Please check the phone number and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (values: z.infer<typeof otpFormSchema>) => {
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
      await confirmationResult.confirm(values.otp);
      toast({
        title: 'Success!',
        description: 'You have successfully signed in.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'OTP Verification Failed',
        description: error.message || 'The code is incorrect. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <Form {...otpForm}>
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
          <FormField control={otpForm.control} name="otp" render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123456" 
                    className="font-mono text-center tracking-[1em] pl-[1em] text-2xl text-primary font-bold h-14" 
                    maxLength={6}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
          )}/>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep('phone')} disabled={isLoading}>Back</Button>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP & Sign In
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...phoneForm}>
      <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
        <FormField control={phoneForm.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send OTP
        </Button>
      </form>
    </Form>
  );
}

function EmailLinkLoginForm({ onLoadingChange }: { onLoadingChange: (isLoading: boolean) => void }) {
    const auth = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<{ email: string }>({
        resolver: zodResolver(z.object({ email: z.string().email({ message: 'Please enter a valid email.' }) })),
        defaultValues: { email: '' },
    });

    useEffect(() => {
        onLoadingChange(isLoading);
    }, [isLoading, onLoadingChange]);

    const handleEmailLinkSignIn = async (values: { email: string }) => {
        if (!auth) return;
        setIsLoading(true);
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/finish-signin`,
                handleCodeInApp: true,
            };
            await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', values.email);
            toast({
                title: 'Check Your Email',
                description: 'A magic sign-in link has been sent to your email address.',
            });
            form.reset();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send Link',
                description: error.message || 'Please check the email and try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEmailLinkSignIn)} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Magic Link
                </Button>
            </form>
        </Form>
    );
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [isFormLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push('/profile');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setGoogleLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      toast({
        title: 'Success!',
        description: 'You have successfully signed in.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not sign in with Google.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const anyLoading = isGoogleLoading || isFormLoading;

  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden flex items-center justify-center py-12 min-h-[calc(100vh-theme(spacing.32))]">
      <AnimatedMusicBackground />
      <Card className="w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Sargam AI account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
              <TabsTrigger value="link">Magic Link</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="pt-4">
              <EmailLoginForm onLoadingChange={setFormLoading} />
            </TabsContent>
            <TabsContent value="phone" className="pt-4">
              <PhoneLoginForm onLoadingChange={setFormLoading} />
            </TabsContent>
            <TabsContent value="link" className="pt-4">
              <EmailLinkLoginForm onLoadingChange={setFormLoading} />
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/80 px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button onClick={handleGoogleSignIn} disabled={anyLoading} className="w-full" variant="outline" size="lg">
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
            Sign in with Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm">
          <div id="recaptcha-container-login"></div>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
