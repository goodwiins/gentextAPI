import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { appwriteAuth } from "@/lib/appwrite";
import { useAuthContext } from "@/context/auth-context";

// Zod validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Please enter your email")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Please enter your password")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { login, authState, clearAuthError, refreshAuth } = useAuthContext();
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Initialize React Hook Form with Zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  // Clear auth errors when form values change
  useEffect(() => {
    clearAuthError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("email"), form.watch("password")]);

  // Check for redirects if user is already logged in
  useEffect(() => {
    // Only redirect if we've finished loading and user exists
    if (!authState.isLoading && authState.user) {
      router.push('/');
    }
  }, [authState.isLoading, authState.user, router]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const code = urlParams.get('code');

    if (error) {
      toast.error(`Authentication error: ${error}`);
      router.replace('/login');
      return;
    }

    if (code) {
      // User is returning from OAuth flow, refresh auth state
      refreshAuth();
      router.replace('/login');
    }
  }, [router, refreshAuth]);

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

  const onSubmit = async (data: LoginFormValues) => {
    // Clear any previous errors
    setLocalError(null);

    try {
      // Login is handled by the auth context, which will set loading state internally
      await login(data.email, data.password);

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

      // Handle rate limit errors with helpful message
      if (error.message?.includes('Rate limit') || error.message?.includes('Too many')) {
        const rateMessage = 'Too many login attempts. Please wait 5-10 minutes before trying again, or clean up sessions from Appwrite Console.';
        setLocalError(rateMessage);
        toast.error(rateMessage, { duration: 8000 });
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
      toast.loading('Redirecting to Google...', { duration: 2000 });

      // Create OAuth session - this will redirect to Google
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
      } else if (error.message?.includes('session is active')) {
        errorMessage = 'Session conflict detected. Please clean up existing sessions first.';
      }

      setLocalError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Display the error from auth context or local error
  const displayError = authState.error || localError;
  const isLoading = authState.isLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block group"
          >
            <h1 className="text-[28px] font-semibold tracking-tight text-gray-900 transition-opacity hover:opacity-70">
              GenText
            </h1>
          </Link>
          <p className="mt-3 text-[15px] text-gray-600 font-normal">
            Welcome back
          </p>
        </div>

        {/* Main Form Container */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_4px_rgba(0,0,0,0.04)]">
          <CardHeader className="px-8 pt-8 pb-6">
            <CardTitle className="text-xl font-semibold text-gray-900 tracking-tight mb-1">
              Sign in
            </CardTitle>
            <CardDescription className="text-[14px] text-gray-500">
              to continue to GenText
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pt-0 pb-6">
            {/* Error Alert */}
            {displayError && (
              <Alert
                variant="destructive"
                className="mb-6 border-red-200/60 bg-red-50/50 animate-in fade-in-0 slide-in-from-top-1 duration-300"
              >
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-[13px] text-red-800 leading-relaxed">
                  {displayError}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Input */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium text-gray-700 tracking-tight">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="h-11 px-3.5 text-[15px] rounded-lg border transition-all duration-200 ease-out bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                          disabled={isLoading || isCleaningUp}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[13px] text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Password Input */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-[13px] font-medium text-gray-700 tracking-tight">
                          Password
                        </FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          className="h-11 px-3.5 text-[15px] rounded-lg border transition-all duration-200 ease-out bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                          disabled={isLoading || isCleaningUp}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[13px] text-red-600" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 mt-6 bg-gray-900 hover:bg-gray-800 active:bg-gray-900 text-white text-[14px] font-medium rounded-lg shadow-sm transition-all duration-150 ease-out hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100"
                  disabled={isLoading || isCleaningUp}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </span>
                  ) : (
                    <span>Continue</span>
                  )}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            <div className="relative my-7">
              <Separator className="absolute inset-0 bg-gray-200" />
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[13px] text-gray-500 font-normal">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-[14px] font-medium rounded-lg shadow-sm transition-all duration-150 ease-out hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100"
              disabled={isLoading || isCleaningUp}
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2.5 h-[18px] w-[18px]" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </Button>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-[14px] text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-gray-900 hover:text-gray-700 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-500 transition-colors duration-150"
          >
            Sign up
          </Link>
        </p>

        {/* Footer Trust Indicator */}
        <div className="mt-8 text-center">
          <p className="text-[12px] text-gray-500">
            Secured by industry-standard encryption
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-0 {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in-from-top-1 {
          from {
            transform: translateY(-4px);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .fade-in-0 {
          animation-name: fade-in-0;
        }

        .slide-in-from-top-1 {
          animation-name: slide-in-from-top-1;
        }

        .duration-300 {
          animation-duration: 300ms;
        }
      `}</style>
    </div>
  );
}
