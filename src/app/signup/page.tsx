'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile, EmailAuthProvider, linkWithCredential, type ConfirmationResult } from 'firebase/auth';

import { useAuth, useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AnimatedMusicBackground } from '@/components/AnimatedMusicBackground';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phoneNumber: z.string().min(10, { message: 'Please enter a valid phone number with country code.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'Your OTP must be 6 digits.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [formValues, setFormValues] = useState<FormValues | null>(null);

  const detailsForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { displayName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push('/profile');
    }
  }, [user, isUserLoading, router]);

  const handleDetailsSubmit = async (values: FormValues) => {
    if (!auth) return;
    setIsLoading(true);
    setFormValues(values);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-signup', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, values.phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast({ title: 'OTP Sent!', description: `A verification code has been sent to ${values.phoneNumber}.` });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could Not Send OTP',
        description: error.message || 'Please check the phone number and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (values: z.infer<typeof otpSchema>) => {
    if (!confirmationResult || !formValues || !auth) return;
    setIsLoading(true);
    try {
      // Confirm the OTP, which signs the user in with their phone
      const userCredential = await confirmationResult.confirm(values.otp);
      const phoneUser = userCredential.user;

      // Create an email/password credential
      const emailCredential = EmailAuthProvider.credential(formValues.email, formValues.password);
      
      // Link the new email/password credential to the now-signed-in phone user
      await linkWithCredential(phoneUser, emailCredential);

      // Finally, update the user's profile with their display name
      await updateProfile(phoneUser, {
        displayName: formValues.displayName,
      });

      toast({
        title: 'Account Created!',
        description: 'You have been successfully signed up and logged in.',
      });
      // The onAuthStateChanged listener will handle redirect via useEffect.
    } catch (error: any) {
      let description = 'Could not create your account. Please try again.';
      if (error.code === 'auth/email-already-in-use' || error.code === 'auth/credential-already-in-use') {
        description = 'An account with this email or phone number already exists.';
      } else if (error.code === 'auth/invalid-verification-code') {
        description = 'The verification code is invalid. Please try again.';
      }
      toast({ variant: 'destructive', title: 'Sign Up Failed', description });
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>
            {step === 'details'
              ? 'Join Sargam AI to start your musical journey.'
              : 'Enter the code sent to your phone.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'details' ? (
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <FormField control={detailsForm.control} name="displayName" render={({ field }) => (
                  <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={detailsForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={detailsForm.control} name="phoneNumber" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={detailsForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={detailsForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Verification Code
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
                <FormField control={otpForm.control} name="otp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit OTP</FormLabel>
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
                    <Button type="button" variant="ghost" onClick={() => setStep('details')} disabled={isLoading}>Back</Button>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify & Create Account
                    </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center text-sm">
          <div id="recaptcha-container-signup"></div>
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
