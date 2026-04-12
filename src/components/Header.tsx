"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Music, LogOut, User as UserIcon, BookOpen, Wand2, LogIn, ChevronDown, Zap, ShieldCheck, GraduationCap, LifeBuoy, MonitorPlay, PlayCircle, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/types";

const navLinks = [
  { href: "/practice", label: "Practice", icon: Music },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/suite", label: "Music Suite", icon: Wand2 },
  { href: "/studio", label: "AI Studio", icon: MonitorPlay },
  { href: "/tutorials", label: "Tutorials", icon: PlayCircle },
  { href: "/blog", label: "Learn", icon: GraduationCap },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Strict User Check: Exclude anonymous guest accounts from authenticated view
  const isAuthenticated = !!(user && !user.isAnonymous);

  const userDocRef = useMemoFirebase(() => (firestore && isAuthenticated ? doc(firestore, 'users', user.uid) : null), [firestore, isAuthenticated, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setIsMenuOpen(false);
    router.push("/");
  };
  
  return (
    <div className="w-full flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-md">
        {/* Simple CTA banner for non-logged in users */}
        {!isAuthenticated && !isUserLoading && (
          <div className="bg-primary py-1.5 px-4 text-center border-b border-primary/20 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
             <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground flex items-center justify-center gap-2">
               <Sparkles className="h-3 w-3 fill-current" />
               Sign in to unlock the full power of Sargam AI.
               <Sparkles className="h-3 w-3 fill-current" />
             </p>
          </div>
        )}

        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            {pathname !== "/" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()} 
                className="h-9 px-2 gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-all rounded-full group mr-1"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> 
                <span className="hidden xs:inline">Back</span>
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <span className="font-headline text-xl font-bold text-foreground tracking-tighter">
                  <span className="text-primary">Sargam</span> AI
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 transition-all hover:text-primary relative group",
                     pathname === href || pathname.startsWith(href + '/') ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {(pathname === href || pathname.startsWith(href + '/')) && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
          </nav>

          <div className="flex items-center gap-4">
            {isUserLoading ? (
              <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/pricing" 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm transition-all hover:bg-primary/20 hover:scale-105 active:scale-95"
                  title="Top-up Credits"
                >
                  <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span className="text-xs font-bold text-primary">
                    {isProfileLoading ? "..." : (profile?.credits ?? 0)}
                  </span>
                </Link>

                <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                      <AvatarImage src={user?.photoURL || profile?.avatarUrl || ''} className="object-cover" />
                      <AvatarFallback className="bg-muted text-muted-foreground"><UserIcon className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform hidden sm:block", isMenuOpen && "rotate-180")} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 rounded-xl border bg-card/95 backdrop-blur-md p-1.5 shadow-2xl z-50">
                      <div className="px-3 py-2 text-sm font-semibold border-b mb-1 flex flex-col">
                        <span className="truncate flex items-center gap-2">
                          {profile?.displayName || "Artist"}
                          {profile?.plan && profile.plan !== 'free' && <ShieldCheck className="h-3 w-3 text-primary" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{profile?.plan || 'Free'} Plan</span>
                      </div>
                      <Link href="/profile" className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <UserIcon className="mr-3 h-4 w-4 text-primary" /> Profile
                      </Link>
                      <Link href="/pricing" className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <Zap className="mr-3 h-4 w-4 text-primary" /> Upgrade Plan
                      </Link>
                      <Link href="/profile/support" className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}>
                        <LifeBuoy className="mr-3 h-4 w-4 text-primary" /> Support
                      </Link>
                      <button onClick={handleLogout} className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg mt-1">
                        <LogOut className="mr-3 h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Button asChild variant="default" size="sm" className="font-bold rounded-full px-6 shadow-lg shadow-primary/20">
                <Link href="/login"><LogIn className="mr-2 h-5 w-5" /> Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}