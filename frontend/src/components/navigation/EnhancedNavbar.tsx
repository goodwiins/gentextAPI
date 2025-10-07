/**
 * Enhanced Navigation Component with Aceternity UI Effects
 * Combines existing Navbar functionality with FloatingNav effects
 * Features scroll-based animations, backdrop blur, and particle effects
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Home, 
  Settings, 
  History, 
  Menu, 
  LogOut, 
  User,
  Sparkles,
  Loader,
  Trash
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  description?: string;
}

interface FloatingNavProps {
  navItems: NavigationItem[];
  className?: string;
}

// Default avatar SVG
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0xMiAwYzYuNjI3IDAgMTIgNS4zNzMgMTIgMTJzLTUuMzczIDEyLTEyIDEyUzAgMTguNjI3IDAgMTIgNS4zNzMgMCAxMiAwek0wIDEyYzAgNi42MjcgNS4zNzMgMTIgMTIgMTJzMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJTMCA1LjM3MyAwIDEyem0xMi0xLjVjMS4zOCAwIDIuNSAxLjEyIDIuNSAyLjVzLTEuMTIgMi41LTIuNSAyLjUtMi41LTEuMTItMi41LTIuNSAxLjEyLTIuNSAyLjUtMi41eiIvPjwvc3ZnPg==';

const FloatingNav: React.FC<FloatingNavProps> = ({ navItems, className }) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY;
    const direction = latest > previous ? 'down' : 'up';
    const scrollThreshold = 150; // Only show after scrolling 150px
    
    // Show floating nav when scrolling up and past threshold
    // Hide when at top or scrolling down quickly
    if (latest < scrollThreshold) {
      setVisible(false);
    } else if (direction === 'up' && latest > scrollThreshold) {
      setVisible(true);
    } else if (direction === 'down' && latest - previous > 10) {
      // Hide when scrolling down quickly (more than 10px at once)
      setVisible(false);
    }
    
    setLastScrollY(latest);
  });

  const router = useRouter();

  const isCurrentRoute = (path: string) => {
    return router.pathname === path;
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          initial={{
            opacity: 0,
            y: -100,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            opacity: 0,
            y: -100,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
          className={cn(
            "fixed top-4 left-1/2 transform -translate-x-1/2",
            "z-[100] max-w-fit",
            "border border-border/20 rounded-2xl",
            "bg-background/90 backdrop-blur-xl",
            "shadow-lg shadow-black/5",
            "px-6 py-3",
            className
          )}
        >
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="p-1.5 rounded-lg bg-primary/10 text-primary"
              >
                <Sparkles className="h-4 w-4" />
              </motion.div>
              <span className="text-sm font-semibold text-foreground group-hover:text-muted-foreground transition-colors">
                genText
              </span>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((navItem, idx) => (
                <Link
                  key={`floating-${idx}`}
                  href={navItem.href}
                  className={cn(
                    "relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    isCurrentRoute(navItem.href) 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    "group"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "transition-colors",
                      isCurrentRoute(navItem.href)
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-primary"
                    )}>
                      {navItem.icon}
                    </span>
                    <span>{navItem.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* User Controls */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <UserProfileDropdown />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const UserProfileDropdown: React.FC = () => {
  const { logout, authState } = useAuthContext();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = () => {
    const name = authState.user?.name || '';
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            aria-label={`User menu for ${authState.user?.name || 'user'}`}
            aria-haspopup="true"
          >
            <Image
              alt={`${authState.user?.name || 'User'} profile picture`}
              className="h-full w-full object-cover"
              src={authState.user?.prefs?.avatar || DEFAULT_AVATAR}
              width={32}
              height={32}
            />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full overflow-hidden">
            <Image
              alt={`${authState.user?.name || 'User'} profile picture`}
              className="h-full w-full object-cover"
              src={authState.user?.prefs?.avatar || DEFAULT_AVATAR}
              width={32}
              height={32}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{authState.user?.name || 'User'}</span>
            <span className="text-xs text-muted-foreground">{authState.user?.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/setting" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-destructive focus:text-destructive"
        >
          {isLoggingOut ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface MobileMenuProps {
  navItems: NavigationItem[];
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navItems }) => {
  const router = useRouter();
  const { authState } = useAuthContext();

  const isCurrentRoute = (path: string) => {
    return router.pathname === path;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-2 mb-8 p-4 border-b border-border">
        <Sparkles className="h-6 w-6 text-primary" />
        <span className="text-xl font-semibold text-foreground">
          genText AI
        </span>
      </div>
      
      <div className="flex flex-col space-y-2 p-4 flex-1">
        {navItems.map((item, idx) => (
          <Link
            key={`mobile-${idx}`}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200",
              isCurrentRoute(item.href)
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Mobile auth section */}
      {!authState.user && (
        <div className="p-4 border-t border-border space-y-3">
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Login
            </Button>
          </Link>
          <Link href="/signup" className="block">
            <Button className="w-full">
              Sign Up
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

// Fixed Static Navbar Component
const StaticNavbar: React.FC = () => {
  const { authState } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </nav>
    );
  }

  const navigationItems: NavigationItem[] = authState.user ? [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-4 w-4" />,
      description: 'Home page'
    },
    {
      label: 'Generate',
      href: '/generate',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Create new quizzes'
    },
    {
      label: 'History',
      href: '/history',
      icon: <History className="h-4 w-4" />,
      description: 'View past quizzes'
    },
    {
      label: 'Settings',
      href: '/setting',
      icon: <Settings className="h-4 w-4" />,
      description: 'Account preferences'
    }
  ] : [
    {
      label: 'Demo',
      href: '/aceternity-demo',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'View demo'
    }
  ];

  const isCurrentRoute = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
          aria-label="genText AI - Go to homepage"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className="p-1.5 rounded-lg bg-primary/10 text-primary"
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <span className="text-lg font-semibold text-foreground group-hover:text-muted-foreground transition-colors">
            genText AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1" role="menubar">
          {navigationItems.map((item, idx) => (
            <Link
              key={`nav-${idx}`}
              href={item.href}
              className={cn(
                "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isCurrentRoute(item.href) 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              role="menuitem"
              aria-current={isCurrentRoute(item.href) ? "page" : undefined}
              aria-label={item.description || item.label}
            >
              <div className="flex items-center space-x-2">
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {authState.user ? (
            <UserProfileDropdown />
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                className="md:hidden" 
                size="icon" 
                variant="ghost"
                aria-label="Open mobile navigation menu"
                aria-haspopup="true"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="w-72"
              aria-label="Mobile navigation menu"
            >
              <MobileMenu navItems={navigationItems} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default function EnhancedNavbar() {
  const { authState } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track when floating navbar should be visible
  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrollThreshold = 150;
    setShowFloating(Boolean(authState.user && latest > scrollThreshold));
  });

  const navigationItems: NavigationItem[] = authState.user ? [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-4 w-4" />,
      description: 'Home page'
    },
    {
      label: 'Generate',
      href: '/generate',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'Create new quizzes'
    },
    {
      label: 'History',
      href: '/history',
      icon: <History className="h-4 w-4" />,
      description: 'View past quizzes'
    },
    {
      label: 'Settings',
      href: '/setting',
      icon: <Settings className="h-4 w-4" />,
      description: 'Account preferences'
    }
  ] : [
    {
      label: 'Demo',
      href: '/aceternity-demo',
      icon: <Sparkles className="h-4 w-4" />,
      description: 'View demo'
    }
  ];

  return (
    <>
      {/* Static navbar - hidden when floating navbar is active */}
      <motion.div
        animate={{ 
          opacity: showFloating ? 0 : 1,
          y: showFloating ? -64 : 0 
        }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <StaticNavbar />
      </motion.div>
      
      {/* Floating navbar for authenticated users on scroll */}
      {mounted && authState.user && (
        <FloatingNav navItems={navigationItems} />
      )}
      
      {/* Spacer to prevent content overlap */}
      <div className="h-16" />
    </>
  );
}