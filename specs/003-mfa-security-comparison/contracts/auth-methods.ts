/**
 * Authentication Method Contracts
 *
 * Defines interfaces for all five authentication methods:
 * - Password-only (baseline)
 * - SMS MFA
 * - TOTP MFA (authenticator app)
 * - Security Questions
 * - Hardware Token (FIDO2/WebAuthn)
 */

export type SecurityLevel = 'low' | 'medium' | 'high' | 'very-high';

export type AuthMethodId =
  | 'password-only'
  | 'sms-mfa'
  | 'totp-mfa'
  | 'security-questions'
  | 'hardware-token';

/**
 * Base authentication method metadata
 */
export interface AuthenticationMethod {
  id: AuthMethodId;
  name: string;
  description: string;
  securityLevel: SecurityLevel;
  vulnerabilities: string[];
  strengths: string[];
  implementationClass: string;
}

/**
 * Test account credentials (varies by auth method)
 */
export interface TestAccountCredentials {
  password?: string;                    // Hashed password (all methods)
  phoneNumber?: string;                 // SMS MFA only
  totpSecret?: string;                  // TOTP MFA only
  securityAnswers?: SecurityAnswer[];   // Security questions only
  tokens?: HardwareToken[];             // Hardware token only
}

export interface SecurityAnswer {
  question: string;
  answer: string;  // Hashed answer
}

export interface HardwareToken {
  credentialId: string;
  publicKey: string;
  tokenName: string;
  registeredAt: Date;
  lastUsed: Date | null;
  useCount: number;
}

/**
 * Test account with lockout tracking
 */
export interface TestAccount {
  id: string;
  username: string;
  authMethod: AuthMethodId;
  credentials: TestAccountCredentials;
  lockout: {
    isLocked: boolean;
    lockoutUntil: Date | null;
    failedAttempts: number;
  };
  createdAt: Date;
}

/**
 * Base interface all auth methods must implement
 */
export interface IAuthMethod {
  /**
   * Register a new test account
   */
  register(username: string, credentials: any): Promise<TestAccount>;

  /**
   * Attempt login (may be multi-step for MFA)
   */
  login(username: string, credentials: any): Promise<LoginResult>;

  /**
   * Get user information (without sensitive data)
   */
  getUser(username: string): UserInfo | null;

  /**
   * Reset account lockout
   */
  resetUser(username: string): void;

  /**
   * Get statistics for analysis
   */
  getStats(): AuthMethodStats;
}

/**
 * Login result (successful or failed)
 */
export interface LoginResult {
  success: boolean;
  userId?: string;
  username?: string;
  authMethod: AuthMethodId;
  timestamp: Date;
  error?: string;
}

/**
 * Public user information (no credentials)
 */
export interface UserInfo {
  id: string;
  username: string;
  authMethod: AuthMethodId;
  mfaEnabled: boolean;
  isLocked: boolean;
  createdAt: Date;
}

/**
 * Statistics for auth method analysis
 */
export interface AuthMethodStats {
  totalUsers: number;
  lockedUsers: number;
  authMethod: AuthMethodId;
  securityLevel: SecurityLevel;
  additionalMetrics?: Record<string, any>;
}

/**
 * Password-only specific interface
 */
export interface IPasswordOnlyAuth extends IAuthMethod {
  getFailedAttempts(username: string): number;
}

/**
 * SMS MFA specific interface (two-step process)
 */
export interface ISmsMfaAuth extends IAuthMethod {
  /**
   * Step 1: Verify password, send SMS code
   */
  loginStep1(username: string, password: string): Promise<SmsSession>;

  /**
   * Step 2: Verify SMS code
   */
  loginStep2(sessionId: string, smsCode: string): Promise<LoginResult>;

  /**
   * Get test SMS code (for testing only!)
   */
  getTestCode(sessionId: string): string | null;
}

export interface SmsSession {
  sessionId: string;
  message: string;
  expiresIn: number;
}

/**
 * TOTP MFA specific interface
 */
export interface ITotpMfaAuth extends IAuthMethod {
  /**
   * Generate current TOTP code (for testing)
   */
  generateCurrentCode(username: string): string;

  /**
   * Verify TOTP code without logging in
   */
  verifyCode(username: string, totpCode: string): boolean;

  /**
   * Get TOTP setup information
   */
  getTotpSetup(username: string): TotpSetup;
}

export interface TotpSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

/**
 * Security questions specific interface
 */
export interface ISecurityQuestionsAuth extends IAuthMethod {
  /**
   * Get a random security question for user
   */
  getRandomQuestion(username: string): QuestionPrompt;

  /**
   * Get all security questions (without answers)
   */
  getUserQuestions(username: string): QuestionInfo[];

  /**
   * Update security questions
   */
  updateSecurityQuestions(username: string, newAnswers: SecurityAnswer[]): Promise<any>;
}

export interface QuestionPrompt {
  questionIndex: number;
  question: string;
}

export interface QuestionInfo {
  index: number;
  question: string;
}

/**
 * Hardware token specific interface (two-step process)
 */
export interface IHardwareTokenAuth extends IAuthMethod {
  /**
   * Register a hardware token for user
   */
  registerToken(username: string, tokenName?: string): Promise<TokenRegistration>;

  /**
   * Step 1: Verify password, generate challenge
   */
  loginStep1(username: string, password: string): Promise<TokenChallenge>;

  /**
   * Step 2: Verify token signature
   */
  loginStep2(sessionId: string, credentialId: string, signedChallenge: string): Promise<LoginResult>;

  /**
   * Simulate token signing (for testing)
   */
  signChallenge(credentialId: string, challenge: string): string;

  /**
   * Remove a hardware token
   */
  removeToken(username: string, credentialId: string): any;
}

export interface TokenRegistration {
  tokenId: string;
  credentialId: string;
  tokenName: string;
  message: string;
}

export interface TokenChallenge {
  sessionId: string;
  challenge: string;
  allowedCredentials: Array<{
    credentialId: string;
    tokenName: string;
  }>;
  expiresIn: number;
}
