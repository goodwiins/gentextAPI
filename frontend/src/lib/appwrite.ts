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
    console.log('Session cached with ID:', data?.$id);
};

const clearSessionCache = () => {
    console.log('Session cache cleared');
    sessionCache = null;
};

// Try to retrieve the existing session instead of blindly creating a new one
const getExistingSession = async (): Promise<Models.Session | null> => {
    const cached = getCachedSession();
    if (cached) {
        return cached;
    }

    try {
        const session = await account.getSession('current');
        setCachedSession(session);
        return session;
    } catch (error: any) {
        if (error?.code === 401 ||
            error?.type === 'user_unauthorized' ||
            error?.message?.includes('missing scopes') ||
            error?.message?.includes('guests') ||
            error?.message?.includes('Session not found')) {
            return null;
        }

        console.warn('getExistingSession :: unexpected error while checking session', error);
        return null;
    }
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

            let session = await getExistingSession();

            if (session) {
                console.log('Reusing existing session after account creation:', session.$id);
            } else {
                clearSessionCache();
                session = await account.createEmailPasswordSession(email, password);
                console.log('Session created for new user:', session.$id);
                setCachedSession(session);
            }

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
            const existingSession = await getExistingSession();

            if (existingSession) {
                console.log('Existing session detected, reusing session:', existingSession.$id);
                return existingSession;
            }

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
            const existingSession = await getExistingSession();

            if (existingSession) {
                console.log('Existing session detected, skipping OAuth flow.');
                return;
            }

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
    },

    // MFA Functions for SMS Authentication
    
    // Add phone number to user account
    updatePhone: async (phone: string, password: string) => {
        try {
            const response = await account.updatePhone(phone, password);
            console.log('Phone number updated successfully');
            return response;
        } catch (error) {
            console.error('Appwrite service :: updatePhone :: error', error);
            throw error;
        }
    },

    // Create phone token for verification
    createPhoneToken: async (phone: string) => {
        try {
            const response = await account.createPhoneToken(ID.unique(), phone);
            console.log('Phone verification token created');
            return response;
        } catch (error) {
            console.error('Appwrite service :: createPhoneToken :: error', error);
            throw error;
        }
    },

    // Verify phone with token
    updatePhoneVerification: async (userId: string, secret: string) => {
        try {
            const response = await account.updatePhoneVerification(userId, secret);
            console.log('Phone verification successful');
            return response;
        } catch (error) {
            console.error('Appwrite service :: updatePhoneVerification :: error', error);
            throw error;
        }
    },

    // Create MFA authenticator (use string literals that match Appwrite SDK)
    createMfaAuthenticator: async (type: string) => {
        try {
            const response = await account.createMfaAuthenticator(type as any);
            console.log(`MFA authenticator created: ${type}`);
            return response;
        } catch (error) {
            console.error('Appwrite service :: createMfaAuthenticator :: error', error);
            throw error;
        }
    },

    // List MFA factors
    listMfaFactors: async () => {
        try {
            const response = await account.listMfaFactors();
            console.log('MFA factors retrieved');
            return response;
        } catch (error) {
            console.error('Appwrite service :: listMfaFactors :: error', error);
            throw error;
        }
    },

    // Update/verify MFA authenticator (confirm TOTP setup with verification code)
    updateMfaAuthenticator: async (type: string, otp: string) => {
        try {
            const response = await account.updateMfaAuthenticator(type as any, otp);
            console.log(`MFA authenticator verified: ${type}`);
            return response;
        } catch (error) {
            console.error('Appwrite service :: updateMfaAuthenticator :: error', error);
            throw error;
        }
    },

    // Create MFA challenge (sends SMS)
    createMfaChallenge: async (factor: string) => {
        try {
            const response = await account.createMfaChallenge(factor as any);
            console.log(`MFA challenge created for ${factor}`);
            return response;
        } catch (error) {
            console.error('Appwrite service :: createMfaChallenge :: error', error);
            throw error;
        }
    },

    // Complete MFA challenge with OTP
    updateMfaChallenge: async (challengeId: string, otp: string, rememberDevice?: boolean) => {
        try {
            const response = await account.updateMfaChallenge(challengeId, otp);
            console.log('MFA challenge completed successfully');
            
            // If remember device is requested, extend the current session duration
            if (rememberDevice) {
                try {
                    await account.updateSession('current');
                    console.log('Session extended for remembered device');
                } catch (extendError) {
                    console.warn('Failed to extend session for remembered device:', extendError);
                }
            }
            
            return response;
        } catch (error) {
            console.error('Appwrite service :: updateMfaChallenge :: error', error);
            throw error;
        }
    },

    // Get MFA recovery codes
    createMfaRecoveryCodes: async () => {
        try {
            const response = await account.createMfaRecoveryCodes();
            console.log('MFA recovery codes created');
            return response;
        } catch (error) {
            console.error('Appwrite service :: createMfaRecoveryCodes :: error', error);
            throw error;
        }
    },

    // Login with MFA support
    loginWithMFA: async (email: string, password: string, otp?: string, challengeId?: string, rememberDevice?: boolean): Promise<{ session?: Models.Session; requiresMFA?: boolean; challengeId?: string }> => {
        try {
            const existingSession = await getExistingSession();

            if (existingSession && !otp) {
                console.log('Existing session detected, skipping MFA login flow.');
                return { session: existingSession };
            }

            if (otp && challengeId) {
                // MFA verification phase - use existing session
                console.log('MFA verification: getting existing session...');
                const session = await getExistingSession();
                if (!session) {
                    console.error('No active session found for MFA verification');
                    throw new Error('No active session found for MFA verification');
                }
                
                console.log('Found existing session for MFA verification:', session.$id);
                // Complete MFA challenge
                await account.updateMfaChallenge(challengeId, otp);
                console.log('MFA verification successful');

                // If remember device is requested, extend the session
                if (rememberDevice) {
                    try {
                        await account.updateSession('current');
                        console.log('Session extended for remembered device');
                    } catch (extendError) {
                        console.warn('Failed to extend session for remembered device:', extendError);
                    }
                }

                setCachedSession(session);
                
                return {
                    session,
                    requiresMFA: false
                };
            }

            clearSessionCache();

            // Step 1: Create initial session
            const session = await account.createEmailPasswordSession(email, password);
            console.log('Initial login successful, checking MFA requirements...');
            console.log('Session created with ID:', session.$id);
            setCachedSession(session);
            
            // Step 2: Check if MFA is required
            const mfaFactors = await account.listMfaFactors();
            
            if (mfaFactors.phone && !otp) {
                // MFA is required but no OTP provided - create challenge
                console.log('Creating MFA challenge for phone factor...');
                const challenge = await account.createMfaChallenge('phone' as any);
                console.log('SMS MFA challenge created, code sent to phone');
                console.log('Session after MFA challenge creation:', session.$id);
                
                // Verify session is still valid after challenge creation
                try {
                    const currentSession = await account.getSession('current');
                    console.log('Session verified after challenge creation:', currentSession.$id);
                } catch (error) {
                    console.error('Session verification failed after challenge creation:', error);
                }
                
                return {
                    requiresMFA: true,
                    challengeId: challenge.$id
                };
            }
            
            // No MFA required
            return {
                session,
                requiresMFA: false
            };
            
        } catch (error: any) {
            clearSessionCache();
            
            if (isRateLimit(error)) {
                throw new Error('Too many login attempts. Please wait a few minutes and try again.');
            }
            
            console.error('Appwrite service :: loginWithMFA :: error', error);
            throw error;
        }
    },

    // Device management methods
    listSessions: async () => {
        try {
            const response = await account.listSessions();
            console.log('Sessions retrieved:', response.total);
            return response;
        } catch (error) {
            console.error('Appwrite service :: listSessions :: error', error);
            throw error;
        }
    },

    deleteSession: async (sessionId: string) => {
        try {
            const response = await account.deleteSession(sessionId);
            console.log('Session deleted:', sessionId);
            return response;
        } catch (error) {
            console.error('Appwrite service :: deleteSession :: error', error);
            throw error;
        }
    },

    extendSession: async (sessionId: string = 'current') => {
        try {
            const response = await account.updateSession(sessionId);
            console.log('Session extended:', sessionId);
            return response;
        } catch (error) {
            console.error('Appwrite service :: extendSession :: error', error);
            throw error;
        }
    }
}; 
