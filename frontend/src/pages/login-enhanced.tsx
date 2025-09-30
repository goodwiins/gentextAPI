import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Mail, Lock, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { appwriteAuth } from "@/lib/appwrite";
import { useAuthContext } from "@/context/auth-context";
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
    <EnhancedAuthWrapper
      title="Welcome Back"
      subtitle="Enter your credentials to access your account"
      enableAnimations={true}
    >
      <div className="relative p-1">
        {/* Existing form content with enhanced styling */}
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

        <div className="mt-6 space-y-4">
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
        </div>
      </div>
    </EnhancedAuthWrapper>
  );
}