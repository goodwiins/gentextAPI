/**
 * ConversionEvents Model Service
 * Handles conversion tracking data operations with Appwrite
 */

import { ID, Models } from 'appwrite';
import { databases } from '@/lib/appwrite';
import type { ConversionEvent, ConversionEventData, ConversionType, SectionName, ValidationResult } from '@/types/analytics';

const DATABASE_ID = 'default';
const COLLECTION_ID = 'conversion_events';

export class ConversionEventsService {
  /**
   * Create a new conversion event record
   */
  static async create(data: Omit<ConversionEvent, 'id' | 'createdAt'>): Promise<ConversionEvent> {
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
          eventType: data.eventType,
          eventData: JSON.stringify(data.eventData),
          timestamp: data.timestamp,
          successful: data.successful.toString(),
          errorMessage: data.errorMessage || null,
          createdAt: new Date().toISOString()
        }
      );

      return this.fromDocument(document);
    } catch (error) {
      console.error('Failed to create conversion event:', error);
      throw new Error('Failed to save conversion event');
    }
  }

  /**
   * Get conversion events by session ID
   */
  static async getBySessionId(sessionId: string): Promise<ConversionEvent[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `sessionId="${sessionId}"`,
          `timestamp:desc`
        ]
      );

      return response.documents.map(doc => this.fromDocument(doc));
    } catch (error) {
      console.error('Failed to get conversion events by session ID:', error);
      throw new Error('Failed to retrieve conversion events');
    }
  }

  /**
   * Get conversion events by user ID
   */
  static async getByUserId(userId: string, limit = 50): Promise<ConversionEvent[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `userId="${userId}"`,
          `timestamp:desc`
        ]
      );

      return response.documents
        .slice(0, limit)
        .map(doc => this.fromDocument(doc));
    } catch (error) {
      console.error('Failed to get conversion events by user ID:', error);
      throw new Error('Failed to retrieve user conversion events');
    }
  }

  /**
   * Get conversion funnel data for date range
   */
  static async getConversionFunnel(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    totalEvents: number;
    successfulConversions: number;
    conversionRate: number;
    eventBreakdown: Array<{
      eventType: ConversionType;
      count: number;
      successRate: number;
    }>;
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

      const events = response.documents.map(doc => this.fromDocument(doc));
      const totalEvents = events.length;
      const successfulConversions = events.filter(e => e.successful).length;
      const conversionRate = totalEvents > 0 ? (successfulConversions / totalEvents) * 100 : 0;

      // Group by event type
      const eventGroups = events.reduce((acc, event) => {
        if (!acc[event.eventType]) {
          acc[event.eventType] = { total: 0, successful: 0 };
        }
        acc[event.eventType].total++;
        if (event.successful) {
          acc[event.eventType].successful++;
        }
        return acc;
      }, {} as Record<ConversionType, { total: number; successful: number }>);

      const eventBreakdown = Object.entries(eventGroups).map(([eventType, stats]) => ({
        eventType: eventType as ConversionType,
        count: stats.total,
        successRate: (stats.successful / stats.total) * 100
      }));

      return {
        totalEvents,
        successfulConversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        eventBreakdown
      };
    } catch (error) {
      console.error('Failed to get conversion funnel:', error);
      throw new Error('Failed to retrieve conversion funnel data');
    }
  }

  /**
   * Get top performing CTAs
   */
  static async getTopCtaPerformance(
    dateFrom: string,
    dateTo: string,
    limit = 10
  ): Promise<Array<{
    ctaText: string;
    ctaPosition: SectionName;
    clicks: number;
    conversions: number;
    conversionRate: number;
  }>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `timestamp>="${dateFrom}"`,
          `timestamp<="${dateTo}"`
        ]
      );

      const events = response.documents.map(doc => this.fromDocument(doc));

      // Group by CTA text and position
      const ctaGroups = events.reduce((acc, event) => {
        const key = `${event.eventData.ctaText}|${event.eventData.ctaPosition}`;
        if (!acc[key]) {
          acc[key] = {
            ctaText: event.eventData.ctaText,
            ctaPosition: event.eventData.ctaPosition,
            clicks: 0,
            conversions: 0
          };
        }
        acc[key].clicks++;
        if (event.successful) {
          acc[key].conversions++;
        }
        return acc;
      }, {} as Record<string, {
        ctaText: string;
        ctaPosition: SectionName;
        clicks: number;
        conversions: number;
      }>);

      return Object.values(ctaGroups)
        .map(cta => ({
          ...cta,
          conversionRate: cta.clicks > 0 ? (cta.conversions / cta.clicks) * 100 : 0
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get CTA performance:', error);
      throw new Error('Failed to retrieve CTA performance data');
    }
  }

  /**
   * Get scroll depth analysis
   */
  static async getScrollDepthAnalysis(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    averageScrollDepth: number;
    scrollDepthDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
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

      const events = response.documents.map(doc => this.fromDocument(doc));
      const scrollDepths = events.map(e => e.eventData.scrollDepth);

      const averageScrollDepth = scrollDepths.length > 0
        ? scrollDepths.reduce((sum, depth) => sum + depth, 0) / scrollDepths.length
        : 0;

      // Group by scroll depth ranges
      const ranges = [
        { min: 0, max: 25, label: '0-25%' },
        { min: 25, max: 50, label: '26-50%' },
        { min: 50, max: 75, label: '51-75%' },
        { min: 75, max: 100, label: '76-100%' }
      ];

      const scrollDepthDistribution = ranges.map(range => {
        const count = scrollDepths.filter(depth => 
          depth >= range.min && depth <= range.max
        ).length;
        const percentage = scrollDepths.length > 0 ? (count / scrollDepths.length) * 100 : 0;

        return {
          range: range.label,
          count,
          percentage: Math.round(percentage * 100) / 100
        };
      });

      return {
        averageScrollDepth: Math.round(averageScrollDepth * 100) / 100,
        scrollDepthDistribution
      };
    } catch (error) {
      console.error('Failed to get scroll depth analysis:', error);
      throw new Error('Failed to retrieve scroll depth analysis');
    }
  }

  /**
   * Validate conversion event data
   */
  private static validate(data: Omit<ConversionEvent, 'id' | 'createdAt'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Session ID validation
    if (!data.sessionId || data.sessionId.length === 0) {
      errors.push('Session ID is required');
    } else if (data.sessionId.length > 128) {
      errors.push('Session ID cannot exceed 128 characters');
    }

    // Event type validation
    const validEventTypes = ['signup_clicked', 'login_clicked', 'generate_clicked', 'learn_more_clicked', 'contact_clicked'];
    if (!data.eventType) {
      errors.push('Event type is required');
    } else if (!validEventTypes.includes(data.eventType)) {
      errors.push(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
    }

    // Event data validation
    if (!data.eventData) {
      errors.push('Event data is required');
    } else {
      if (!data.eventData.ctaText || data.eventData.ctaText.length === 0) {
        errors.push('CTA text is required');
      } else if (data.eventData.ctaText.length > 100) {
        errors.push('CTA text cannot exceed 100 characters');
      }

      const validPositions = ['hero', 'features', 'how-it-works', 'testimonials', 'footer'];
      if (!data.eventData.ctaPosition) {
        errors.push('CTA position is required');
      } else if (!validPositions.includes(data.eventData.ctaPosition)) {
        errors.push(`Invalid CTA position. Must be one of: ${validPositions.join(', ')}`);
      }

      if (typeof data.eventData.scrollDepth !== 'number' || 
          data.eventData.scrollDepth < 0 || 
          data.eventData.scrollDepth > 100) {
        errors.push('Scroll depth must be a number between 0 and 100');
      }

      if (typeof data.eventData.timeOnPage !== 'number' || data.eventData.timeOnPage < 0) {
        errors.push('Time on page must be a positive number');
      }

      // Behavioral warnings
      if (data.eventData.scrollDepth < 10) {
        warnings.push('User converted with very low scroll depth');
      }
      if (data.eventData.timeOnPage < 5000) {
        warnings.push('User converted very quickly (< 5 seconds)');
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

    // Success validation
    if (typeof data.successful !== 'boolean') {
      errors.push('Successful field must be a boolean');
    }

    // Error message validation (optional)
    if (data.errorMessage && data.errorMessage.length > 512) {
      errors.push('Error message cannot exceed 512 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert Appwrite document to ConversionEvent
   */
  private static fromDocument(document: Models.Document): ConversionEvent {
    return {
      id: document.$id,
      sessionId: document.sessionId,
      userId: document.userId,
      eventType: document.eventType as ConversionType,
      eventData: JSON.parse(document.eventData),
      timestamp: document.timestamp,
      successful: document.successful === 'true',
      errorMessage: document.errorMessage,
      createdAt: document.createdAt
    };
  }
}

export default ConversionEventsService;