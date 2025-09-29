/**
 * API Contract Tests for Aceternity UI Integration
 * Tests all API interface contracts for type safety and compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  QuizGenerationRequest,
  QuizGenerationResponse,
  GeneratedQuestion,
  UserProgressRequest,
  UserProgressResponse,
  UserHistoryRequest,
  UserHistoryResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  APIError,
  APIResponse,
} from '@/types/aceternity';

// Mock data for testing
const mockGeneratedQuestions: GeneratedQuestion[] = [
  {
    id: 'q1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    explanation: 'Paris is the capital of France.',
    difficulty: 'easy',
    category: 'Geography',
    confidence: 0.95,
  },
  {
    id: 'q2',
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    difficulty: 'easy',
    confidence: 0.99,
  },
];

describe('API Contract Tests', () => {
  describe('Quiz Generation API', () => {
    describe('QuizGenerationRequest', () => {
      it('should accept valid quiz generation request', () => {
        const validRequest: QuizGenerationRequest = {
          text: 'The capital of France is Paris, a beautiful European city.',
          options: {
            questionCount: 5,
            difficulty: 'medium',
            questionTypes: ['multiple-choice', 'true-false'],
            subject: 'Geography',
            language: 'en',
          },
          metadata: {
            userId: 'user123',
            sessionId: 'session456',
            source: 'web-app',
          },
        };

        expect(validRequest).toBeDefined();
        expect(validRequest.text).toBe('The capital of France is Paris, a beautiful European city.');
        expect(validRequest.options.questionCount).toBe(5);
        expect(validRequest.options.difficulty).toBe('medium');
      });

      it('should handle minimal request configuration', () => {
        const minimalRequest: QuizGenerationRequest = {
          text: 'Simple text for quiz generation',
          options: {},
        };

        expect(minimalRequest.text).toBeDefined();
        expect(minimalRequest.options).toEqual({});
      });

      it('should support all question types', () => {
        const questionTypes = ['multiple-choice', 'true-false', 'fill-blank', 'short-answer'] as const;
        
        questionTypes.forEach(type => {
          const request: QuizGenerationRequest = {
            text: 'Test text',
            options: {
              questionTypes: [type],
            },
          };
          expect(request.options.questionTypes).toContain(type);
        });
      });

      it('should support all difficulty levels', () => {
        const difficulties = ['easy', 'medium', 'hard'] as const;
        
        difficulties.forEach(difficulty => {
          const request: QuizGenerationRequest = {
            text: 'Test text',
            options: {
              difficulty,
            },
          };
          expect(request.options.difficulty).toBe(difficulty);
        });
      });
    });

    describe('QuizGenerationResponse', () => {
      it('should accept valid quiz generation response', () => {
        const validResponse: QuizGenerationResponse = {
          success: true,
          quizId: 'quiz-123',
          questions: mockGeneratedQuestions,
          metadata: {
            processingTime: 1500,
            modelUsed: 'gpt-4',
            confidence: 0.92,
            wordCount: 250,
            estimatedDifficulty: 'medium',
          },
          analytics: {
            textComplexity: 0.7,
            vocabularyLevel: 'intermediate',
            topicCategories: ['geography', 'education'],
          },
        };

        expect(validResponse).toBeDefined();
        expect(validResponse.success).toBe(true);
        expect(validResponse.questions.length).toBe(2);
        expect(validResponse.metadata.processingTime).toBe(1500);
        expect(validResponse.analytics?.textComplexity).toBe(0.7);
      });

      it('should handle failed response', () => {
        const failedResponse: QuizGenerationResponse = {
          success: false,
          quizId: '',
          questions: [],
          metadata: {
            processingTime: 100,
            modelUsed: 'gpt-4',
            confidence: 0.1,
            wordCount: 50,
            estimatedDifficulty: 'unknown',
          },
        };

        expect(failedResponse.success).toBe(false);
        expect(failedResponse.questions).toEqual([]);
        expect(failedResponse.metadata.confidence).toBeLessThan(0.5);
      });
    });

    describe('GeneratedQuestion', () => {
      it('should validate question structure', () => {
        const question: GeneratedQuestion = {
          id: 'test-q1',
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 1,
          explanation: 'Test explanation',
          difficulty: 'medium',
          category: 'Test',
          confidence: 0.85,
          tags: ['test', 'example'],
        };

        expect(question.id).toBe('test-q1');
        expect(question.options.length).toBe(4);
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(question.options.length);
        expect(question.confidence).toBeGreaterThan(0);
        expect(question.confidence).toBeLessThanOrEqual(1);
      });

      it('should handle question without optional fields', () => {
        const minimalQuestion: GeneratedQuestion = {
          id: 'minimal-q1',
          question: 'Minimal question?',
          options: ['A', 'B'],
          correctAnswer: 0,
          difficulty: 'easy',
          confidence: 0.9,
        };

        expect(minimalQuestion.explanation).toBeUndefined();
        expect(minimalQuestion.category).toBeUndefined();
        expect(minimalQuestion.tags).toBeUndefined();
      });
    });
  });

  describe('User Progress API', () => {
    describe('UserProgressRequest', () => {
      it('should accept valid progress request', () => {
        const validRequest: UserProgressRequest = {
          quizId: 'quiz-123',
          answers: [
            {
              questionId: 'q1',
              selectedAnswer: 2,
              timeSpent: 30,
              confidence: 0.8,
            },
            {
              questionId: 'q2',
              selectedAnswer: 1,
              timeSpent: 15,
            },
          ],
          timeSpent: 120,
          completed: true,
        };

        expect(validRequest).toBeDefined();
        expect(validRequest.quizId).toBe('quiz-123');
        expect(validRequest.answers.length).toBe(2);
        expect(validRequest.completed).toBe(true);
      });

      it('should handle in-progress quiz', () => {
        const inProgressRequest: UserProgressRequest = {
          quizId: 'quiz-456',
          answers: [
            {
              questionId: 'q1',
              selectedAnswer: 0,
              timeSpent: 45,
            },
          ],
          timeSpent: 45,
          completed: false,
        };

        expect(inProgressRequest.completed).toBe(false);
        expect(inProgressRequest.answers.length).toBe(1);
      });
    });

    describe('UserProgressResponse', () => {
      it('should accept valid progress response', () => {
        const validResponse: UserProgressResponse = {
          success: true,
          results: {
            score: 85,
            totalQuestions: 10,
            correctAnswers: 8,
            accuracy: 80,
            timeSpent: 300,
          },
          detailedResults: [
            {
              questionId: 'q1',
              correct: true,
              selectedAnswer: 2,
              correctAnswer: 2,
              explanation: 'Correct!',
              timeSpent: 30,
            },
          ],
          recommendations: [
            {
              type: 'review',
              topic: 'Geography',
              reason: 'Mixed performance on geography questions',
              suggestedActions: ['Review capital cities', 'Practice map reading'],
            },
          ],
        };

        expect(validResponse).toBeDefined();
        expect(validResponse.success).toBe(true);
        expect(validResponse.results.score).toBe(85);
        expect(validResponse.results.accuracy).toBe(80);
        expect(validResponse.recommendations?.length).toBe(1);
      });
    });
  });

  describe('User History API', () => {
    describe('UserHistoryRequest', () => {
      it('should accept valid history request', () => {
        const validRequest: UserHistoryRequest = {
          userId: 'user-123',
          pagination: {
            page: 1,
            limit: 10,
          },
          filters: {
            dateRange: {
              start: new Date('2024-01-01'),
              end: new Date('2024-12-31'),
            },
            difficulty: ['easy', 'medium'],
            subject: ['Mathematics'],
            completed: true,
          },
          sortBy: 'date',
          sortOrder: 'desc',
        };

        expect(validRequest).toBeDefined();
        expect(validRequest.userId).toBe('user-123');
        expect(validRequest.pagination?.page).toBe(1);
        expect(validRequest.filters?.difficulty).toContain('easy');
        expect(validRequest.sortBy).toBe('date');
      });

      it('should handle minimal history request', () => {
        const minimalRequest: UserHistoryRequest = {
          userId: 'user-456',
        };

        expect(minimalRequest.userId).toBeDefined();
        expect(minimalRequest.pagination).toBeUndefined();
        expect(minimalRequest.filters).toBeUndefined();
      });
    });

    describe('UserHistoryResponse', () => {
      it('should accept valid history response', () => {
        const validResponse: UserHistoryResponse = {
          success: true,
          history: [
            {
              id: 'history-1',
              title: 'Geography Quiz',
              createdAt: new Date(),
              completedAt: new Date(),
              questionsTotal: 10,
              questionsAnswered: 10,
              accuracy: 85,
              score: 85,
              timeSpent: 300,
              difficulty: 'medium',
              subject: 'Geography',
              status: 'completed',
              tags: ['geography', 'capitals'],
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 5,
            totalItems: 50,
            hasNext: true,
            hasPrevious: false,
          },
          statistics: {
            totalQuizzes: 25,
            totalQuestions: 250,
            averageAccuracy: 78,
            totalTimeSpent: 3600,
            streakCurrent: 3,
            streakLongest: 7,
            preferredDifficulty: 'medium',
            mostStudiedSubjects: [
              {
                subject: 'Geography',
                quizCount: 8,
                averageScore: 82,
                totalTimeSpent: 1200,
              },
            ],
            recentActivity: [
              {
                date: new Date(),
                quizzes: 3,
                accuracy: 85,
                timeSpent: 450,
              },
            ],
            achievements: [
              {
                id: 'achievement-1',
                title: 'Quiz Master',
                description: 'Complete 25 quizzes',
                icon: '🏆',
                unlockedAt: new Date(),
                rarity: 'rare',
              },
            ],
          },
        };

        expect(validResponse).toBeDefined();
        expect(validResponse.success).toBe(true);
        expect(validResponse.history.length).toBe(1);
        expect(validResponse.pagination.totalItems).toBe(50);
        expect(validResponse.statistics.totalQuizzes).toBe(25);
      });
    });
  });

  describe('Authentication API', () => {
    describe('LoginRequest', () => {
      it('should accept valid login request', () => {
        const validRequest: LoginRequest = {
          email: 'test@example.com',
          password: 'securepassword123',
          rememberMe: true,
          deviceInfo: {
            userAgent: 'Mozilla/5.0...',
            platform: 'Web',
            screenResolution: '1920x1080',
            timezone: 'UTC',
          },
        };

        expect(validRequest).toBeDefined();
        expect(validRequest.email).toBe('test@example.com');
        expect(validRequest.rememberMe).toBe(true);
      });

      it('should handle minimal login request', () => {
        const minimalRequest: LoginRequest = {
          email: 'user@example.com',
          password: 'password123',
        };

        expect(minimalRequest.email).toBeDefined();
        expect(minimalRequest.password).toBeDefined();
        expect(minimalRequest.rememberMe).toBeUndefined();
      });
    });

    describe('LoginResponse', () => {
      it('should accept valid login response', () => {
        const validResponse: LoginResponse = {
          success: true,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            joinedAt: new Date(),
            lastActive: new Date(),
            emailVerified: true,
            accountStatus: 'active',
          },
          session: {
            sessionId: 'session-123',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            refreshToken: 'refresh-token',
            permissions: ['read', 'write'],
          },
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC',
            notifications: {
              email: true,
              push: false,
              achievements: true,
              reminders: true,
              marketing: false,
            },
            accessibility: {
              reduceMotion: false,
              highContrast: false,
              largeText: false,
              screenReader: false,
            },
            privacy: {
              profileVisibility: 'public',
              analyticsOptOut: false,
              dataExportRequested: false,
            },
          },
          firstLogin: false,
        };

        expect(validResponse).toBeDefined();
        expect(validResponse.success).toBe(true);
        expect(validResponse.user.email).toBe('test@example.com');
        expect(validResponse.session.sessionId).toBe('session-123');
        expect(validResponse.preferences.theme).toBe('dark');
      });
    });

    describe('SignupRequest', () => {
      it('should accept valid signup request', () => {
        const validRequest: SignupRequest = {
          email: 'newuser@example.com',
          password: 'securepassword123',
          name: 'New User',
          acceptTerms: true,
          preferences: {
            theme: 'light',
            language: 'en',
          },
          referralCode: 'FRIEND123',
        };

        expect(validRequest).toBeDefined();
        expect(validRequest.email).toBe('newuser@example.com');
        expect(validRequest.acceptTerms).toBe(true);
        expect(validRequest.referralCode).toBe('FRIEND123');
      });
    });
  });

  describe('Error Handling Contracts', () => {
    describe('APIError', () => {
      it('should accept valid error structure', () => {
        const validError: APIError = {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {
            field: 'email',
            errors: ['Invalid email format'],
          },
          timestamp: new Date(),
          requestId: 'req-123',
          severity: 'medium',
        };

        expect(validError).toBeDefined();
        expect(validError.code).toBe('VALIDATION_ERROR');
        expect(validError.severity).toBe('medium');
        expect(validError.details?.field).toBe('email');
      });

      it('should handle minimal error structure', () => {
        const minimalError: APIError = {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          timestamp: new Date(),
          requestId: 'req-456',
          severity: 'high',
        };

        expect(minimalError.details).toBeUndefined();
      });
    });

    describe('APIResponse', () => {
      it('should handle successful response', () => {
        const successResponse: APIResponse<{ data: string }> = {
          success: true,
          data: { data: 'test data' },
          metadata: {
            timestamp: new Date(),
            requestId: 'req-789',
            version: '1.0.0',
            processingTime: 150,
          },
        };

        expect(successResponse.success).toBe(true);
        expect(successResponse.data?.data).toBe('test data');
      });

      it('should handle error response', () => {
        const errorResponse: APIResponse = {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication failed',
            timestamp: new Date(),
            requestId: 'req-999',
            severity: 'high',
          },
          validationErrors: [
            {
              field: 'email',
              message: 'Email is required',
              code: 'REQUIRED_FIELD',
            },
          ],
        };

        expect(errorResponse.success).toBe(false);
        expect(errorResponse.error?.code).toBe('AUTH_ERROR');
        expect(errorResponse.validationErrors?.length).toBe(1);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete quiz flow', () => {
      // Quiz generation
      const quizRequest: QuizGenerationRequest = {
        text: 'Test content for quiz generation',
        options: { questionCount: 5 },
      };

      const quizResponse: QuizGenerationResponse = {
        success: true,
        quizId: 'flow-quiz-123',
        questions: mockGeneratedQuestions,
        metadata: {
          processingTime: 1000,
          modelUsed: 'test-model',
          confidence: 0.9,
          wordCount: 100,
          estimatedDifficulty: 'medium',
        },
      };

      // User progress
      const progressRequest: UserProgressRequest = {
        quizId: quizResponse.quizId,
        answers: quizResponse.questions.map(q => ({
          questionId: q.id,
          selectedAnswer: q.correctAnswer,
          timeSpent: 30,
        })),
        timeSpent: 150,
        completed: true,
      };

      const progressResponse: UserProgressResponse = {
        success: true,
        results: {
          score: 100,
          totalQuestions: quizResponse.questions.length,
          correctAnswers: quizResponse.questions.length,
          accuracy: 100,
          timeSpent: 150,
        },
        detailedResults: [],
      };

      expect(quizRequest.options.questionCount).toBe(5);
      expect(quizResponse.questions.length).toBe(2);
      expect(progressRequest.quizId).toBe(quizResponse.quizId);
      expect(progressResponse.results.score).toBe(100);
    });

    it('should handle authentication flow', () => {
      const signupRequest: SignupRequest = {
        email: 'flow@example.com',
        password: 'password123',
        name: 'Flow User',
        acceptTerms: true,
      };

      const signupResponse: LoginResponse = {
        success: true,
        user: {
          id: 'flow-user-123',
          email: signupRequest.email,
          name: signupRequest.name,
          joinedAt: new Date(),
          lastActive: new Date(),
          emailVerified: false,
          accountStatus: 'active',
        },
        session: {
          sessionId: 'flow-session-123',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          permissions: ['read'],
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: false,
            achievements: true,
            reminders: true,
            marketing: false,
          },
          accessibility: {
            reduceMotion: false,
            highContrast: false,
            largeText: false,
            screenReader: false,
          },
          privacy: {
            profileVisibility: 'private',
            analyticsOptOut: false,
            dataExportRequested: false,
          },
        },
        verificationRequired: true,
      };

      const loginRequest: LoginRequest = {
        email: signupRequest.email,
        password: signupRequest.password,
      };

      expect(signupRequest.acceptTerms).toBe(true);
      expect(signupResponse.user.email).toBe(signupRequest.email);
      expect(signupResponse.verificationRequired).toBe(true);
      expect(loginRequest.email).toBe(signupRequest.email);
    });
  });
});