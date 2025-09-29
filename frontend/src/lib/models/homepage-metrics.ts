/**
 * HomepageMetrics Model Service
 * Handles homepage performance metrics data operations with Appwrite
 */

import { ID, Models } from 'appwrite';
import { databases } from '@/lib/appwrite';
import type { HomepageMetrics, PageViewMetrics, ViewportData, ValidationResult } from '@/types/analytics';

const DATABASE_ID = 'default';
const COLLECTION_ID = 'homepage_metrics';

export class HomepageMetricsService {
  /**
   * Create a new homepage metrics record
   */
  static async create(data: Omit<HomepageMetrics, 'id' | 'createdAt'>): Promise<HomepageMetrics> {
    const validation = this.validate(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const document = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          sessionId: data.sessionId,
          userId: data.userId || null,
          timestamp: data.timestamp,
          pageView: JSON.stringify(data.pageView),
          userAgent: data.userAgent,
          viewport: JSON.stringify(data.viewport),
          referrer: data.referrer || null,
          createdAt: new Date().toISOString()
        }
      );

      return this.fromDocument(document);
    } catch (error) {
      console.error('Failed to create homepage metrics:', error);
      throw new Error('Failed to save homepage metrics');
    }
  }

  /**
   * Get metrics by session ID
   */
  static async getBySessionId(sessionId: string): Promise<HomepageMetrics[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `sessionId="${sessionId}"`
        ]
      );

      return response.documents.map(doc => this.fromDocument(doc));
    } catch (error) {
      console.error('Failed to get metrics by session ID:', error);
      throw new Error('Failed to retrieve homepage metrics');
    }
  }

  /**
   * Get metrics by user ID
   */
  static async getByUserId(userId: string, limit = 50): Promise<HomepageMetrics[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `userId="${userId}"`,
          `createdAt:desc`
        ]
      );

      return response.documents
        .slice(0, limit)
        .map(doc => this.fromDocument(doc));
    } catch (error) {
      console.error('Failed to get metrics by user ID:', error);
      throw new Error('Failed to retrieve user homepage metrics');
    }
  }

  /**
   * Get aggregated performance metrics for date range
   */
  static async getAggregatedMetrics(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    totalPageViews: number;
    averageLoadTime: number;
    averageLCP: number;
    averageFCP: number;
    averageCLS: number;
    averageFID: number;
  }> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `timestamp>="${dateFrom}"`,
          `timestamp<="${dateTo}"`
        ]
      );

      const metrics = response.documents.map(doc => this.fromDocument(doc));
      
      if (metrics.length === 0) {
        return {
          totalPageViews: 0,
          averageLoadTime: 0,
          averageLCP: 0,
          averageFCP: 0,
          averageCLS: 0,
          averageFID: 0
        };
      }

      const totalLoadTime = metrics.reduce((sum, m) => sum + m.pageView.loadTime, 0);
      const totalLCP = metrics.reduce((sum, m) => sum + m.pageView.lcp, 0);
      const totalFCP = metrics.reduce((sum, m) => sum + m.pageView.fcp, 0);
      const totalCLS = metrics.reduce((sum, m) => sum + m.pageView.cls, 0);
      const totalFID = metrics.reduce((sum, m) => sum + m.pageView.fid, 0);

      const count = metrics.length;

      return {
        totalPageViews: count,
        averageLoadTime: Math.round(totalLoadTime / count),
        averageLCP: Math.round(totalLCP / count),
        averageFCP: Math.round(totalFCP / count),
        averageCLS: Math.round((totalCLS / count) * 100) / 100, // Round to 2 decimals
        averageFID: Math.round(totalFID / count)
      };
    } catch (error) {
      console.error('Failed to get aggregated metrics:', error);
      throw new Error('Failed to retrieve aggregated metrics');
    }
  }

  /**
   * Delete old metrics (data cleanup)
   */
  static async deleteOldMetrics(daysOld = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffIso = cutoffDate.toISOString();

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `createdAt<"${cutoffIso}"`
        ]
      );

      let deletedCount = 0;
      for (const doc of response.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
          deletedCount++;
        } catch (deleteError) {
          console.warn('Failed to delete document:', doc.$id, deleteError);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to delete old metrics:', error);
      throw new Error('Failed to cleanup old metrics');
    }
  }

  /**
   * Validate homepage metrics data
   */
  private static validate(data: Omit<HomepageMetrics, 'id' | 'createdAt'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Session ID validation
    if (!data.sessionId || data.sessionId.length === 0) {
      errors.push('Session ID is required');
    } else if (data.sessionId.length > 128) {
      errors.push('Session ID cannot exceed 128 characters');
    }

    // User agent validation
    if (!data.userAgent || data.userAgent.length === 0) {
      errors.push('User agent is required');
    } else if (data.userAgent.length > 512) {
      errors.push('User agent cannot exceed 512 characters');
    }

    // Page view metrics validation
    if (!data.pageView) {
      errors.push('Page view metrics are required');
    } else {
      if (data.pageView.loadTime < 0 || data.pageView.loadTime > 30000) {
        errors.push('Load time must be between 0 and 30000ms');
      }
      if (data.pageView.lcp < 0 || data.pageView.lcp > 10000) {
        errors.push('LCP must be between 0 and 10000ms');
      }
      if (data.pageView.fcp < 0 || data.pageView.fcp > 10000) {
        errors.push('FCP must be between 0 and 10000ms');
      }
      if (data.pageView.cls < 0 || data.pageView.cls > 1) {
        errors.push('CLS must be between 0 and 1');
      }
      if (data.pageView.fid < 0 || data.pageView.fid > 1000) {
        errors.push('FID must be between 0 and 1000ms');
      }

      // Performance warnings
      if (data.pageView.lcp > 2500) {
        warnings.push('LCP exceeds good performance threshold (2.5s)');
      }
      if (data.pageView.fcp > 1800) {
        warnings.push('FCP exceeds good performance threshold (1.8s)');
      }
      if (data.pageView.cls > 0.1) {
        warnings.push('CLS exceeds good performance threshold (0.1)');
      }
      if (data.pageView.fid > 100) {
        warnings.push('FID exceeds good performance threshold (100ms)');
      }
    }

    // Viewport validation
    if (!data.viewport) {
      errors.push('Viewport data is required');
    } else {
      if (data.viewport.width < 320 || data.viewport.width > 5000) {
        errors.push('Viewport width must be between 320 and 5000px');
      }
      if (data.viewport.height < 240 || data.viewport.height > 5000) {
        errors.push('Viewport height must be between 240 and 5000px');
      }
    }

    // Timestamp validation
    if (!data.timestamp) {
      errors.push('Timestamp is required');
    } else {
      const timestamp = new Date(data.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }

    // Optional field validation
    if (data.referrer && data.referrer.length > 512) {
      errors.push('Referrer cannot exceed 512 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert Appwrite document to HomepageMetrics
   */
  private static fromDocument(document: Models.Document): HomepageMetrics {
    return {
      id: document.$id,
      sessionId: document.sessionId,
      userId: document.userId,
      timestamp: document.timestamp,
      pageView: JSON.parse(document.pageView),
      userAgent: document.userAgent,
      viewport: JSON.parse(document.viewport),
      referrer: document.referrer,
      createdAt: document.createdAt
    };
  }
}

export default HomepageMetricsService;