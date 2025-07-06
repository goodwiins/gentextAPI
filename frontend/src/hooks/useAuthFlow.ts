import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/context/auth-context';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useLocalStorage } from './useLocalStorage';

interface AuthFlowState {
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  step: 'idle' | 'validating' | 'authenticating' | 'redirecting' | 'cleanup';
  attempts: number;
  lastAttempt?: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const useAuthFlow = () => {
  const { login, logout, authState, clearAuthError } = useAuthContext();
  const router = useRouter();
  const [rememberMe, setRememberMe] = useLocalStorage('auth-remember-me', false);
  const [savedEmail, setSavedEmail] = useLocalStorage('auth-saved-email', '');
  
  const [flowState, setFlowState] = useState<AuthFlowState>({
    isLoading: false,
    isValidating: false,
    error: null,
    step: 'idle',
    attempts: 0,
  });

  // Rate limiting: prevent too many attempts
  const canAttemptAuth = useCallback(() => {
    if (flowState.attempts >= 5) {
      const timeSinceLastAttempt = flowState.lastAttempt 
        ? Date.now() - flowState.lastAttempt.getTime()
        : Infinity;
      return timeSinceLastAttempt > 5 * 60 * 1000; // 5 minutes
    }
    return true;
  }, [flowState.attempts, flowState.lastAttempt]);

  // Enhanced login with progressive feedback
  const enhancedLogin = useCallback(async (credentials: LoginCredentials) => {
    if (!canAttemptAuth()) {
      const error = 'Too many failed attempts. Please wait 5 minutes before trying again.';
      setFlowState(prev => ({ ...prev, error }));
      toast.error(error);
      return;
    }

    try {
      setFlowState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        step: 'validating',
        attempts: prev.attempts + 1,
        lastAttempt: new Date(),
      }));

      // Simulate progressive loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFlowState(prev => ({ ...prev, step: 'authenticating' }));
      
      // Save email if remember me is enabled
      if (credentials.rememberMe) {
        setSavedEmail(credentials.email);
        setRememberMe(true);
      } else {
        setSavedEmail('');
        setRememberMe(false);
      }

      await login(credentials.email, credentials.password);
      
      setFlowState(prev => ({ ...prev, step: 'redirecting' }));
      
      // Success feedback
      toast.success('Welcome back! 🎉', {
        duration: 3000,
        icon: '👋',
      });

      // Reset attempts on success
      setFlowState(prev => ({ ...prev, attempts: 0 }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/');
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let userFriendlyError = 'Login failed. Please try again.';
      
      if (error.message?.includes('Invalid credentials')) {
        userFriendlyError = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('PROFILE_INCOMPLETE')) {
        toast.success('Login successful! Please complete your profile.');
        router.push('/complete-profile');
        return;
      } else if (error.message?.includes('Rate limit')) {
        userFriendlyError = 'Too many login attempts. Please try again in a few minutes.';
      } else if (error.message?.includes('session')) {
        userFriendlyError = 'Session conflict detected. We\'ll help you resolve this.';
      }

      setFlowState(prev => ({ 
        ...prev, 
        error: userFriendlyError,
        step: 'idle'
      }));
      
      toast.error(userFriendlyError);
    } finally {
      setFlowState(prev => ({ ...prev, isLoading: false }));
    }
  }, [login, router, canAttemptAuth, setSavedEmail, setRememberMe]);

  // Enhanced logout with confirmation
  const enhancedLogout = useCallback(async (showConfirmation = false) => {
    if (showConfirmation) {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
    }

    try {
      setFlowState(prev => ({ ...prev, isLoading: true, step: 'cleanup' }));
      
      await logout();
      
      toast.success('Signed out successfully', {
        icon: '👋',
      });
      
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Error signing out. Please try again.');
    } finally {
      setFlowState(prev => ({ ...prev, isLoading: false, step: 'idle' }));
    }
  }, [logout]);

  // Clear errors with user feedback
  const clearError = useCallback(() => {
    setFlowState(prev => ({ ...prev, error: null }));
    clearAuthError();
  }, [clearAuthError]);

  // Auto-fill saved credentials
  const getSavedCredentials = useCallback(() => {
    return {
      email: rememberMe ? savedEmail : '',
      rememberMe,
    };
  }, [rememberMe, savedEmail]);

  // Check if currently in a loading state
  const isInLoadingState = flowState.isLoading || authState.isLoading;

  return {
    // State
    flowState: {
      ...flowState,
      isLoading: isInLoadingState,
    },
    authState,
    
    // Actions
    login: enhancedLogin,
    logout: enhancedLogout,
    clearError,
    
    // Utilities
    getSavedCredentials,
    canAttemptAuth: canAttemptAuth(),
    
    // Progress indicators
    getLoadingMessage: () => {
      switch (flowState.step) {
        case 'validating': return 'Validating credentials...';
        case 'authenticating': return 'Signing you in...';
        case 'redirecting': return 'Welcome! Redirecting...';
        case 'cleanup': return 'Signing out...';
        default: return 'Loading...';
      }
    },
    
    // Progress percentage for UI
    getProgress: () => {
      switch (flowState.step) {
        case 'validating': return 25;
        case 'authenticating': return 50;
        case 'redirecting': return 75;
        case 'cleanup': return 90;
        default: return 0;
      }
    },
  };
};