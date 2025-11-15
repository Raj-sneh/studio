
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AtSign, KeyRound, Dices, Music, UserPlus, Phone, MessageSquare } from "lucide-react";
import { useAuth, useUser, setDocumentNonBlocking } from "@/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword, ConfirmationResult, UserCredential, updateProfile, linkWithPhoneNumber, PhoneAuthCredential, PhoneAuthProvider, signInAnonymously } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SButtonIcon from "@/components/icons/SButtonIcon";

type AuthMode = 'login' | 'signup' | 'otp';
type OtpContext = 'signup' | 'login';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [otpContext, setOtpContext] = useState<OtpContext>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [createdUser, setCreatedUser] = useState<UserCredential | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const setupRecaptcha = useCallback(() => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved.
        }
      });
    }
  }, [auth]);

  useEffect(() => {
    setupRecaptcha();
  }, [setupRecaptcha]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!auth || !firestore) {
      setError("Firebase not initialized.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setCreatedUser(userCredential);

      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpContext('signup');
      setAuthMode('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!auth || !firestore) {
        setError("Firebase not initialized.");
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
          const userData = userDoc.data();
          const phone = userData.phoneNumber;
          if (phone) {
              const appVerifier = (window as any).recaptchaVerifier;
              const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
              setConfirmationResult(confirmation);
              setOtpContext('login');
              setAuthMode('otp');
          } else {
              setError("No phone number found for this account. Please sign up again.");
          }
      } else {
           setError("User data not found. Please sign up.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
        setError("Something went wrong. Please try again.");
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
      if (otpContext === 'login') {
        await confirmationResult.confirm(otp);
        // User is signed in. useEffect will redirect.
      } else if (otpContext === 'signup' && createdUser?.user) {
        const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
        await linkWithPhoneNumber(createdUser.user, credential);
        
        if (firestore) {
            const userDocRef = doc(firestore, "users", createdUser.user.uid);
            await setDocumentNonBlocking(userDocRef, {
              id: createdUser.user.uid,
              displayName: createdUser.user.email?.split('@')[0] || 'Anonymous',
              email: createdUser.user.email,
              phoneNumber: phoneNumber,
              createdAt: new Date().toISOString(),
            }, {});
        }
        await auth.signOut(); // Force sign out to make them log in.
        setAuthMode('login');
        setCreatedUser(null);
        alert("Sign up successful! Please log in to continue.");
      }
    } catch (err: any) {
        setError(`Invalid OTP or verification failed. Please try again. Error: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGuestLogin = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
        await signInAnonymously(auth);
    } catch (error) {
        setError("Guest login failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(current => current === 'login' ? 'signup' : 'login');
    setError(null);
    setEmail('');
    setPassword('');
    setPhoneNumber('');
  }

  if (isUserLoading || user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <SButtonIcon className="animate-spin h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative overflow-hidden">
      <div id="recaptcha-container"></div>
      <div className="absolute inset-0 -z-10">
        <Music className="music-note absolute text-primary/10" style={{ left: '10%', animationDuration: '10s' }} />
        <Music className="music-note absolute text-primary/10" style={{ left: '20%', animationDuration: '12s', animationDelay: '5s' }} />
        <Music className="music-note absolute text-primary/10" style={{ left: '70%', animationDuration: '11s', animationDelay: '7s' }} />
        <Music className="music-note absolute text-primary/10" style={{ left: '90%', animationDuration: '13s', animationDelay: '1s' }} />
      </div>
      
      <main className="w-full max-w-sm z-10">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center">
            <h1 className="font-headline text-5xl font-bold text-primary tracking-tighter">
              Socio
            </h1>
            <CardDescription className="font-body text-muted-foreground pt-2">
              {authMode === 'login' && 'Login to continue'}
              {authMode === 'signup' && 'Create an account'}
              {authMode === 'otp' && `Enter OTP sent to ${phoneNumber || 'your phone'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authMode === 'otp' ? (
                 <form onSubmit={handleOtpVerification} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="otp">One-Time Password</Label>
                        <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="otp" type="text" placeholder="Enter your OTP" className="pl-10 rounded-tl-2xl rounded-br-2xl" required value={otp} onChange={e => setOtp(e.target.value)} />
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full h-12 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-tl-2xl rounded-br-2xl" disabled={isLoading}>
                        {isLoading ? <SButtonIcon className="animate-spin" /> : 'Verify OTP'}
                    </Button>
                    <p className="text-center text-xs">
                        <button type="button" onClick={() => setAuthMode(otpContext)} className="text-primary hover:underline font-semibold">Back</button>
                    </p>
                 </form>
            ) : (
            <>
              <form onSubmit={authMode === 'login' ? handleSignIn : handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-10 rounded-tl-2xl rounded-br-2xl" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10 rounded-tl-2xl rounded-br-2xl" required value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>
                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="phone" type="tel" placeholder="+1234567890" className="pl-10 rounded-tl-2xl rounded-br-2xl" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                    </div>
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full h-12 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-tl-2xl rounded-br-2xl" disabled={isLoading}>
                  {isLoading ? <SButtonIcon className="animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
                </Button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-12">
                  <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
                  Google
                </Button>
                <Button variant="outline" className="h-12" onClick={handleGuestLogin} disabled={isLoading}>
                  <Dices className="mr-2 h-4 w-4" />
                  Guest Login
                </Button>
              </div>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={toggleAuthMode} className="text-primary hover:underline font-semibold">
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/50 font-body">
          Made in India • Sneh Kumar Verma
        </p>
      </footer>
    </div>
  );
}
