'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  ConfirmationResult,
} from 'firebase/auth';

import { auth } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const emailFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const phoneFormSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter valid phone number')
    .refine((val) => /^\+?[1-9]\d{9,14}$/.test(val.replace(/\s/g, '')), {
      message: 'Use full number with country code, like +919876543210',
    }),
});

const otpFormSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const phoneForm = useForm<z.infer<typeof phoneFormSchema>>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone: '+91',
    },
  });

  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: '',
    },
  });

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {},
        'expired-callback': () => {},
      });
    }
    return window.recaptchaVerifier;
  };

  const handleEmailLogin = async (values: z.infer<typeof emailFormSchema>) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/suite');
    } catch (error: any) {
      alert(error?.message || 'Email login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (values: z.infer<typeof phoneFormSchema>) => {
    try {
      setIsLoading(true);

      const phone = values.phone.replace(/\s/g, '');
      const appVerifier = setupRecaptcha();

      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);

      window.confirmationResult = confirmationResult;
      setStep('otp');
    } catch (error: any) {
      console.error('OTP send error:', error);
      alert(error?.message || 'Could not send OTP');

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (values: z.infer<typeof otpFormSchema>) => {
    try {
      setIsLoading(true);

      if (!window.confirmationResult) {
        alert('OTP session expired. Send OTP again.');
        setStep('phone');
        return;
      }

      await window.confirmationResult.confirm(values.otp);
      router.push('/suite');
    } catch (error: any) {
      console.error('OTP verify error:', error);
      alert(error?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/suite');
    } catch (error: any) {
      alert(error?.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070019] text-white flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-[#0d0225] border border-[#23124a] text-white">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center">Welcome Back</CardTitle>
          <p className="text-center text-gray-300">Sign in to your Sargam AI account.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={tab} onValueChange={(value) => setTab(value as 'email' | 'phone')}>
            <TabsList className="grid w-full grid-cols-2 bg-[#1a0d3a]">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger
                value="phone"
                onClick={() => {
                  setStep('phone');
                  otpForm.reset({ otp: '' });
                }}
              >
                Phone
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tab === 'email' && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          )}

          {tab === 'phone' && step === 'phone' && (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phone"
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

                <div id="recaptcha-container" className="flex justify-center overflow-hidden" />

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Sending OTP...' : 'Send Verification Code'}
                </Button>
              </form>
            </Form>
          )}

          {tab === 'phone' && step === 'otp' && (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
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
                      setStep('phone');
                      otpForm.reset({ otp: '' });
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Verifying...' : 'Verify OTP & Sign In'}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#2c1a57]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0d0225] px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent border-[#2c1a57] text-white"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            Sign in with Google
          </Button>
        </CardContent>

        <CardFooter className="justify-center text-sm text-gray-300">
          Don&apos;t have an account?
          <Link href="/signup" className="ml-2 text-cyan-400 hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
