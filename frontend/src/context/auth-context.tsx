// src/context/auth-context.tsx
import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { appwriteAuth, account } from "@/lib/appwrite";
import { Models } from "appwrite";

// Define the type for the auth state and the provider's props
type AuthState = {
  user: Models.User<Models.Preferences> | null;
  session: Models.Session | null;
  isLoading: boolean;
};

type AuthContextType = {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isUserAuthenticated: () => boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({ 
    user: null,
    session: null,
    isLoading: true 
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await appwriteAuth.getCurrentUser();
      const session = await appwriteAuth.getCurrentSession();
      setAuthState({ user, session, isLoading: false });
    } catch (error: any) {
      if (error.message?.includes('Rate limit')) {
        // If we hit a rate limit during initial auth check, just set loading to false
        setAuthState({ user: null, session: null, isLoading: false });
      } else {
        setAuthState({ user: null, session: null, isLoading: false });
      }
    }
  };

  const login = async (email: string, password: string) => {
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
      setAuthState({ user, session, isLoading: false });

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
      if (error.message === 'PROFILE_INCOMPLETE') {
        throw new Error('Please complete your profile to continue.');
      } else if (error.message?.includes('Rate limit')) {
        throw new Error('Too many login attempts. Please try again in a few moments.');
      } else if (error.message?.includes('Invalid credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      } else if (error.message?.includes('User not found')) {
        throw new Error('Account not found. Please check your email or sign up.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await appwriteAuth.logout();
      setAuthState({ user: null, session: null, isLoading: false });
    } catch (error: any) {
      if (error.message?.includes('Rate limit')) {
        throw new Error('Too many logout attempts. Please try again in a few moments.');
      }
      throw error;
    }
  };

  const isUserAuthenticated = (): boolean => {
    return !!authState.user && !!authState.session;
  };

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      logout,
      isUserAuthenticated
    }}>
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
