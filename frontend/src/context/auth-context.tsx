// src/context/auth-context.tsx
import React, { useState, useContext, createContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";

// Define the type for the auth state and the provider's props
type AuthState = {
  token: string | null;
};

type AuthContextType = {
  authState: AuthState;
  setUserAuthInfo: (data: { token: string }) => void;
  isUserAuthenticated: () => boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({ token: null });

  const setUserAuthInfo = (data: { token: string }) => {
    localStorage.setItem("token", data.token);
    setAuthState({ token: data.token });
  };

  const isUserAuthenticated = (): boolean => {
    return !!authState.token;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthState({ token });
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      authState,
      setUserAuthInfo,
      isUserAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider };
