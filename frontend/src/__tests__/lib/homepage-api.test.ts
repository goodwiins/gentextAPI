import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homepageApi, userStatsApi, checkApiHealth } from '@/lib/homepage-api';
import { Client, Databases } from 'appwrite';

// Mock Appwrite
vi.mock('appwrite', () => {
  const mockDatabases = {
    listDocuments: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn()
  };

  const mockClient = {
    setEndpoint: vi.fn().mockReturnThis(),
    setProject: vi.fn().mockReturnThis(),
    get: vi.fn()
  };

  return {
    Client: vi.fn(() => mockClient),
    Databases: vi.fn(() => mockDatabases)
  };
});

// Mock environment variables
const originalEnv = process.env;

describe('Homepage API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APPWRITE_ENDPOINT: 'https://test.appwrite.io',
      NEXT_PUBLIC_APPWRITE_PROJECT_ID: 'test-project-id',
      NEXT_PUBLIC_APPWRITE_DATABASE_ID: 'test-database'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('homepageApi.getConfig', () => {
    it('should return default homepage configuration', async () => {
      const response = await homepageApi.getConfig();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.sections).toHaveLength(2);
      expect(response.data?.sections[0].type).toBe('hero');
      expect(response.data?.sections[1].type).toBe('features');
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.requestId).toMatch(/^homepage-\d+$/);
    });

    it('should include proper global settings', async () => {
      const response = await homepageApi.getConfig();

      expect(response.success).toBe(true);
      expect(response.data?.globalSettings).toEqual({
        theme: 'auto',
        animations: {
          enabled: true,
          reducedMotion: false,
          duration: 300
        },
        performance: {
          lazyLoadImages: true,
          prefetchCriticalResources: true
        }
      });
    });

    it('should have responsive configuration for each section', async () => {
      const response = await homepageApi.getConfig();

      expect(response.success).toBe(true);

      response.data?.sections.forEach(section => {
        expect(section.responsiveConfig).toBeDefined();
        expect(section.responsiveConfig.mobile).toBeDefined();
        expect(section.responsiveConfig.tablet).toBeDefined();
        expect(section.responsiveConfig.desktop).toBeDefined();
      });
    });
  });

  describe('homepageApi.updateConfig', () => {
    it('should return error for admin functionality not implemented', async () => {
      const response = await homepageApi.updateConfig({});

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('ADMIN_FUNCTIONALITY_NOT_IMPLEMENTED');
      expect(response.error?.message).toBe('Admin functionality not yet implemented');
    });
  });
});

describe('User Stats API', () => {
  let mockDatabases: any;

  beforeEach(() => {
    mockDatabases = new Databases(new Client());
  });

  describe('userStatsApi.getStats', () => {
    it('should return user statistics for user with quizzes', async () => {
      const mockQuizzes = [
        {
          userId: 'user123',
          questions: JSON.stringify([
            { id: 1, question: 'What is 2+2?', answer: '4' },
            { id: 2, question: 'What is 3+3?', answer: '6' }
          ]),
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          userId: 'user123',
          questions: JSON.stringify([
            { id: 3, question: 'What is 4+4?', answer: '8' }
          ]),
          createdAt: '2024-01-16T10:00:00Z'
        }
      ];

      mockDatabases.listDocuments.mockResolvedValue({
        documents: mockQuizzes
      });

      const response = await userStatsApi.getStats('user123');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        userId: 'user123',
        quizzesCreated: 2,
        questionsGenerated: 3,
        averageQuestionsPerQuiz: 1.5,
        lastQuizDate: '2024-01-15T10:00:00.000Z', // First quiz (newer) due to orderDesc
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      expect(response.meta?.requestId).toMatch(/^user-stats-user123-\d+$/);
    });

    it('should return zero stats for user with no quizzes', async () => {
      mockDatabases.listDocuments.mockResolvedValue({
        documents: []
      });

      const response = await userStatsApi.getStats('user123');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        userId: 'user123',
        quizzesCreated: 0,
        questionsGenerated: 0,
        averageQuestionsPerQuiz: 0,
        lastQuizDate: undefined,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should handle malformed quiz data gracefully', async () => {
      const mockQuizzes = [
        {
          userId: 'user123',
          questions: 'invalid-json',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          userId: 'user123',
          questions: JSON.stringify([
            { id: 1, question: 'What is 2+2?', answer: '4' }
          ]),
          createdAt: '2024-01-16T10:00:00Z'
        }
      ];

      mockDatabases.listDocuments.mockResolvedValue({
        documents: mockQuizzes
      });

      const response = await userStatsApi.getStats('user123');

      expect(response.success).toBe(true);
      expect(response.data?.quizzesCreated).toBe(2);
      expect(response.data?.questionsGenerated).toBe(1); // Only the valid quiz's questions counted
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Database connection failed');
      apiError.name = 'AppwriteException';
      mockDatabases.listDocuments.mockRejectedValue(apiError);

      const response = await userStatsApi.getStats('user123');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('UNKNOWN_ERROR'); // Falls through to generic error
      expect(response.error?.message).toBe('Database connection failed');
    });
  });

  describe('userStatsApi.updateStats', () => {
    it('should update user statistics with new quiz', async () => {
      mockDatabases.listDocuments.mockResolvedValue({
        documents: [
          {
            userId: 'user123',
            questions: JSON.stringify([
              { id: 1, question: 'What is 2+2?', answer: '4' },
              { id: 2, question: 'What is 3+3?', answer: '6' }
            ]),
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            userId: 'user123',
            questions: JSON.stringify([
              { id: 3, question: 'What is 4+4?', answer: '8' }
            ]),
            createdAt: '2024-01-16T10:00:00Z'
          }
        ]
      });

      const response = await userStatsApi.updateStats('user123', {
        quizzesCreated: 1,
        questionsGenerated: 2
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        userId: 'user123',
        quizzesCreated: 3,
        questionsGenerated: 5,
        averageQuestionsPerQuiz: 5 / 3,
        lastQuizDate: expect.any(String),
        createdAt: expect.any(String), // New creation time for stats object
        updatedAt: expect.any(String)
      });
    });
  });
});

describe('API Health Check', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = new Client();
  });

  it('should return healthy status when API is accessible', async () => {
    mockClient.get.mockResolvedValue({});

    const result = await checkApiHealth();

    expect(result.success).toBe(true);
    expect(result.status).toBe('healthy');
  });

  it('should return unhealthy status when API is not accessible', async () => {
    mockClient.get.mockRejectedValue(new Error('Network error'));

    const result = await checkApiHealth();

    expect(result.success).toBe(false);
    expect(result.status).toBe('unhealthy');
  });
});