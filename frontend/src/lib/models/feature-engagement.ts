/**
 * FeatureEngagement Model Service
 * Handles section engagement tracking data operations with Appwrite
 */

import { ID, Models } from 'appwrite';
import { databases } from '@/lib/appwrite';
import type { FeatureEngagement, EngagementType, SectionName, ValidationResult } from '@/types/analytics';

const DATABASE_ID = 'default';
const COLLECTION_ID = 'feature_engagement';

export class FeatureEngagementService {
  /**
   * Create a new feature engagement record
   */
  static async create(data: Omit<FeatureEngagement, 'id' | 'createdAt'>): Promise<FeatureEngagement> {
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
          sectionName: data.sectionName,
          engagementType: data.engagementType,
          duration: data.duration.toString(),
          scrollDepth: data.scrollDepth.toString(),
          interactions: data.interactions.toString(),
          timestamp: data.timestamp,
          createdAt: new Date().toISOString()
        }
      );

      return this.fromDocument(document);
    } catch (error) {
      console.error('Failed to create feature engagement:', error);
      throw new Error('Failed to save feature engagement');
    }
  }

  /**
   * Get engagement data by session ID
   */
  static async getBySessionId(sessionId: string): Promise<FeatureEngagement[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `sessionId="${sessionId}"`,
          `timestamp:asc`
        ]
      );

      return response.documents.map(doc => this.fromDocument(doc));
    } catch (error) {
      console.error('Failed to get engagement by session ID:', error);
      throw new Error('Failed to retrieve engagement data');
    }
  }

  /**
   * Get section performance analytics
   */
  static async getSectionAnalytics(
    dateFrom: string,
    dateTo: string
  ): Promise<Array<{
    sectionName: SectionName;
    totalViews: number;
    viewRate: number;
    averageDuration: number;
    averageScrollDepth: number;
    interactionRate: number;
    avgInteractionsPerView: number;
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

      const engagements = response.documents.map(doc => this.fromDocument(doc));
      
      // Group by section
      const sectionGroups = engagements.reduce((acc, engagement) => {
        if (!acc[engagement.sectionName]) {
          acc[engagement.sectionName] = {
            views: [],
            interactions: [],
            durations: [],
            scrollDepths: []
          };
        }

        acc[engagement.sectionName].views.push(engagement);
        acc[engagement.sectionName].durations.push(engagement.duration);
        acc[engagement.sectionName].scrollDepths.push(engagement.scrollDepth);
        
        if (engagement.interactions > 0) {
          acc[engagement.sectionName].interactions.push(engagement);
        }

        return acc;
      }, {} as Record<SectionName, {
        views: FeatureEngagement[];
        interactions: FeatureEngagement[];
        durations: number[];
        scrollDepths: number[];
      }>);

      // Get unique sessions for view rate calculation
      const uniqueSessions = new Set(engagements.map(e => e.sessionId)).size;

      return Object.entries(sectionGroups).map(([sectionName, data]) => {
        const totalViews = data.views.length;
        const viewRate = uniqueSessions > 0 ? (totalViews / uniqueSessions) * 100 : 0;
        const averageDuration = data.durations.length > 0
          ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length
          : 0;
        const averageScrollDepth = data.scrollDepths.length > 0
          ? data.scrollDepths.reduce((sum, d) => sum + d, 0) / data.scrollDepths.length
          : 0;
        const interactionRate = totalViews > 0 ? (data.interactions.length / totalViews) * 100 : 0;
        const avgInteractionsPerView = totalViews > 0
          ? data.views.reduce((sum, v) => sum + v.interactions, 0) / totalViews
          : 0;

        return {
          sectionName: sectionName as SectionName,
          totalViews,
          viewRate: Math.round(viewRate * 100) / 100,
          averageDuration: Math.round(averageDuration),
          averageScrollDepth: Math.round(averageScrollDepth * 100) / 100,
          interactionRate: Math.round(interactionRate * 100) / 100,
          avgInteractionsPerView: Math.round(avgInteractionsPerView * 100) / 100
        };
      }).sort((a, b) => b.viewRate - a.viewRate);
    } catch (error) {
      console.error('Failed to get section analytics:', error);
      throw new Error('Failed to retrieve section analytics');
    }
  }

  /**
   * Get user journey flow
   */
  static async getUserJourneyFlow(
    dateFrom: string,
    dateTo: string
  ): Promise<Array<{
    fromSection: SectionName | 'entry';
    toSection: SectionName | 'exit';
    count: number;
    percentage: number;
  }>> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          `timestamp>="${dateFrom}"`,
          `timestamp<="${dateTo}"`,
          `timestamp:asc`
        ]
      );

      const engagements = response.documents.map(doc => this.fromDocument(doc));

      // Group by session and sort by timestamp
      const sessionJourneys = engagements.reduce((acc, engagement) => {
        if (!acc[engagement.sessionId]) {
          acc[engagement.sessionId] = [];
        }
        acc[engagement.sessionId].push(engagement);
        return acc;
      }, {} as Record<string, FeatureEngagement[]>);

      // Build transitions
      const transitions: Record<string, number> = {};
      let totalTransitions = 0;

      Object.values(sessionJourneys).forEach(journey => {
        // Sort by timestamp to get correct order
        journey.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Entry transition
        if (journey.length > 0) {
          const entryKey = `entry -> ${journey[0].sectionName}`;
          transitions[entryKey] = (transitions[entryKey] || 0) + 1;
          totalTransitions++;
        }

        // Section-to-section transitions
        for (let i = 0; i < journey.length - 1; i++) {
          const transitionKey = `${journey[i].sectionName} -> ${journey[i + 1].sectionName}`;
          transitions[transitionKey] = (transitions[transitionKey] || 0) + 1;
          totalTransitions++;
        }

        // Exit transition
        if (journey.length > 0) {
          const exitKey = `${journey[journey.length - 1].sectionName} -> exit`;
          transitions[exitKey] = (transitions[exitKey] || 0) + 1;
          totalTransitions++;
        }
      });

      return Object.entries(transitions).map(([transition, count]) => {
        const [from, to] = transition.split(' -> ');
        return {
          fromSection: from as SectionName | 'entry',
          toSection: to as SectionName | 'exit',
          count,
          percentage: totalTransitions > 0 ? (count / totalTransitions) * 100 : 0
        };
      }).sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get user journey flow:', error);
      throw new Error('Failed to retrieve user journey flow');
    }
  }

  /**
   * Get engagement heatmap data
   */
  static async getEngagementHeatmap(
    dateFrom: string,
    dateTo: string
  ): Promise<Array<{
    sectionName: SectionName;
    engagementType: EngagementType;
    count: number;
    intensity: number; // 0-100 normalized intensity
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

      const engagements = response.documents.map(doc => this.fromDocument(doc));

      // Group by section and engagement type
      const heatmapData = engagements.reduce((acc, engagement) => {
        const key = `${engagement.sectionName}|${engagement.engagementType}`;
        if (!acc[key]) {
          acc[key] = {
            sectionName: engagement.sectionName,
            engagementType: engagement.engagementType,
            count: 0
          };
        }
        acc[key].count++;
        return acc;
      }, {} as Record<string, {
        sectionName: SectionName;
        engagementType: EngagementType;
        count: number;
      }>);

      const heatmapArray = Object.values(heatmapData);
      const maxCount = Math.max(...heatmapArray.map(item => item.count));

      return heatmapArray.map(item => ({
        ...item,
        intensity: maxCount > 0 ? (item.count / maxCount) * 100 : 0
      })).sort((a, b) => b.intensity - a.intensity);
    } catch (error) {
      console.error('Failed to get engagement heatmap:', error);
      throw new Error('Failed to retrieve engagement heatmap');
    }
  }

  /**
   * Validate feature engagement data
   */
  private static validate(data: Omit<FeatureEngagement, 'id' | 'createdAt'>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Session ID validation
    if (!data.sessionId || data.sessionId.length === 0) {
      errors.push('Session ID is required');
    } else if (data.sessionId.length > 128) {
      errors.push('Session ID cannot exceed 128 characters');
    }

    // Section name validation
    const validSections = ['hero', 'features', 'testimonials', 'how-it-works', 'cta', 'footer'];
    if (!data.sectionName) {
      errors.push('Section name is required');
    } else if (!validSections.includes(data.sectionName)) {
      errors.push(`Invalid section name. Must be one of: ${validSections.join(', ')}`);
    }

    // Engagement type validation
    const validEngagementTypes = ['view', 'interact', 'complete_view'];
    if (!data.engagementType) {
      errors.push('Engagement type is required');
    } else if (!validEngagementTypes.includes(data.engagementType)) {
      errors.push(`Invalid engagement type. Must be one of: ${validEngagementTypes.join(', ')}`);
    }

    // Duration validation
    if (typeof data.duration !== 'number' || data.duration < 0) {
      errors.push('Duration must be a non-negative number');
    } else if (data.duration > 300000) { // 5 minutes max
      errors.push('Duration cannot exceed 300000ms (5 minutes)');
    }

    // Scroll depth validation
    if (typeof data.scrollDepth !== 'number' || 
        data.scrollDepth < 0 || 
        data.scrollDepth > 100) {
      errors.push('Scroll depth must be a number between 0 and 100');
    }

    // Interactions validation
    if (typeof data.interactions !== 'number' || data.interactions < 0) {
      errors.push('Interactions must be a non-negative number');
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

    // Behavioral warnings
    if (data.duration < 1000 && data.engagementType === 'view') {
      warnings.push('Very short view duration (< 1 second)');
    }
    if (data.scrollDepth > 90 && data.engagementType !== 'complete_view') {
      warnings.push('High scroll depth without complete_view engagement');
    }
    if (data.interactions > 10) {
      warnings.push('Unusually high interaction count');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Convert Appwrite document to FeatureEngagement
   */
  private static fromDocument(document: Models.Document): FeatureEngagement {
    return {
      id: document.$id,
      sessionId: document.sessionId,
      sectionName: document.sectionName as SectionName,
      engagementType: document.engagementType as EngagementType,
      duration: parseInt(document.duration),
      scrollDepth: parseFloat(document.scrollDepth),
      interactions: parseInt(document.interactions),
      timestamp: document.timestamp,
      createdAt: document.createdAt
    };
  }
}

export default FeatureEngagementService;