
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Music, LogOut, User as UserIcon, BookOpen, Wand2, LogIn, ChevronDown, Zap, ShieldCheck, GraduationCap, LifeBuoy, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/types";

const navLinks = [
  { href: "/practice", label: "Practice", icon: Music },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/suite", label: "Music Suite", icon: Wand2 },
  { href: "/studio", label: "AI Studio", icon: MonitorPlay },
  { href: "/blog", label: "Learn", icon: GraduationCap },
];

const GUEST_AVATAR_URL = "https://firebasestorage.googleapis.com/v0/b/studio-4164192500-df01a.firebasestorage.app/o/1000018646%5B1%5D.png?alt=media&token=2b2f8cea-03cd-477c-bc0d-88988246fdeb";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userDocRef = useMemoFirebase(() => (firestore && user?.uid ? doc(firestore, 'users', user.uid) : null), [firestore, user?.uid]);
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
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
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
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
                  <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span className="text-xs font-bold text-primary">
                    {isProfileLoading ? "..." : (profile?.credits ?? 0)}
                  </span>
                </div>

                <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2">
                    <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                      <AvatarImage src={user.photoURL || profile?.avatarUrl || GUEST_AVATAR_URL} className="object-cover" />
                      <AvatarFallback><UserIcon className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform hidden sm:block", isMenuOpen && "rotate-180")} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 rounded-xl border bg-card/95 backdrop-blur-md p-1.5 shadow-2xl z-50">
                      <div className="px-3 py-2 text-sm font-semibold border-b mb-1 flex flex-col">
                        <span className="truncate flex items-center gap-2">
                          {profile?.displayName || "User"}
                          {profile?.plan && profile.plan !== 'free' && <ShieldCheck className="h-3 w-3 text-primary" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{profile?.plan || 'Free'} Plan</span>
                      </div>
                      <Link href="/profile" className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg">
                        <UserIcon className="mr-3 h-4 w-4 text-primary" /> Profile
                      </Link>
                      <Link href="/pricing" className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg">
                        <Zap className="mr-3 h-4 w-4 text-primary" /> Upgrade Plan
                      </Link>
                      <Link href="/profile/support" className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-lg">
                        <LifeBuoy className="mr-3 h-4 w-4 text-primary" /> Support
                      </Link>
                      <button onClick={handleLogout} className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg mt-1">
                        <LogOut className="mr-3 h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!user && (
              <Button asChild variant="default" size="sm" className="font-bold rounded-full px-6 shadow-lg shadow-primary/20">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
