// src/context/auth-context.tsx
import React, { useState, useContext, createContext, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/router";
import { appwriteAuth, account } from "@/lib/appwrite";
import { Models } from "appwrite";

// Define the type for the auth state and the provider's props
type AuthState = {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isUserAuthenticated: () => boolean;
  clearAuthError: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({ 
    user: null,
    session: null,
    isLoading: true,
    error: null
  });
  
  const router = useRouter();

  // Memoize checkAuthStatus to prevent unnecessary rerenders
  const checkAuthStatus = useCallback(async () => {
    try {
      const user = await appwriteAuth.getCurrentUser();
      const session = await appwriteAuth.getCurrentSession();
      setAuthState(prev => ({ 
        ...prev,
        user, 
        session, 
        isLoading: false,
        error: null
      }));
    } catch (error: any) {
      console.log("Auth check error:", error?.message || "Unknown error");
      setAuthState(prev => ({ 
        ...prev,
        user: null, 
        session: null, 
        isLoading: false,
        error: null // Don't set error on initial auth check
      }));
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const clearAuthError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Create session first
      const session = await appwriteAuth.login(email, password);
      
      // Get user details after successful login
      const user = await appwriteAuth.getCurrentUser();
      
      // Format the user ID to meet Appwrite's requirements
      const formattedUserId = user.$id
        .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
        .replace(/^[._-]+/, '') // Remove leading special characters
        .substring(0, 36); // Limit to 36 characters
      
      // Ensure the ID starts with a letter or number
      const finalUserId = /^[a-zA-Z0-9]/.test(formattedUserId) ? formattedUserId : `u${formattedUserId}`;
      
      // Set the auth state with the user data we have
      setAuthState({ user, session, isLoading: false, error: null });

      // Check if we need to redirect to complete profile
      const prefs = user.prefs as Record<string, any>;
      if (!prefs.FirstName || !prefs.LastName || !prefs.UserId) {
        // Update preferences with the formatted user ID
        await account.updatePrefs({
          FirstName: prefs.FirstName || '',
          LastName: prefs.LastName || '',
          UserId: finalUserId
        });
        throw new Error('PROFILE_INCOMPLETE');
      }
    } catch (error: any) {
      let errorMessage = "Unknown error occurred";
      
      if (error.message === 'PROFILE_INCOMPLETE') {
        errorMessage = 'Please complete your profile to continue.';
      } else if (error.message?.includes('Rate limit')) {
        errorMessage = 'Too many login attempts. Please try again in a few moments.';
      } else if (error.message?.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'Account not found. Please check your email or sign up.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("Login error:", errorMessage);
      setAuthState(prev => ({ 
        ...prev, 
        user: null,
        session: null,
        isLoading: false, 
        error: errorMessage 
      }));
      
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await appwriteAuth.logout();
      setAuthState({ user: null, session: null, isLoading: false, error: null });
      
      // Redirect to login page after logout
      router.push('/login');
    } catch (error: any) {
      const errorMessage = error.message?.includes('Rate limit')
        ? 'Too many logout attempts. Please try again in a few moments.'
        : error.message || 'Failed to logout';
        
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage
      }));
      
      throw error;
    }
  }, [router]);

  const isUserAuthenticated = useCallback((): boolean => {
    return !!authState.user && !!authState.session;
  }, [authState.user, authState.session]);

  const contextValue = {
    authState,
    login,
    logout,
    isUserAuthenticated,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider };
