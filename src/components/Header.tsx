"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Music, LogOut, User as UserIcon, Loader2, BookOpen, Wand2, LogIn, ChevronDown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

const navLinks = [
  { href: "/practice", label: "Practice", icon: Music },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/suite", label: "AI Studio", icon: Wand2 },
];

/**
 * A custom geometric human structure for guest avatars.
 */
function GeometricGuestIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full p-2" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="50" cy="35" r="18" fill="currentColor" />
      {/* Body (Semicircle) */}
      <path d="M20 85 C 20 55, 80 55, 80 85" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number>(5);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCredits = () => {
      const stored = localStorage.getItem("sargam_credits");
      if (stored) {
        setCredits(parseInt(stored));
      }
    };

    fetchCredits();

    const handleUpdate = () => fetchCredits();
    window.addEventListener('creditsUpdated', handleUpdate);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener('creditsUpdated', handleUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setIsMenuOpen(false);
    router.push("/");
  };

  const handleOpenCreditBar = () => {
    window.dispatchEvent(new Event('showCreditBar'));
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
                src={user.photoURL || undefined} 
                alt={user.displayName || "User"} 
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground flex items-center justify-center">
                <GeometricGuestIcon />
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
          <button 
            onClick={handleOpenCreditBar}
            className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 group"
            title="Manage Credits & Buy Premium"
          >
            <Coins className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-bold text-primary">{credits}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter hidden sm:inline">Credits</span>
          </button>
          {renderAuthControls()}
        </div>
      </div>
    </header>
  );
}