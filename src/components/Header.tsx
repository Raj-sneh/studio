
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Music, LogOut, User as UserIcon, Loader2, BookOpen, Wand2, LogIn, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

    if (user) {
      return (
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <Avatar className="h-9 w-9 border-2 border-primary/20 ring-2 ring-background shadow-lg transition-transform hover:scale-105">
              <AvatarImage 
                src={user.photoURL || GUEST_AVATAR_URL} 
                alt={user.displayName || "User"} 
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground flex items-center justify-center">
                <UserIcon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            {!user.isAnonymous && <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isMenuOpen && "rotate-180")} />}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-xl border bg-card/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 text-sm font-semibold border-b mb-1 flex flex-col">
                <span className="truncate">{user.displayName || "Guest User"}</span>
                <span className="text-[10px] text-muted-foreground font-normal truncate">{user.email || "No email linked"}</span>
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
      );
    }
    
    return (
      <Button asChild variant="ghost" size="sm" className="text-primary font-bold">
        <Link href="/login">
          <LogIn className="mr-2 h-4 w-4" /> Login
        </Link>
      </Button>
    );
  };

  return (
    <div className="w-full flex flex-col">
      {/* Respectful AI-Language Trial Banner */}
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
