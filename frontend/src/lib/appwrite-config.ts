import { Client, Account, Databases } from 'appwrite';

if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    console.error('NEXT_PUBLIC_APPWRITE_ENDPOINT is not defined');
}

if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    console.error('NEXT_PUBLIC_APPWRITE_PROJECT_ID is not defined');
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

// Only initialize subscription on the client side with error handling
if (typeof window !== 'undefined') {
    try {
        // Only enable real-time in production or when explicitly enabled
        const enableRealtime = process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true';

        if (enableRealtime) {
            client.subscribe('*', (response) => {
                console.log('Appwrite Response:', response);
            });
        }
    } catch (error) {
        // Silently fail if WebSocket connection fails (e.g., security restrictions)
        console.debug('Appwrite real-time subscription not available:', error);
    }
}

export const account = new Account(client);
export const databases = new Databases(client);

export { client }; 