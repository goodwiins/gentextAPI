import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Eye, EyeOff, Shield, Lock, ArrowRight } from "lucide-react";
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
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { appwriteAuth } from "@/lib/appwrite";
import { BackgroundLines } from "@/components/ui/background-lines";

// Zod validation schema
const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, "Please enter your first name")
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Please enter your last name")
    .min(2, "Last name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Please enter your email")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Please enter your password")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Custom password input component with visibility toggle
  const PasswordInput = ({ value, onChange, disabled, className, ...props }: any) => {
    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`pr-12 sm:pr-12 h-12 sm:h-11 px-4 sm:px-3.5 text-[16px] sm:text-[15px] rounded-lg border transition-all duration-200 ease-out bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-input disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed touch-manipulation ${className || ''}`}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-1 sm:right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 sm:h-9 sm:w-9 p-0 hover:bg-accent touch-manipulation"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  };

  // Initialize React Hook Form with Zod validation
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);

    try {
      setIsLoading(true);

      // Create account with Appwrite
      await appwriteAuth.createAccount(
        data.email,
        data.password,
        data.firstName,
        data.lastName
      );

      // Automatically log in after successful signup
      await appwriteAuth.login(data.email, data.password);

      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      console.error("Error during signup:", error);
      let errorMessage = 'Failed to create account';

      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Too many signup attempts. Please try again later.';
      } else if (error.message?.includes('already exists')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setError(null);

      toast.loading('Redirecting to Google...', { duration: 2000 });

      // Create OAuth2 session for Google
      await appwriteAuth.createOAuth2Session('google');
    } catch (error: any) {
      console.error("Error during Google signup:", error);
      const errorMessage = error.message || 'Failed to signup with Google';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Premium Fixed Logo Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center group"
          >
            <span className="text-[24px] font-semibold tracking-tight text-foreground transition-all duration-200 group-hover:text-foreground/80 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100 motion-reduce:transition-none">
              GenText
            </span>
          </Link>
        </div>
      </header>

      <BackgroundLines className="min-h-screen flex items-center justify-center bg-background bg-lines-subtle pt-20" svgOptions={{ duration: 15 }}>
        <div className="w-full max-w-md px-4 py-12 sm:px-6 lg:px-8 relative z-10">
          {/* Welcome Section - Premium */}
          <div className="text-center mb-10 space-y-4">
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-700 motion-reduce:animate-none">
              <p className="text-[17px] font-medium text-foreground/90 tracking-tight">
                Create your account
              </p>
              <p className="text-[14px] text-muted-foreground/80 font-normal max-w-sm mx-auto leading-relaxed">
                Start your journey to better learning
              </p>
            </div>

            {/* Decorative gradient line */}
            <div className="relative h-px w-24 mx-auto mt-5 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent animate-in fade-in duration-1000 motion-reduce:animate-none"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse motion-reduce:animate-none" style={{ animationDuration: '3s' }}></div>
            </div>
          </div>

        {/* Main Form Container */}
        <Card className="card-on-background transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
          <CardHeader className="px-8 pt-8 pb-6">
            <CardTitle className="text-xl font-semibold tracking-tight mb-1">
              Sign up
            </CardTitle>
            <CardDescription className="text-[14px]">
              to start using GenText
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pt-0 pb-6">
            {/* Error Alert */}
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 animate-in fade-in-0 slide-in-from-top-1 duration-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[13px] leading-relaxed">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Name Fields - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name Input */}
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium tracking-tight">
                          First name
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            autoComplete="given-name"
                            placeholder="John"
                            className="h-12 sm:h-11 px-4 sm:px-3.5 text-[16px] sm:text-[15px] rounded-lg border transition-all duration-200 ease-out bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-input disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed touch-manipulation"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[13px]" />
                      </FormItem>
                    )}
                  />

                  {/* Last Name Input */}
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-medium tracking-tight">
                          Last name
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            autoComplete="family-name"
                            placeholder="Doe"
                            className="h-12 sm:h-11 px-4 sm:px-3.5 text-[16px] sm:text-[15px] rounded-lg border transition-all duration-200 ease-out bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-input disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed touch-manipulation"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[13px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email Input */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium tracking-tight">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="h-12 sm:h-11 px-4 sm:px-3.5 text-[16px] sm:text-[15px] rounded-lg border transition-all duration-200 ease-out bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-input disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed touch-manipulation"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[13px]" />
                    </FormItem>
                  )}
                />

                {/* Password Input */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] font-medium tracking-tight">
                        Password
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          {...field}
                          disabled={isLoading}
                          autoComplete="new-password"
                          placeholder="Create a secure password"
                        />
                      </FormControl>
                      <FormMessage className="text-[13px]" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 sm:h-11 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground text-[14px] sm:text-[14px] font-medium rounded-lg shadow-sm transition-all duration-150 ease-out hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100 touch-manipulation"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Creating account...</span>
                    </span>
                  ) : (
                    <span>Create account</span>
                  )}
                </Button>
              </form>
            </Form>

            {/* Divider */}
            <div className="relative my-7">
              <Separator className="absolute inset-0" />
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-[13px] text-muted-foreground font-normal">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 sm:h-11 text-[14px] sm:text-[14px] font-medium rounded-lg shadow-sm transition-all duration-150 ease-out hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:active:scale-100 touch-manipulation"
              disabled={isLoading}
              onClick={handleGoogleSignup}
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

        {/* Enhanced Sign In Link */}
        <div className="mt-6 relative group">
          {/* Subtle background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 motion-reduce:transition-none blur-xl" />

          <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 transition-all duration-300 group-hover:border-border/80 group-hover:shadow-lg group-hover:scale-[1.02] motion-reduce:group-hover:scale-100 motion-reduce:transition-none">
            <p className="text-center text-[14px] text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
              <span>Already have an account?</span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-all duration-200 group/link"
              >
                <span className="relative">
                  Sign in
                  <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 motion-reduce:transition-none" />
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5 motion-reduce:group-hover/link:translate-x-0 motion-reduce:transition-none" />
              </Link>
            </p>
          </div>
        </div>

        {/* Enhanced Footer Trust Indicator */}
        <div className="mt-8 space-y-4">
          {/* Security Features Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {/* Encryption Badge */}
            <div className="group/badge relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background border border-border/40 rounded-lg p-3 transition-all duration-300 hover:border-border/60 hover:shadow-md hover:scale-[1.02] motion-reduce:hover:scale-100 motion-reduce:transition-none">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500 motion-reduce:transition-none" />

              <div className="relative flex items-center gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover/badge:scale-110 motion-reduce:group-hover/badge:scale-100 motion-reduce:transition-none">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/90 tracking-tight">
                    256-bit SSL
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Encryption
                  </p>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="group/badge relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background border border-border/40 rounded-lg p-3 transition-all duration-300 hover:border-border/60 hover:shadow-md hover:scale-[1.02] motion-reduce:hover:scale-100 motion-reduce:transition-none">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500 motion-reduce:transition-none" />

              <div className="relative flex items-center gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-transform duration-300 group-hover/badge:scale-110 motion-reduce:group-hover/badge:scale-100 motion-reduce:transition-none">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/90 tracking-tight">
                    Data Protected
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    GDPR Compliant
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main security message with subtle animation */}
          <div className="text-center relative">
            <p className="text-[12px] text-muted-foreground/80 font-normal animate-in fade-in duration-1000 delay-300 motion-reduce:animate-none">
              Your data is secured with industry-standard encryption
            </p>

            {/* Decorative security pulse indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-2 animate-in fade-in duration-1000 delay-500 motion-reduce:animate-none">
              <div className="relative flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse motion-reduce:animate-none" style={{ animationDuration: '2s' }} />
                <div className="absolute h-1.5 w-1.5 rounded-full bg-green-500 animate-ping motion-reduce:animate-none opacity-40" style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                Secure Connection Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </BackgroundLines>
    </>
  );
}
