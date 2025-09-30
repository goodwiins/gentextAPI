/**
 * Metrics & Reporting Contracts
 *
 * Defines interfaces for:
 * - Security metrics collection
 * - Comparison reports
 * - Visual representations
 */

import { AuthMethodId, SecurityLevel } from './auth-methods';
import { AttackType, AttackResult } from './attack-sims';

/**
 * Security metrics collected from attack simulation
 */
export interface SecurityMetric {
  id: string;
  simulationId: string;
  authMethod: AuthMethodId;
  attackType: AttackType;
  metrics: {
    attackSuccessRate: number;       // Percentage (0-100)
    timeToBreach: number | null;     // Seconds (null if no breach)
    attemptsBeforeLockout: number;
    attackComplexityScore: number;   // 1-10 scale
    totalAttempts: number;
    successfulBreaches: number;
    accountsLocked: number;
    averageAttemptTime: number;      // Milliseconds
  };
  timestamp: Date;
}

/**
 * Simulation result with insights
 */
export interface SimulationResult {
  id: string;
  simulationId: string;
  authMethod: AuthMethodId;
  attackType: AttackType;
  result: 'success' | 'failure' | 'partial';
  metrics: SecurityMetric;
  insights: string[];                // Educational takeaways
  recommendations: string[];         // Security improvements
  timestamp: Date;
  duration: number;                  // Simulation duration (seconds)
}

/**
 * Comparison report aggregating multiple results
 */
export interface ComparisonReport {
  id: string;
  title: string;
  description: string;
  results: AuthMethodResult[];
  summary: ReportSummary;
  visualizations: ReportVisualizations;
  citations: string[];              // Research references
  createdAt: Date;
}

/**
 * Per-auth-method results in report
 */
export interface AuthMethodResult {
  authMethod: AuthMethodId;
  authMethodName: string;
  securityLevel: SecurityLevel;
  attackType: AttackType;
  metrics: SecurityMetric;
  rank: number;                     // 1-5 (1 = most secure)
  effectivenessRating: number;      // 0-100 (100 = perfect)
}

/**
 * Report summary with key findings
 */
export interface ReportSummary {
  mostSecure: AuthMethodId;
  leastSecure: AuthMethodId;
  mfaImprovement: number;           // % improvement over baseline
  totpVsSmsGap: number;             // TOTP vs SMS effectiveness gap
  phishingResistance: Record<AuthMethodId, number>;
  keyFindings: string[];
  recommendations: string[];
}

/**
 * Report visualizations (text-based)
 */
export interface ReportVisualizations {
  successRateChart: string;         // ASCII bar chart
  comparisonTable: string;          // Formatted table
  timelineGraph?: string;           // Optional timeline
}

/**
 * Metrics collector interface
 */
export interface IMetricsCollector {
  /**
   * Collect metrics from attack result
   */
  collectMetrics(attackResult: AttackResult): SecurityMetric;

  /**
   * Calculate attack complexity score
   */
  calculateComplexityScore(attackResult: AttackResult): number;

  /**
   * Get all collected metrics
   */
  getAllMetrics(): SecurityMetric[];

  /**
   * Get metrics by auth method
   */
  getMetricsByAuthMethod(authMethod: AuthMethodId): SecurityMetric[];

  /**
   * Get metrics by attack type
   */
  getMetricsByAttackType(attackType: AttackType): SecurityMetric[];

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void;
}

/**
 * Report generator interface
 */
export interface IReportGenerator {
  /**
   * Generate comparison report from simulation results
   */
  generateComparisonReport(results: SimulationResult[]): ComparisonReport;

  /**
   * Generate per-method summary
   */
  generateMethodSummary(authMethod: AuthMethodId, results: SimulationResult[]): AuthMethodSummary;

  /**
   * Export report to JSON
   */
  exportToJson(report: ComparisonReport): string;

  /**
   * Export report to formatted text
   */
  exportToText(report: ComparisonReport): string;
}

/**
 * Summary for individual auth method
 */
export interface AuthMethodSummary {
  authMethod: AuthMethodId;
  authMethodName: string;
  securityLevel: SecurityLevel;
  overallEffectiveness: number;     // 0-100
  strengths: string[];
  weaknesses: string[];
  attackResults: Record<AttackType, SecurityMetric>;
  rank: number;
}

/**
 * Visualizer interface (text-based charts)
 */
export interface ITextVisualizer {
  /**
   * Generate ASCII bar chart
   */
  generateBarChart(data: ChartData): string;

  /**
   * Generate comparison table
   */
  generateComparisonTable(results: AuthMethodResult[]): string;

  /**
   * Generate attack timeline
   */
  generateTimeline(events: TimelineEvent[]): string;

  /**
   * Apply color formatting (with chalk)
   */
  applyColorFormatting(text: string, level: SecurityLevel): string;
}

/**
 * Chart data for visualizations
 */
export interface ChartData {
  title: string;
  labels: string[];                  // Auth method names
  values: number[];                  // Success rates or metrics
  unit: string;                      // e.g., "%", "ms", "attempts"
  maxValue?: number;                 // Optional max for scaling
}

/**
 * Timeline event for visualization
 */
export interface TimelineEvent {
  timestamp: Date;
  authMethod: AuthMethodId;
  eventType: 'success' | 'failure' | 'lockout';
  description: string;
}

/**
 * Statistical analysis interface
 */
export interface IStatisticalAnalyzer {
  /**
   * Calculate MFA improvement over baseline
   */
  calculateMfaImprovement(passwordOnlyRate: number, mfaRate: number): number;

  /**
   * Calculate TOTP vs SMS effectiveness gap
   */
  calculateTotpSmsGap(totpRate: number, smsRate: number): number;

  /**
   * Rank auth methods by security
   */
  rankAuthMethods(results: AuthMethodResult[]): AuthMethodResult[];

  /**
   * Calculate phishing resistance scores
   */
  calculatePhishingResistance(results: SimulationResult[]): Record<AuthMethodId, number>;

  /**
   * Verify against research benchmarks
   */
  verifyAgainstBenchmarks(report: ComparisonReport): BenchmarkVerification;
}

/**
 * Benchmark verification results
 */
export interface BenchmarkVerification {
  mfaImprovementMet: boolean;        // Should be >90%
  totpSmsGapMet: boolean;            // Should be ~40.8%
  hardwareTokenEffective: boolean;   // Should be <0.1% breach
  allBenchmarksMet: boolean;
  deviations: string[];
}

/**
 * Research citations
 */
export interface ResearchCitation {
  source: string;                    // e.g., "Microsoft Security"
  title: string;
  year: number;
  url?: string;
  keyFinding: string;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'text' | 'markdown' | 'csv';

/**
 * Report export interface
 */
export interface IReportExporter {
  /**
   * Export report in specified format
   */
  export(report: ComparisonReport, format: ExportFormat): string;

  /**
   * Save report to file
   */
  saveToFile(report: ComparisonReport, filepath: string, format: ExportFormat): Promise<void>;
}
