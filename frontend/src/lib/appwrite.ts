import { Client, Account, ID, Models, Databases } from 'appwrite';

// Extract environment variables with debugging
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

// Log configuration for debugging
console.log('Appwrite Configuration:');
console.log(`- Endpoint: ${APPWRITE_ENDPOINT}`);
console.log(`- Project ID: ${APPWRITE_PROJECT_ID ? '********' + APPWRITE_PROJECT_ID.slice(-4) : 'MISSING'}`);

export const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

// Simple cache to prevent duplicate requests
let sessionCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 seconds

const getCachedSession = () => {
    if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
        return sessionCache.data;
    }
    return null;
};

const setCachedSession = (data: any) => {
    sessionCache = { data, timestamp: Date.now() };
};

const clearSessionCache = () => {
    sessionCache = null;
};

// Helper to check for rate limit errors
const isRateLimit = (error: any): boolean => {
    return typeof error?.message === 'string' && /rate limit/i.test(error.message);
};

// Auth functions
export const appwriteAuth = {
    // Create a new account
    createAccount: async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            // Use Appwrite's ID.unique() as-is - it already returns a valid ID
            const response = await account.create(
                ID.unique(),
                email,
                password,
                `${firstName} ${lastName}` // Full name
            );
            console.log('Account created successfully:', response.$id);

            // Create a session for the newly created user
            const session = await account.createEmailPasswordSession(email, password);
            console.log('Session created for new user:', session.$id);
            setCachedSession(session);

            // Best-effort preferences update (non-fatal)
            try {
                await account.updatePrefs({
                    FirstName: firstName,
                    LastName: lastName,
                });
                console.log('User preferences updated successfully');
            } catch (prefError: any) {
                console.warn('Failed to update preferences during registration:', prefError?.message);
            }

            return response;
        } catch (error: any) {
            clearSessionCache();

            // Handle rate limit errors
            if (isRateLimit(error)) {
                throw new Error('Too many registration attempts. Please wait a few minutes and try again.');
            }

            // Handle existing user errors
            if (error.code === 409 || /already exists/i.test(error?.message ?? '')) {
                throw new Error('An account with this email already exists. Please try logging in instead.');
            }

            // Handle specific error for missing scopes
            if (error.type === 'user_unauthorized' || /missing scopes/i.test(error?.message ?? '')) {
                throw new Error('Registration completed but preferences could not be set. Please complete your profile after logging in.');
            }

            console.error('Appwrite service :: createAccount :: error', error);
            throw error;
        }
    },

    // Login - clean and simple
    login: async (email: string, password: string): Promise<Models.Session> => {
        try {
            clearSessionCache();
            const response = await account.createEmailPasswordSession(email, password);
            console.log('Login successful, session created:', response.$id);
            setCachedSession(response);
            return response;
        } catch (error: any) {
            // If session creation fails due to existing session, clean up and retry once
            if (/session is active|Creation of a session is prohibited/i.test(error?.message ?? '')) {
                console.log('Existing session detected, cleaning up...');
                try {
                    await account.deleteSession('current');
                    const response = await account.createEmailPasswordSession(email, password);
                    console.log('Login successful after cleanup, session created:', response.$id);
                    setCachedSession(response);
                    return response;
                } catch (retryError) {
                    throw retryError;
                }
            }

            if (isRateLimit(error)) {
                throw new Error('Too many login attempts. Please wait a few minutes and try again.');
            }

            console.error('Appwrite service :: login :: error', error);
            throw error;
        }
    },

    // Get current session with caching and no retries
    getCurrentSession: async (): Promise<Models.Session | null> => {
        try {
            // Check cache first to reduce API calls
            const cached = getCachedSession();
            if (cached !== null) {
                return cached;
            }

            const session = await account.getSession('current');
            setCachedSession(session);
            return session;
        } catch (error: any) {
            // Handle scope errors gracefully - no session means user is not authenticated
            if (error.message?.includes('missing scopes') ||
                error.type === 'user_unauthorized' ||
                error.code === 401) {
                setCachedSession(null);
                return null;
            }

            console.error('Appwrite service :: getCurrentSession :: error', error);
            setCachedSession(null);
            return null;
        }
    },

    // Get user details - no retries, just a simple fetch
    getCurrentUser: async (): Promise<Models.User<Models.Preferences> | null> => {
        try {
            const user = await account.get();
            return user;
        } catch (error: any) {
            // Handle scope errors gracefully
            if (error.message?.includes('missing scopes') ||
                error.type === 'user_unauthorized' ||
                error.code === 401 ||
                error.message?.includes('guests')) {
                return null;
            }

            console.error('Appwrite service :: getCurrentUser :: error', error);
            return null;
        }
    },

    // Logout
    logout: async () => {
        try {
            clearSessionCache();
            return await account.deleteSession('current');
        } catch (error) {
            console.error('Appwrite service :: logout :: error', error);
            clearSessionCache(); // Clear even on error
            throw error;
        }
    },

    // Password Reset (browser only)
    resetPassword: async (email: string) => {
        if (typeof window === 'undefined') {
            throw new Error('resetPassword must be called in the browser.');
        }
        try {
            return await account.createRecovery(
                email,
                `${window.location.origin}/reset-password`
            );
        } catch (error) {
            console.error('Appwrite service :: resetPassword :: error', error);
            throw error;
        }
    },

    // OAuth2 Login (browser only)
    createOAuth2Session: async (provider: 'google' | 'github' | 'facebook' | 'apple') => {
        if (typeof window === 'undefined') {
            throw new Error('createOAuth2Session must be called in the browser.');
        }

        const successUrl = `${window.location.origin}/?auth_success=true`;
        const failureUrl = `${window.location.origin}/login?auth_error=true`;

        try {
            console.log(`Starting OAuth flow for provider: ${provider}`);
            return account.createOAuth2Session(
                provider as any,
                successUrl,
                failureUrl
            );
        } catch (error: any) {
            console.error('Appwrite service :: createOAuth2Session :: error', error);

            // If there's a session conflict, try cleaning up and retrying once
            if (/session is active|Creation of a session is prohibited/i.test(error?.message ?? '')) {
                console.log('Session conflict detected, cleaning up and retrying...');
                try {
                    await account.deleteSessions();
                    clearSessionCache();
                    return account.createOAuth2Session(
                        provider as any,
                        successUrl,
                        failureUrl
                    );
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                    throw retryError;
                }
            }

            throw error;
        }
    },
    
    // Function to clean up sessions if there are any issues
    cleanupSessions: async () => {
        try {
            console.log('Performing session cleanup...');
            clearSessionCache();

            const sessions = await account.listSessions();

            if (sessions.total > 0) {
                console.log(`Found ${sessions.total} active sessions, cleaning up...`);

                // Delete all sessions
                await account.deleteSessions();
                console.log('All sessions deleted successfully');
                clearSessionCache();
                return true;
            } else {
                console.log('No active sessions found to clean up');
                return false;
            }
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
            // Try one more direct approach if the first fails
            try {
                await account.deleteSession('current');
                clearSessionCache();
                return true;
            } catch (innerError) {
                console.error('Failed to delete current session:', innerError);
                clearSessionCache();
                return false;
            }
        }
    }
}; 