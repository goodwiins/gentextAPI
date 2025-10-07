import { Button } from "@/components/ui/button"
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet"
import Link from "next/link"
import { LogOut, Menu, Home, Settings, History } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { NavigationMenuLink, NavigationMenuList, NavigationMenu } from "@/components/ui/navigation-menu"
import { useRouter } from "next/router"
import React, { useEffect, useState } from 'react';
import { useAuthContext } from "@/context/auth-context";
import Image from "next/image";

// Add a constant for the default avatar
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0xMiAwYzYuNjI3IDAgMTIgNS4zNzMgMTIgMTJzLTUuMzczIDEyLTEyIDEyUzAgMTguNjI3IDAgMTIgNS4zNzMgMCAxMiAwek0wIDEyYzAgNi42MjcgNS4zNzMgMTIgMTIgMTJzMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJTMCA1LjM3MyAwIDEyem0xMi0xLjVjMS4zOCAwIDIuNSAxLjEyIDIuNSAyLjVzLTEuMTIgMi41LTIuNSAyLjUtMi41LTEuMTItMi41LTIuNSAxLjEyLTIuNSAyLjUtMi41eiIvPjwvc3ZnPg==';

export default function Navbar() {
  const router = useRouter();
  const { logout, authState } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Render nothing on the initial server render
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isCurrentRoute = (path: string) => {
    return router.pathname === path;
  };

  return (
    authState.user ? (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="lg:hidden" size="icon" variant="ghost">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex items-center space-x-2 mb-8">
                  <span className="text-xl font-semibold text-foreground">genText AI</span>
                </div>
                <div className="flex flex-col space-y-3">
                  <Link 
                    className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors
                      ${isCurrentRoute('/') 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`} 
                    href="/"
                  >
                    <Home className="h-4 w-4 mr-3" />
                    Home
                  </Link>
                  <Link 
                    className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors
                      ${isCurrentRoute('/setting') 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                    href="/setting"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <Link 
                    className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors
                      ${isCurrentRoute('/history') 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                    href="/history"
                  >
                    <History className="h-4 w-4 mr-3" />
                    History
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center">
              <span className="text-xl font-semibold text-foreground hover:text-muted-foreground transition-colors">
                genText AI
              </span>
            </Link>

            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="flex items-center space-x-1">
                <NavigationMenuLink asChild>
                  <Link
                    className={`inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${isCurrentRoute('/') 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                    href="/"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Link>
                </NavigationMenuLink>

                <NavigationMenuLink asChild>
                  <Link
                    className={`inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${isCurrentRoute('/history') 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                    href="/history"
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Image
                    alt="User Avatar"
                    className="h-full w-full rounded-full object-cover"
                    src={authState.user?.prefs?.avatar || DEFAULT_AVATAR}
                    width={32}
                    height={32}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden">
                    <Image
                      alt="User Avatar"
                      className="h-full w-full object-cover"
                      src={authState.user?.prefs?.avatar || DEFAULT_AVATAR}
                      width={32}
                      height={32}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{authState.user?.name || 'User'}</span>
                    <span className="text-xs text-muted-foreground">{authState.user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/setting"
                    className={`flex items-center ${isCurrentRoute('/setting') ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>
    ) : null
  );
} 