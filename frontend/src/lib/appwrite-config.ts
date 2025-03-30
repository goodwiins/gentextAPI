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

// Test the connection
client.subscribe('*', (response) => {
    console.log('Appwrite Response:', response);
});

export const account = new Account(client);
export const databases = new Databases(client);

export { client }; 