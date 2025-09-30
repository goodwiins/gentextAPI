/**
 * Attack Simulation Contracts
 *
 * Defines interfaces for three attack types:
 * - Credential Stuffing
 * - Brute Force
 * - Phishing Scenarios
 */

import { AuthMethodId, LoginResult } from './auth-methods';

export type AttackType = 'credential-stuffing' | 'brute-force' | 'phishing';
export type SimulationState = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

/**
 * Base attack simulation configuration
 */
export interface AttackSimulation {
  id: string;
  type: AttackType;
  authMethod: AuthMethodId;
  config: AttackConfig;
  state: SimulationState;
  progress: AttackProgress;
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Attack configuration parameters
 */
export interface AttackConfig {
  targetAccounts: string[];         // Account IDs to attack
  credentialList?: CredentialPair[]; // For credential stuffing
  passwordList?: string[];           // For brute force
  maxAttempts?: number;              // Attack attempt limit
  rateLimit?: number;                // Attempts per second
  successRate?: number;              // Target success rate (0-1)
}

export interface CredentialPair {
  username: string;
  password: string;
}

/**
 * Real-time attack progress tracking
 */
export interface AttackProgress {
  totalAttempts: number;
  completedAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lockedAccounts: number;
  currentTarget?: string;
  estimatedTimeRemaining?: number;  // Seconds
}

/**
 * Base interface all attack simulations must implement
 */
export interface IAttackSimulator {
  /**
   * Configure the attack parameters
   */
  configure(config: AttackConfig): void;

  /**
   * Start the attack simulation
   */
  start(): Promise<void>;

  /**
   * Pause the attack simulation
   */
  pause(): void;

  /**
   * Resume a paused simulation
   */
  resume(): Promise<void>;

  /**
   * Stop and complete the simulation
   */
  stop(): Promise<AttackResult>;

  /**
   * Get current simulation state
   */
  getState(): AttackSimulation;

  /**
   * Register progress callback for real-time updates
   */
  onProgress(callback: (progress: AttackProgress) => void): void;
}

/**
 * Attack simulation result
 */
export interface AttackResult {
  simulationId: string;
  type: AttackType;
  authMethod: AuthMethodId;
  status: 'success' | 'failure' | 'partial';
  metrics: {
    totalAttempts: number;
    successfulBreaches: number;
    accountsLocked: number;
    attackSuccessRate: number;       // Percentage (0-100)
    timeToBreach: number | null;     // Seconds (null if no breach)
    attemptsBeforeLockout: number;
    averageAttemptTime: number;      // Milliseconds
  };
  timeline: AttackEvent[];
  duration: number;                   // Total simulation time (seconds)
  completedAt: Date;
}

/**
 * Individual attack event (for detailed timeline)
 */
export interface AttackEvent {
  timestamp: Date;
  type: 'attempt' | 'success' | 'failure' | 'lockout' | 'error';
  target: string;                    // Account ID
  details: string;
  attemptNumber: number;
}

/**
 * Credential stuffing specific interface
 */
export interface ICredentialStuffingSimulator extends IAttackSimulator {
  /**
   * Load credential list from array
   */
  loadCredentials(credentials: CredentialPair[]): void;

  /**
   * Get realistic success rate range
   */
  getExpectedSuccessRate(): { min: number; max: number };
}

/**
 * Brute force specific interface
 */
export interface IBruteForceSimulator extends IAttackSimulator {
  /**
   * Load common password list
   */
  loadPasswordList(passwords: string[]): void;

  /**
   * Test against specific account
   */
  testAccount(accountId: string): Promise<BruteForceResult>;
}

export interface BruteForceResult {
  accountId: string;
  cracked: boolean;
  passwordFound?: string;
  attemptsTaken: number;
  timeTaken: number;                 // Seconds
  lockoutTriggered: boolean;
}

/**
 * Phishing simulation specific interface
 */
export interface IPhishingSimulator extends IAttackSimulator {
  /**
   * Simulate phishing attempt with social engineering
   */
  simulatePhishingAttempt(accountId: string): Promise<PhishingResult>;

  /**
   * Get phishing resistance rating for auth method
   */
  getPhishingResistance(): PhishingResistance;
}

export interface PhishingResult {
  accountId: string;
  authMethod: AuthMethodId;
  phishingSuccessful: boolean;
  attackVector: string;              // How attack succeeded/failed
  userAction: string;                // Simulated user behavior
  mitigationAdvice: string[];
}

export interface PhishingResistance {
  authMethod: AuthMethodId;
  resistanceLevel: 'none' | 'low' | 'medium' | 'high' | 'complete';
  resistancePercentage: number;      // 0-100
  vulnerableScenarios: string[];
  protectedScenarios: string[];
}

/**
 * Simulation configuration builder (fluent interface)
 */
export interface ISimulationBuilder {
  setAuthMethod(method: AuthMethodId): ISimulationBuilder;
  setAttackType(type: AttackType): ISimulationBuilder;
  addTargetAccount(accountId: string): ISimulationBuilder;
  setCredentials(credentials: CredentialPair[]): ISimulationBuilder;
  setPasswords(passwords: string[]): ISimulationBuilder;
  setMaxAttempts(max: number): ISimulationBuilder;
  setRateLimit(attemptsPerSecond: number): ISimulationBuilder;
  setSuccessRate(rate: number): ISimulationBuilder;
  build(): AttackSimulation;
}

/**
 * Attack simulator factory
 */
export interface IAttackSimulatorFactory {
  createCredentialStuffingSimulator(authMethod: AuthMethodId): ICredentialStuffingSimulator;
  createBruteForceSimulator(authMethod: AuthMethodId): IBruteForceSimulator;
  createPhishingSimulator(authMethod: AuthMethodId): IPhishingSimulator;
}
