import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Mail, Lock, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { appwriteAuth } from "@/lib/appwrite";
import { useAuthContext } from "@/context/auth-context";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Meteors } from "@/components/ui/meteors";
import { Sparkles } from "@/components/ui/sparkles-text";
import { EnhancedAuthWrapper } from "@/components/aceternity";

export default function Login() {
  const router = useRouter();
  const { login, authState, clearAuthError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Clear auth errors when component unmounts or when inputs change
  useEffect(() => {
    clearAuthError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  // Check for redirects if user is already logged in
  useEffect(() => {
    // Only redirect if we've finished loading and user exists
    if (!authState.isLoading && authState.user) {
      router.push('/');
    }
  }, [authState.isLoading, authState.user, router]);

  const validateForm = () => {
    if (!email.trim()) {
      setLocalError('Please enter your email');
      return false;
    }
    if (!password.trim()) {
      setLocalError('Please enter your password');
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    setLocalError(null);
    return true;
  };

  const handleCleanupSessions = async () => {
    try {
      setIsCleaningUp(true);
      setLocalError(null);
      
      toast.loading('Cleaning up sessions...');
      
      const result = await appwriteAuth.cleanupSessions();
      
      toast.dismiss();
      if (result) {
        toast.success('Sessions cleaned up successfully!');
        setLocalError(null);
      } else {
        toast.success('No active sessions found to clean up');
      }
    } catch (error: any) {
      console.error("Error during session cleanup:", error);
      let errorMessage = error.message || 'Failed to clean up sessions';
      
      toast.dismiss();
      toast.error(errorMessage);
      setLocalError(errorMessage);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    // Clear any previous errors
    setLocalError(null);
    
    try {
      // Login is handled by the auth context, which will set loading state internally
      await login(email, password);
      
      toast.success('Successfully logged in!');
      router.push('/');
    } catch (error: any) {
      console.error("Error during login:", error);
      
      // Handle profile incomplete error
      if (error.message === 'PROFILE_INCOMPLETE' || error.message?.includes('Please complete your profile')) {
        toast.success('Logged in successfully!');
        router.push('/complete-profile');
        return;
      }
      
      // Handle session conflicts
      if (error.message?.includes('Creation of a session is prohibited when a session is active')) {
        setLocalError('You already have an active session. Please use the "Fix Session Issues" button below.');
        toast.error('Session conflict detected. Please fix session issues.');
        return;
      }
      
      // Handle other errors
      const errorMessage = authState.error || error.message || 'Failed to login';
      setLocalError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError(null);
      
      await appwriteAuth.createOAuth2Session('google');
    } catch (error: any) {
      console.error("Error during Google login:", error);
      let errorMessage = error.message || 'Failed to login with Google';
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message?.includes('Session creation failed')) {
        errorMessage = 'Failed to create Google login session. Please try again.';
      } else if (error.message?.includes('Creation of a session is prohibited when a session is active')) {
        errorMessage = 'You already have an active session. Please use the "Fix Session Issues" button below.';
      }
      
      setLocalError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Display the error from auth context or local error
  const displayError = authState.error || localError;
  const isLoading = authState.isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4 py-8 relative overflow-hidden">
      <BackgroundBeams />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/20 dark:border-gray-700/50 shadow-2xl">
          <Meteors number={20} />
          <CardHeader className="space-y-1 text-white">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back
              </CardTitle>
              <CardDescription className="text-gray-300 text-center">
                Enter your credentials to access your account
              </CardDescription>
            </motion.div>
          </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {displayError && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading || isCleaningUp}
                  required
                />
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading || isCleaningUp}
                  required
                />
              </div>
            </motion.div>

            <motion.div 
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || isCleaningUp}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <Sparkles text="Sign in" />
                )}
              </Button>
            </motion.div>
            
            {displayError && displayError.includes('session') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mt-2 border-orange-300/50 text-orange-300 hover:bg-orange-500/20"
                  onClick={handleCleanupSessions}
                  disabled={isLoading || isCleaningUp}
                >
                  {isCleaningUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing session issues...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Fix Session Issues
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6">
          <motion.div 
            className="relative w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-transparent px-2 text-gray-400">
                or continue with
              </span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              disabled={isLoading || isCleaningUp}
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </motion.div>
          
          <motion.div 
            className="text-center text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Don&apos;t have an account?{" "}
            <Link 
              href="/signup" 
              className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
            >
              Sign up
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
      </motion.div>
    </div>
  );
}
