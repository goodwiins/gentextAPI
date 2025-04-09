import { Client, Account, ID, Models } from 'appwrite';

// Extract environment variables with debugging
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

// Log configuration for debugging
console.log('Appwrite Configuration:');
console.log(`- Endpoint: ${APPWRITE_ENDPOINT}`);
console.log(`- Project ID: ${APPWRITE_PROJECT_ID ? '********' + APPWRITE_PROJECT_ID.slice(-4) : 'MISSING'}`);

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);

// Helper function to handle rate limits
const handleRateLimit = async (error: any, retryCount = 0): Promise<any> => {
    if (error.message?.includes('Rate limit') && retryCount < 3) {
        // Wait for 2 seconds before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        return null; // Return null to indicate retry
    }
    throw error;
};

// Helper function to standardize user ID format
const formatUserId = (userId: string): string => {
    // First, remove any invalid characters
    let formattedId = userId.replace(/[^a-zA-Z0-9._-]/g, '');
    
    // Remove any leading special characters
    formattedId = formattedId.replace(/^[._-]+/, '');
    
    // If the ID starts with a special character or is empty, prepend 'u'
    if (!formattedId || /^[._-]/.test(formattedId)) {
        formattedId = 'u' + formattedId;
    }
    
    // Ensure the ID doesn't exceed 36 characters
    return formattedId.substring(0, 36);
};

// Auth functions
export const appwriteAuth = {
    // Create a new account
    createAccount: async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            // Generate a valid ID that meets Appwrite's requirements
            const userId = formatUserId(ID.unique());
            
            // Create the account first
            const response = await account.create(
                userId,
                email,
                password,
                `${firstName} ${lastName}` // Full name
            );

            // Then update preferences
            await account.updatePrefs({
                FirstName: firstName,
                LastName: lastName,
                UserId: userId
            });

            return response;
        } catch (error) {
            console.error('Appwrite service :: createAccount :: error', error);
            throw error;
        }
    },

    // Login with retry logic
    login: async (email: string, password: string, retryCount = 0): Promise<Models.Session> => {
        try {
            // Check for existing session and delete it first
            try {
                const sessions = await account.listSessions();
                if (sessions.total > 0) {
                    console.log('Found existing session, logging out first...');
                    await account.deleteSession('current');
                }
            } catch (sessionError) {
                // If there's an error checking sessions, proceed anyway
                console.warn('Error checking existing sessions:', sessionError);
            }
            
            // Use createEmailPasswordSession instead of createSession
            const response = await account.createEmailPasswordSession(email, password);
            return response;
        } catch (error: any) {
            const shouldRetry = await handleRateLimit(error, retryCount);
            if (shouldRetry === null) {
                return appwriteAuth.login(email, password, retryCount + 1);
            }
            console.error('Appwrite service :: login :: error', error);
            throw error;
        }
    },

    // Get current session with retry logic
    getCurrentSession: async (retryCount = 0): Promise<Models.Session> => {
        try {
            return await account.getSession('current');
        } catch (error: any) {
            const shouldRetry = await handleRateLimit(error, retryCount);
            if (shouldRetry === null) {
                return appwriteAuth.getCurrentSession(retryCount + 1);
            }
            console.error('Appwrite service :: getCurrentSession :: error', error);
            throw error;
        }
    },

    // Get user details with retry logic
    getCurrentUser: async (retryCount = 0): Promise<Models.User<Models.Preferences>> => {
        try {
            return await account.get();
        } catch (error: any) {
            const shouldRetry = await handleRateLimit(error, retryCount);
            if (shouldRetry === null) {
                return appwriteAuth.getCurrentUser(retryCount + 1);
            }
            console.error('Appwrite service :: getCurrentUser :: error', error);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            return await account.deleteSession('current');
        } catch (error) {
            console.error('Appwrite service :: logout :: error', error);
            throw error;
        }
    },

    // Password Reset
    resetPassword: async (email: string) => {
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

    // OAuth2 Login
    createOAuth2Session: async (provider: 'google' | 'github' | 'facebook' | 'apple') => {
        try {
            // Check for existing session and delete it first to avoid conflicts
            try {
                const sessions = await account.listSessions();
                if (sessions.total > 0) {
                    console.log('Found existing session before OAuth, logging out first...');
                    await account.deleteSession('current');
                }
            } catch (sessionError) {
                // If there's an error checking sessions, proceed anyway
                console.warn('Error checking existing sessions before OAuth:', sessionError);
            }
            
            return await account.createOAuth2Session(
                provider as any,
                `${window.location.origin}/`,
                `${window.location.origin}/login`
            );
        } catch (error) {
            console.error('Appwrite service :: createOAuth2Session :: error', error);
            throw error;
        }
    },
    
    // Function to clean up sessions if there are any issues
    cleanupSessions: async () => {
        try {
            console.log('Performing session cleanup...');
            const sessions = await account.listSessions();
            
            if (sessions.total > 0) {
                console.log(`Found ${sessions.total} active sessions, cleaning up...`);
                
                // Delete all sessions
                await account.deleteSessions();
                console.log('All sessions deleted successfully');
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
                return true;
            } catch (innerError) {
                console.error('Failed to delete current session:', innerError);
                return false;
            }
        }
    }
}; 