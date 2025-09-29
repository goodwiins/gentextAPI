import Link from "next/link";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail, Lock, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { appwriteAuth } from "@/lib/appwrite";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Meteors } from "@/components/ui/meteors";
import { Sparkles } from "@/components/ui/sparkles-text";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-gray-900 px-4 relative overflow-hidden">
      <BackgroundBeams />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="w-full max-w-lg backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/20 dark:border-gray-700/50 shadow-2xl">
          <Meteors number={25} />
          <CardHeader className="space-y-1 text-white">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Create an account
              </CardTitle>
              <CardDescription className="text-gray-300 text-center">
                Enter your information below to create your account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            <motion.div 
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-gray-300">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="first-name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-gray-300">Last name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
                  disabled={isLoading}
                  required
                />
              </div>
            </motion.div>

            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isLoading}
                  required
                />
              </div>
              {showPasswordRequirements && (
                <motion.div 
                  className="mt-2 p-3 bg-white/5 border border-white/10 rounded-md"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm font-medium mb-2 text-gray-300">Password requirements:</p>
                  <ul className="space-y-1">
                    {getPasswordRequirements().map((req, index) => (
                      <motion.li
                        key={index}
                        className={`text-sm flex items-center ${
                          req.met ? 'text-green-400' : 'text-gray-400'
                        }`}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="mr-2">{req.met ? '✓' : '○'}</span>
                        {req.text}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <Sparkles text="Create account" />
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
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
              disabled={isLoading}
              onClick={handleGoogleSignup}
            >
              Sign up with Google
            </Button>
          </motion.div>
          
          <motion.div 
            className="text-center text-sm text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Already have an account?{" "}
            <Link 
              href="/login" 
              className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
            >
              Sign in
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
      </motion.div>
    </div>
  );
}
