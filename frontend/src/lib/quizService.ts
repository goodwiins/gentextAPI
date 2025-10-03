import { Models, Query, ID } from 'appwrite';
import { client, databases } from './appwrite';

// Environment variables with fallbacks
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

// Log environment variables for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Appwrite Environment Variables Check:');
  console.log('- ENDPOINT:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? '✅ Set' : '❌ Missing');
  console.log('- PROJECT_ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? '✅ Set' : '❌ Missing');
  console.log('- DATABASE_ID:', APPWRITE_DATABASE_ID ? '✅ Set' : '❌ Missing');
  console.log('- COLLECTION_ID:', APPWRITE_COLLECTION_ID ? '✅ Set' : '❌ Missing');
}

export interface QuizItem extends Models.Document {
  text: string;
  title: string;
  createdAt: string;
  userId: string;
  questions: string;
}

// Add interface for creating a quiz
export interface CreateQuizRequest {
  title: string;
  text: string;
  questions: string | any[]; // Allow both string and array types
  userId?: string;
  createdAt?: string;
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
    const isValid = Boolean(
      databases && 
      APPWRITE_DATABASE_ID && 
      APPWRITE_COLLECTION_ID
    );
    
    if (!isValid) {
      console.error('Appwrite configuration validation failed:');
      console.error('- databases:', !!databases);
      console.error('- APPWRITE_DATABASE_ID:', APPWRITE_DATABASE_ID);
      console.error('- APPWRITE_COLLECTION_ID:', APPWRITE_COLLECTION_ID);
      console.error('Please check your .env.local file has these variables set.');
    }
    
    return isValid;
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
   * Create a new quiz in Appwrite
   */
  async createQuiz(quiz: CreateQuizRequest): Promise<QuizItem> {
    if (!this.validateConfig()) {
      throw new Error('Appwrite is not properly configured');
    }

    try {
      // Ensure questions are properly formatted
      let formattedQuestions: string;
      
      // If questions is already a string, try to parse it to validate
      if (typeof quiz.questions === 'string') {
        try {
          const parsed = JSON.parse(quiz.questions);
          // If it's already a valid JSON string, keep it as is
          formattedQuestions = quiz.questions;
        } catch (e) {
          // If it's not a valid JSON string, create a new one
          formattedQuestions = JSON.stringify([{
            question: 'Sample Question',
            options: ['Option 1', 'Option 2'],
            answer: 'Option 1'
          }]);
        }
      } else if (Array.isArray(quiz.questions)) {
        // If it's an array, ensure each question has the required fields
        formattedQuestions = JSON.stringify(quiz.questions.map(q => {
          if (typeof q === 'object') {
            return {
              question: q.question || 'Question',
              options: Array.isArray(q.options) ? q.options : ['Option 1', 'Option 2'],
              answer: q.answer || 'Option 1'
            };
          }
          return {
            question: String(q),
            options: ['Option 1', 'Option 2'],
            answer: 'Option 1'
          };
        }));
      } else {
        // If it's neither a string nor an array, create a default
        formattedQuestions = JSON.stringify([{
          question: 'Sample Question',
          options: ['Option 1', 'Option 2'],
          answer: 'Option 1'
        }]);
      }
      
      // Prepare quiz data
      const quizData = {
        title: quiz.title || 'Untitled Quiz',
        text: quiz.text,
        questions: formattedQuestions,
        userId: quiz.userId || '',
        createdAt: quiz.createdAt || new Date().toISOString(),
      };
      
      // Create document in Appwrite
      const response = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        ID.unique(),
        quizData
      );
      
      return response as QuizItem;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
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
      console.log('🔍 Fetching quizzes with config:', {
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_COLLECTION_ID,
        userId,
        limit,
        offset
      });

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

      console.log('📝 Executing queries:', queries);

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        queries
      );

      console.log('✅ Quizzes fetched successfully:', response.total, 'documents');
      return response.documents as QuizItem[];
    } catch (error: any) {
      console.error('❌ Error fetching quizzes:', {
        message: error?.message,
        code: error?.code,
        type: error?.type,
        response: error?.response
      });

      // Provide more specific error messages
      if (error?.code === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error?.code === 404) {
        throw new Error('Collection not found. Please check your database configuration.');
      } else if (error?.message?.includes('Invalid query')) {
        throw new Error('Database query failed. The collection might be missing required attributes (text, title, userId, createdAt, questions).');
      } else if (error?.message?.includes('permission') || error?.code === 403) {
        throw new Error('Permission denied. Please check collection permissions allow reading documents where userId matches.');
      }

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