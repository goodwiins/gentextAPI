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
  refreshAuth: () => Promise<void>;
  // MFA methods
  loginWithMFA: (email: string, password: string, otp?: string, challengeId?: string, rememberDevice?: boolean) => Promise<{ session?: any; requiresMFA?: boolean; challengeId?: string }>;
  setupPhoneMFA: (phone: string, password: string) => Promise<void>;
  verifyPhone: (userId: string, otp: string) => Promise<void>;
  getMfaStatus: () => Promise<any>;
  enablePhoneMFA: () => Promise<void>;
  // Device management
  listSessions: () => Promise<any>;
  deleteSession: (sessionId: string) => Promise<void>;
  extendSession: (sessionId?: string) => Promise<void>;
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
      // First check if we have a valid session before trying to get user details
      let session = null;
      let user = null;
      
      try {
        session = await appwriteAuth.getCurrentSession();
        // Only try to get user if we have a valid session
        if (session) {
          user = await appwriteAuth.getCurrentUser();
        }
      } catch (sessionError: any) {
        // Handle scope errors gracefully - user is not authenticated
        if (sessionError.message?.includes('missing scopes') || 
            sessionError.type === 'user_unauthorized' ||
            sessionError.message?.includes('guests')) {
          console.log("User lacks required scopes, treating as unauthenticated");
        } else {
          console.log("Session check error:", sessionError?.message || "Unknown error");
        }
      }
      
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

      if (!user) {
        // Session exists but couldn't get user - likely a timing issue
        console.warn('Session created but user details not immediately available');
        setAuthState({ user: null, session, isLoading: false, error: null });
        throw new Error('Session created but user details unavailable. Please try refreshing the page.');
      }

      // Check if we need to redirect to complete profile
      const prefs = user.prefs as Record<string, any>;
      const hasIncompleteProfile = !prefs.FirstName || !prefs.LastName;

      // Always set the auth state with the user data we have
      setAuthState({ user, session, isLoading: false, error: null });

      if (hasIncompleteProfile) {
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

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('Starting auth refresh...');

      // Check session first, then get user only if session is valid
      let session = null;
      let user = null;

      try {
        session = await appwriteAuth.getCurrentSession();
        if (session) {
          console.log('Session found, getting user details...');
          user = await appwriteAuth.getCurrentUser();
          if (user) {
            console.log('User details retrieved successfully');
          }
        } else {
          console.log('No session found');
        }
      } catch (sessionError: any) {
        // Handle scope errors gracefully - don't retry when there's no valid session
        if (sessionError.message?.includes('missing scopes') ||
            sessionError.type === 'user_unauthorized' ||
            sessionError.message?.includes('guests')) {
          console.log('No valid session found (scope error), treating as unauthenticated');
        } else {
          console.error('Unexpected error during refresh:', sessionError);
        }
      }

      setAuthState({
        user,
        session,
        isLoading: false,
        error: null
      });

      if (user) {
        console.log('Auth refresh completed successfully');
      } else {
        console.log('Auth refresh completed - user not authenticated');
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        error: null
      });
    }
  }, []);

  // MFA Methods
  const loginWithMFA = useCallback(async (
    email: string,
    password: string,
    otp?: string,
    challengeId?: string,
    rememberDevice?: boolean
  ): Promise<{ session?: any; requiresMFA?: boolean; challengeId?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await appwriteAuth.loginWithMFA(email, password, otp, challengeId, rememberDevice);

      if (result.requiresMFA) {
        // MFA required, don't set user yet
        setAuthState(prev => ({ ...prev, isLoading: false, error: null }));
        return result;
      }

      // MFA complete or not required, get user details
      const user = await appwriteAuth.getCurrentUser();
      setAuthState({ user, session: result.session || null, isLoading: false, error: null });

      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
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

  const setupPhoneMFA = useCallback(async (phone: string, password: string): Promise<void> => {
    try {
      await appwriteAuth.updatePhone(phone, password);
      await appwriteAuth.createPhoneToken(phone);
    } catch (error: any) {
      console.error("Setup phone MFA error:", error);
      throw error;
    }
  }, []);

  const verifyPhone = useCallback(async (userId: string, otp: string): Promise<void> => {
    try {
      await appwriteAuth.updatePhoneVerification(userId, otp);
    } catch (error: any) {
      console.error("Verify phone error:", error);
      throw error;
    }
  }, []);

  const getMfaStatus = useCallback(async (): Promise<any> => {
    try {
      return await appwriteAuth.listMfaFactors();
    } catch (error: any) {
      console.error("Get MFA status error:", error);
      throw error;
    }
  }, []);

  const enablePhoneMFA = useCallback(async (): Promise<void> => {
    try {
      await appwriteAuth.createMfaAuthenticator('phone');
    } catch (error: any) {
      console.error("Enable phone MFA error:", error);
      throw error;
    }
  }, []);

  const listSessions = useCallback(async (): Promise<any> => {
    try {
      return await appwriteAuth.listSessions();
    } catch (error: any) {
      console.error("List sessions error:", error);
      throw error;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await appwriteAuth.deleteSession(sessionId);
      // Refresh auth state if we deleted the current session
      if (sessionId === 'current') {
        await refreshAuth();
      }
    } catch (error: any) {
      console.error("Delete session error:", error);
      throw error;
    }
  }, [refreshAuth]);

  const extendSession = useCallback(async (sessionId?: string): Promise<void> => {
    try {
      await appwriteAuth.extendSession(sessionId);
    } catch (error: any) {
      console.error("Extend session error:", error);
      throw error;
    }
  }, []);

  const contextValue = {
    authState,
    login,
    logout,
    isUserAuthenticated,
    clearAuthError,
    refreshAuth,
    loginWithMFA,
    setupPhoneMFA,
    verifyPhone,
    getMfaStatus,
    enablePhoneMFA,
    listSessions,
    deleteSession,
    extendSession
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
