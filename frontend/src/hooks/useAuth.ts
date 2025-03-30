import { useSession, signIn, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { account } from '@/lib/appwrite-config';

export function useAuth() {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();

    // Check if user is logged in to Appwrite
    const { data: appwriteUser, isLoading: isLoadingAppwrite } = useQuery({
        queryKey: ['appwriteUser'],
        queryFn: () => apiService.getCurrentUser(),
        enabled: !!session,
        retry: false
    });

    // Login mutation
    const login = useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            // Login to both services
            const [appwriteSession, fastApiSession] = await Promise.all([
                apiService.loginWithAppwrite(credentials),
                apiService.loginWithFastAPI(credentials)
            ]);

            // Sign in with NextAuth
            await signIn('credentials', {
                email: credentials.email,
                password: credentials.password,
                redirect: false
            });

            return { appwriteSession, fastApiSession };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appwriteUser'] });
        }
    });

    // Signup mutation
    const signup = useMutation({
        mutationFn: apiService.signup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appwriteUser'] });
        }
    });

    // Logout mutation
    const logout = useMutation({
        mutationFn: async () => {
            await Promise.all([
                apiService.logout(),
                signOut({ redirect: true })
            ]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appwriteUser'] });
        }
    });

    return {
        user: appwriteUser,
        session,
        isLoading: status === 'loading' || isLoadingAppwrite,
        login,
        signup,
        logout,
        isAuthenticated: !!session && !!appwriteUser
    };
} 