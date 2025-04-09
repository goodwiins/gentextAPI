import { Models, Query } from 'appwrite';
import { client, databases } from './appwrite-config';

// Environment variables with fallbacks
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

export interface QuizItem extends Models.Document {
  text: string;
  title: string;
  createdAt: string;
  userId: string;
  questions: string;
}

interface FetchQuizzesOptions {
  userId: string;
  limit?: number;
  offset?: number;
  orderDesc?: boolean;
  searchTerm?: string;
}

export const quizService = {
  /**
   * Validate that required Appwrite configuration is present
   */
  validateConfig(): boolean {
    return Boolean(
      databases && 
      APPWRITE_DATABASE_ID && 
      APPWRITE_COLLECTION_ID
    );
  },

  /**
   * Get detailed error information for Appwrite errors
   */
  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  },

  /**
   * Fetch user quizzes with pagination, sorting, and search
   */
  async fetchUserQuizzes({
    userId,
    limit = 20,
    offset = 0,
    orderDesc = true,
    searchTerm = '',
  }: FetchQuizzesOptions): Promise<QuizItem[]> {
    if (!this.validateConfig()) {
      throw new Error('Appwrite is not properly configured');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const queries = [
        Query.equal('userId', userId),
        orderDesc ? Query.orderDesc('createdAt') : Query.orderAsc('createdAt'),
        Query.limit(limit),
        Query.offset(offset),
      ];

      // Add search query if provided
      if (searchTerm) {
        queries.push(Query.search('text', searchTerm));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        queries
      );

      return response.documents as QuizItem[];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  /**
   * Delete a quiz by ID
   */
  async deleteQuiz(quizId: string): Promise<void> {
    if (!this.validateConfig()) {
      throw new Error('Appwrite is not properly configured');
    }

    if (!quizId) {
      throw new Error('Quiz ID is required');
    }

    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        quizId
      );
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  /**
   * Get a single quiz by ID
   */
  async getQuizById(quizId: string): Promise<QuizItem> {
    if (!this.validateConfig()) {
      throw new Error('Appwrite is not properly configured');
    }

    if (!quizId) {
      throw new Error('Quiz ID is required');
    }

    try {
      const response = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        quizId
      );

      return response as QuizItem;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }
}; 