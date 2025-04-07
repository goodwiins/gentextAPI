import Link from "next/link";
import { useState, useEffect } from "react";
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
      
      if (error.message?.includes('Please complete your profile')) {
        toast.success('Logged in successfully!');
        router.push('/complete-profile');
        return;
      }
      
      if (error.message?.includes('Creation of a session is prohibited when a session is active')) {
        setLocalError('You already have an active session. Please use the "Fix Session Issues" button below.');
      } else {
        // Use error from auth state or fallback to local error
        setLocalError(authState.error || error.message || 'Failed to login');
      }
      
      if (localError) {
        toast.error(localError);
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {displayError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isLoading || isCleaningUp}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
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
                  className="pl-9"
                  disabled={isLoading || isCleaningUp}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || isCleaningUp}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
            
            {displayError && displayError.includes('session') && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-2 border-orange-300 text-orange-600 hover:bg-orange-50"
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
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                or
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={isLoading || isCleaningUp}
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </Button>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link 
              href="/signup" 
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
