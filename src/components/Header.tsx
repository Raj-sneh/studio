
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Music, LogOut, User as UserIcon, Loader2, BookOpen, Wand2, LogIn, ChevronDown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/types";

const navLinks = [
  { href: "/practice", label: "Practice", icon: Music },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/suite", label: "AI Studio", icon: Wand2 },
];

const GUEST_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/studio-4164192500-df01a.firebasestorage.app/o/1000018646%5B1%5D.png?alt=media&token=2b2f8cea-03cd-477c-bc0d-88988246fdeb";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user profile for credits
  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setIsMenuOpen(false);
    router.push("/");
  };
  
  const renderAuthControls = () => {
    if (isUserLoading) {
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }

    // Only show the profile menu if the user is NOT anonymous (i.e., they have properly logged in)
    if (user && !user.isAnonymous) {
      return (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 transition-all hover:bg-primary/20 cursor-help" title="Neural Research Credits">
            <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
            <span className="text-xs font-bold text-primary">
              {isProfileLoading ? "..." : (profile?.credits ?? 0)}
            </span>
          </div>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <Avatar className="h-9 w-9 border-2 border-primary/20 ring-2 ring-background shadow-lg transition-transform hover:scale-105">
                <AvatarImage 
                  src={user.photoURL || profile?.avatarUrl || GUEST_AVATAR_URL} 
                  alt={user.displayName || "User"} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground flex items-center justify-center">
                  <UserIcon className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isMenuOpen && "rotate-180")} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-xl border bg-card/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-sm font-semibold border-b mb-1 flex flex-col">
                  <span className="truncate">{profile?.displayName || user.displayName || "Logged In User"}</span>
                  <span className="text-[10px] text-muted-foreground font-normal truncate">{user.email || "No email linked"}</span>
                </div>
                
                <div className="sm:hidden flex items-center px-3 py-2 text-xs font-bold text-primary border-b mb-1">
                   <Zap className="mr-2 h-3.5 w-3.5 fill-primary" />
                   {profile?.credits ?? 0} Credits Available
                </div>

                <button 
                  onClick={() => { router.push('/profile'); setIsMenuOpen(false); }}
                  className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                >
                  <UserIcon className="mr-3 h-4 w-4 text-primary" /> Profile Settings
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors mt-1"
                >
                  <LogOut className="mr-3 h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // If Guest (Anonymous) or null, show Login button
    return (
      <Button asChild variant="default" size="sm" className="font-bold rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Link>
      </Button>
    );
  };

  return (
    <div className="w-full flex flex-col">
      <div className="w-full bg-primary/10 border-b border-primary/20 py-2.5 px-4 overflow-hidden">
        <div className="container mx-auto flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-1000">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <p className="text-[11px] sm:text-xs font-bold text-primary tracking-wide text-center uppercase">
            Sargam AI Trial Protocol: Our architects are currently refining the mobile core. 
            Stay tuned as we prepare to launch the definitive neural music experience.
          </p>
        </div>
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border/10 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-headline text-xl font-bold text-foreground tracking-tighter relative">
                  <span className="text-primary">Sargam</span> AI
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 transition-all hover:text-primary relative group",
                     pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {pathname.startsWith(href) && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
          </nav>

          <div className="flex items-center gap-4">
            {renderAuthControls()}
          </div>
        </div>
      </header>
    </div>
  );
}
