import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/context/auth-context";
import { useRouter } from "next/router";
import { Icons } from '@/components/Icons';

interface NavigationItem {
  label: string;
  href: string;
  icon: keyof typeof Icons;
  badge?: string;
  description?: string;
}

export default function EnhancedNavbar() {
  const router = useRouter();
  const { logout, authState } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render during SSR
  if (!mounted) {
    return null;
  }

  // Don't show navbar if user is not authenticated
  if (!authState.user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isCurrentRoute = (path: string) => {
    return router.pathname === path;
  };

  const navigationItems: NavigationItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: 'Rocket',
      description: 'Create new quizzes'
    },
    {
      label: 'History',
      href: '/history',
      icon: 'RefreshCw',
      description: 'View past quizzes'
    },
    {
      label: 'Settings',
      href: '/setting',
      icon: 'Settings',
      description: 'Account preferences'
    }
  ];

  const getUserInitials = () => {
    const name = authState.user?.name || '';
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const containerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.header
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm"
    >
      <nav className="container-custom h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div variants={itemVariants}>
          <Link href="/" className="group flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-blue-500/25 transition-all duration-200">
              GT
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">
              genText AI
            </span>
          </Link>
        </motion.div>

        {/* Navigation Items */}
        <motion.div variants={itemVariants} className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = Icons[item.icon];
            const isActive = isCurrentRoute(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </motion.div>

        {/* User Menu */}
        <motion.div variants={itemVariants}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-blue-500/50 transition-all duration-200"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={authState.user?.prefs?.avatar} 
                    alt={authState.user?.name || 'User'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={authState.user?.prefs?.avatar} 
                      alt={authState.user?.name || 'User'} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {authState.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {authState.user?.email}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      <span className="text-xs text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              {/* Mobile navigation items */}
              <div className="md:hidden space-y-1 mb-2">
                {navigationItems.map((item) => {
                  const Icon = Icons[item.icon];
                  const isActive = isCurrentRoute(item.href);
                  
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link 
                        href={item.href}
                        className={`flex items-center space-x-3 p-2 rounded ${
                          isActive ? 'bg-blue-100 text-blue-700' : ''
                        }`}
                      >
                        <Icon />
                        <div className="flex-1">
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500">{item.description}</div>
                          )}
                        </div>
                        {item.badge && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>
              
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
              >
                {isLoggingOut ? (
                  <Icons.Loader />
                ) : (
                  <Icons.Trash />
                )}
                <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </nav>
    </motion.header>
  );
}