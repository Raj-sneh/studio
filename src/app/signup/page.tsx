'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  ConfirmationResult,
} from 'firebase/auth';

import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const detailsSchema = z
  .object({
    displayName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    phoneNumber: z
      .string()
      .min(10, 'Enter valid phone number')
      .refine((val) => /^\+?[1-9]\d{9,14}$/.test(val.replace(/\s/g, '')), {
        message: 'Use full number with country code, like +919876543210',
      }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();

  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [signupData, setSignupData] = useState<z.infer<typeof detailsSchema> | null>(null);

  const detailsForm = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phoneNumber: '+91',
      password: '',
      confirmPassword: '',
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const setupRecaptcha = () => {
    if (!auth) return;
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {},
        'expired-callback': () => {},
      });
    }
    return window.recaptchaVerifier;
  };

  const handleSendOtp = async (values: z.infer<typeof detailsSchema>) => {
    if (!auth) return;
    try {
      setIsLoading(true);

      const phone = values.phoneNumber.replace(/\s/g, '');
      const appVerifier = setupRecaptcha();
      if (!appVerifier) throw new Error("Recaptcha failed to initialize.");
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);

      window.confirmationResult = confirmationResult;
      setSignupData(values);
      setStep('otp');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      alert(error?.message || 'Could not send OTP');

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (values: z.infer<typeof otpSchema>) => {
    if (!auth) return;
    try {
      setIsLoading(true);

      if (!window.confirmationResult || !signupData) {
        alert('OTP session expired. Please send OTP again.');
        setStep('details');
        return;
      }

      await window.confirmationResult.confirm(values.otp);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password
      );

      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: signupData.displayName,
        });
      }

      router.push('/suite');
    } catch (error: any) {
      console.error('Create account error:', error);

      let message = 'Something went wrong. Please try again.';

      if (error?.code === 'auth/invalid-verification-code') {
        message = 'The OTP is invalid. Please enter the correct 6-digit code.';
      } else if (error?.code === 'auth/email-already-in-use') {
        message = 'This email is already in use.';
      } else if (error?.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      } else if (error?.message) {
        message = error.message;
      }

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070019] text-white flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-[#0d0225] border border-[#23124a] text-white">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center">Create Account</CardTitle>
          <p className="text-center text-gray-300">Join Sargam AI to start your musical journey.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'details' && (
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <FormField
                  control={detailsForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={detailsForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={detailsForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+919876543210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={detailsForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Create password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={detailsForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div id="recaptcha-container" className="flex justify-center overflow-hidden" />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Sending OTP...' : 'Send Verification Code'}
                </Button>
              </form>
            </Form>
          )}

          {step === 'otp' && (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleCreateAccount)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center tracking-[0.5em] text-2xl font-mono"
                          value={field.value}
                          onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 6);
                            field.onChange(onlyNumbers);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setStep('details');
                      otpForm.reset({ otp: '' });
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Creating Account...' : 'Verify & Create Account'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="justify-center text-sm text-gray-300">
          Already have an account?
          <Link href="/login" className="ml-2 text-cyan-400 hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
