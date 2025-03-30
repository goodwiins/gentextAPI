import axios from 'axios';
import { account, databases } from './appwrite-config';
import { ID, AppwriteException } from 'appwrite';
import httpClient from '../httpClient';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials extends LoginCredentials {
    firstName: string;
    lastName: string;
}

class ApiService {
    // FastAPI Authentication
    async loginWithFastAPI(credentials: LoginCredentials) {
        try {
            const response = await httpClient.post('/auth/login', credentials);
            return response.data;
        } catch (error) {
            console.error('FastAPI Login Error:', error);
            throw error;
        }
    }

    // Appwrite Authentication
    async loginWithAppwrite(credentials: LoginCredentials) {
        try {
            console.log('Attempting Appwrite login...');
            const session = await account.createSession(
                credentials.email,
                credentials.password
            );
            console.log('Appwrite login successful:', session);
            return session;
        } catch (error) {
            if (error instanceof AppwriteException) {
                console.error('Appwrite Login Error:', {
                    code: error.code,
                    message: error.message,
                    type: error.type
                });
            } else {
                console.error('Unknown Appwrite Login Error:', error);
            }
            throw error;
        }
    }

    async signup(credentials: SignupCredentials) {
        try {
            console.log('Attempting Appwrite signup...');
            // Create user in Appwrite
            const user = await account.create(
                ID.unique(),
                credentials.email,
                credentials.password,
                credentials.firstName
            );
            console.log('Appwrite signup successful:', user);

            // Create user in FastAPI backend
            await httpClient.post('/auth/signup', {
                email: credentials.email,
                password: credentials.password,
                first_name: credentials.firstName,
                last_name: credentials.lastName
            });

            // Login after successful signup
            return await this.loginWithAppwrite(credentials);
        } catch (error) {
            if (error instanceof AppwriteException) {
                console.error('Appwrite Signup Error:', {
                    code: error.code,
                    message: error.message,
                    type: error.type
                });
            } else {
                console.error('Unknown Appwrite Signup Error:', error);
            }
            throw error;
        }
    }

    // Generate statements using FastAPI
    async generateStatements(fullSentence: string, numStatements: number = 3) {
        try {
            const response = await httpClient.post('/generate/statements', {
                full_sentence: fullSentence,
                num_statements: numStatements
            });
            return response.data;
        } catch (error) {
            console.error('Generate Statements Error:', error);
            throw error;
        }
    }

    // Logout from both services
    async logout() {
        try {
            await account.deleteSession('current');
            await httpClient.post('/logout');
        } catch (error) {
            console.error('Logout Error:', error);
            throw error;
        }
    }

    // Get current user from Appwrite
    async getCurrentUser() {
        try {
            console.log('Attempting to get current user...');
            const user = await account.get();
            console.log('Current user:', user);
            return user;
        } catch (error) {
            if (error instanceof AppwriteException) {
                console.error('Get Current User Error:', {
                    code: error.code,
                    message: error.message,
                    type: error.type
                });
            } else {
                console.error('Unknown Get Current User Error:', error);
            }
            return null;
        }
    }
}

export const apiService = new ApiService(); 