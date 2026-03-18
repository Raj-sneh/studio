"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Music, LogOut, User as UserIcon, Loader2, BookOpen, Wand2, LogIn, ChevronDown } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

const navLinks = [
  { href: "/practice", label: "Practice", icon: Music },
  { href: "/lessons", label: "Lessons", icon: BookOpen },
  { href: "/suite", label: "AI Studio", icon: Wand2 },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

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
  
  const renderAuthControls = () => {
    if (isUserLoading) {
      return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }

    if (user && !user.isAnonymous) {
      return (
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-8 w-8 border border-primary/20">
              <AvatarImage src={user?.photoURL || userAvatar?.imageUrl} alt={user?.displayName || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isMenuOpen && "rotate-180")} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-lg z-50">
              <div className="px-2 py-1.5 text-sm font-semibold border-b mb-1">
                {user.displayName || "My Account"}
              </div>
              <button 
                onClick={() => { router.push('/profile'); setIsMenuOpen(false); }}
                className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
              >
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </button>
              <button 
                onClick={handleLogout}
                className="flex w-full items-center px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm"
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <Button asChild variant="ghost" size="sm" className="text-primary">
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

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary",
                   pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-4">
          {renderAuthControls()}
        </div>
      </div>
    </header>
  );
}
