import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail, Lock, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { appwriteAuth } from "@/lib/appwrite";

interface PasswordRequirement {
  text: string;
  met: boolean;
}

export default function Signup() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const passwordRequirements = [
    { regex: /.{8,}/, text: "At least 8 characters long" },
    { regex: /[A-Z]/, text: "Contains uppercase letter" },
    { regex: /[a-z]/, text: "Contains lowercase letter" },
    { regex: /[0-9]/, text: "Contains number" },
    { regex: /[^A-Za-z0-9]/, text: "Contains special character" },
  ];

  const getPasswordRequirements = (): PasswordRequirement[] => {
    return passwordRequirements.map(req => ({
      text: req.text,
      met: req.regex.test(password)
    }));
  };

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      toast.error('Please enter a password');
      return false;
    }
    
    const unmetRequirements = passwordRequirements.filter(req => !req.regex.test(password));
    if (unmetRequirements.length > 0) {
      toast.error('Please meet all password requirements');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create account with Appwrite
      await appwriteAuth.createAccount(
        email,
        password,
        firstName,
        lastName
      );

      // Automatically log in after successful signup
      await appwriteAuth.login(email, password);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="first-name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

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
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  className="pl-9"
                  disabled={isLoading}
                  required
                />
              </div>
              {showPasswordRequirements && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-sm font-medium mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    {getPasswordRequirements().map((req, index) => (
                      <li
                        key={index}
                        className={`text-sm flex items-center ${
                          req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                        }`}
                      >
                        <span className="mr-2">{req.met ? '✓' : '○'}</span>
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
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
            disabled={isLoading}
            onClick={handleGoogleSignup}
          >
            Sign up with Google
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
