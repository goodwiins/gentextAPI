import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import { account } from "@/lib/appwrite";
import { useAuthContext } from "@/context/auth-context";

export default function CompleteProfile() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check auth state inside useEffect to avoid SSR issues
    if (!authState.user) {
      router.push('/login');
      return;
    }
    
    // Pre-fill form with existing data if available
    const prefs = authState.user.prefs as Record<string, any>;
    if (prefs.FirstName) {
      setFirstName(prefs.FirstName);
    }
    if (prefs.LastName) {
      setLastName(prefs.LastName);
    }
  }, [authState.user, router]);

  // Return loading state or null while checking auth
  if (!authState.user) {
    return null;
  }

  const validateForm = () => {
    if (!firstName.trim()) {
      toast.error('Please enter your first name');
      return false;
    }
    if (!lastName.trim()) {
      toast.error('Please enter your last name');
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

      if (!authState.user || !authState.session) {
        throw new Error('Your session has expired. Please log in again.');
      }

      // Verify session is still valid before updating
      try {
        const session = await account.getSession('current');
        if (!session) {
          throw new Error('Your session has expired. Please log in again.');
        }
      } catch (sessionError: any) {
        if (sessionError?.message?.includes('missing scopes') ||
            sessionError?.message?.includes('guests') ||
            sessionError?.type === 'user_unauthorized') {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw sessionError;
      }

      // Format the user ID to meet Appwrite's requirements
      const userId = authState.user.$id
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
        .replace(/^[._-]/, '') // Remove leading special characters
        .substring(0, 36); // Limit to 36 characters

      // Ensure the ID starts with a letter or number
      const finalUserId = /^[a-zA-Z0-9]/.test(userId) ? userId : `u${userId}`;

      // Update user preferences
      await account.updatePrefs({
        FirstName: firstName,
        LastName: lastName,
        UserId: finalUserId
      });

      toast.success('Profile updated successfully!');
      router.push('/');
      router.refresh(); // Refresh the page to update auth state
    } catch (error: any) {
      console.error("Error updating profile:", error);

      // Handle session expiration and scope errors
      if (error?.message?.includes('session has expired') ||
          error?.message?.includes('missing scopes') ||
          error?.message?.includes('guests') ||
          error?.type === 'user_unauthorized') {
        toast.error('Your session has expired. Please log in again.');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
        return;
      }

      const errorMessage = error.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Please provide your name to complete your profile
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
            
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
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
              <Label htmlFor="last-name">Last Name</Label>
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

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 