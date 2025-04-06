import React, { createContext, useContext } from 'react';

interface AuthState {
  user: { $id: string } | null;
  isLoading: boolean;
}

interface AuthContextType {
  authState: AuthState;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthState: AuthState = {
    user: { $id: 'user123' },
    isLoading: false,
  };

  return (
    <AuthContext.Provider value={{ authState: mockAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}; 