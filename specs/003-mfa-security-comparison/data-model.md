# Data Model: MFA Security Comparison Platform

**Feature**: 003-mfa-security-comparison
**Date**: 2025-09-30

## Overview

This document defines all data entities, their relationships, validation rules, and state transitions for the MFA Security Comparison Platform.

## Core Entities

### 1. Authentication Method

Represents one of the five authentication approaches being compared.

**Fields**:
```typescript
{
  id: string;                    // Unique identifier (e.g., "password-only", "sms-mfa")
  name: string;                  // Display name
  description: string;           // Educational description
  securityLevel: 'low' | 'medium' | 'high' | 'very-high';
  vulnerabilities: string[];     // Known attack vectors
  strengths: string[];           // Security benefits
  implementationClass: string;   // Class name for instantiation
}
```

**Valid Values**:
- `password-only`: Baseline single-factor authentication
- `sms-mfa`: SMS-based two-factor authentication
- `totp-mfa`: Time-based one-time password (authenticator app)
- `security-questions`: Knowledge-based authentication
- `hardware-token`: FIDO2/WebAuthn hardware security key

**Validation Rules**:
- id must be one of the five predefined values
- securityLevel must match research-backed ratings
- vulnerabilities and strengths arrays must not be empty

### 2. Test Account

Represents a simulated user account for testing authentication.

**Fields**:
```typescript
{
  id: string;                    // UUID
  username: string;              // Account username
  authMethod: string;            // References AuthenticationMethod.id
  credentials: {
    password?: string;           // Hashed password (bcrypt)
    phoneNumber?: string;        // For SMS MFA (masked)
    totpSecret?: string;         // Base32 TOTP secret
    securityAnswers?: Array<{    // For security questions
      question: string;
      answer: string;            // Hashed answer
    }>;
    tokens?: Array<{             // For hardware tokens
      credentialId: string;
      publicKey: string;
      tokenName: string;
      registeredAt: Date;
    }>;
  };
  lockout: {
    isLocked: boolean;
    lockoutUntil: Date | null;
    failedAttempts: number;
  };
  createdAt: Date;
}
```

**Validation Rules**:
- username must be 3-50 characters
- credentials must match authMethod requirements
- passwords must be bcrypt hashed
- security answers must be lowercase and hashed
- lockout.failedAttempts must be 0-10
- Phone numbers must be valid format (E.164)

**State Transitions**:
```
Created → Active → Locked → Unlocked → Active
                 ↓
              Deleted
```

### 3. Attack Simulation

Represents a configured attack scenario ready to execute.

**Fields**:
```typescript
{
  id: string;                    // UUID
  type: 'credential-stuffing' | 'brute-force' | 'phishing';
  authMethod: string;            // Target authentication method
  config: {
    targetAccounts: string[];    // Account IDs to attack
    credentialList?: string[];   // For credential stuffing
    passwordList?: string[];     // For brute force
    maxAttempts?: number;        // Attack attempt limit
    rateLimit?: number;          // Attempts per second
    successRate?: number;        // Target success rate (0-1)
  };
  state: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  progress: {
    totalAttempts: number;
    completedAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    lockedAccounts: number;
  };
  startedAt: Date | null;
  completedAt: Date | null;
}
```

**Validation Rules**:
- type must be one of three attack types
- config.targetAccounts must not be empty
- config.successRate must be 0-1 (if specified)
- config.maxAttempts must be positive integer
- state transitions must follow valid flow

**State Transitions**:
```
Pending → Running → Completed
             ↓           ↑
          Paused --------┘
             ↓
          Failed
```

### 4. Security Metric

Represents measured data from an attack simulation.

**Fields**:
```typescript
{
  id: string;                    // UUID
  simulationId: string;          // References AttackSimulation.id
  authMethod: string;            // Authentication method tested
  attackType: string;            // Type of attack performed
  metrics: {
    attackSuccessRate: number;   // Percentage (0-100)
    timeToBreach: number | null; // Seconds (null if no breach)
    attemptsBeforeLockout: number;
    attackComplexityScore: number; // 1-10 scale
    totalAttempts: number;
    successfulBreaches: number;
    accountsLocked: number;
    averageAttemptTime: number;  // Milliseconds
  };
  timestamp: Date;
}
```

**Validation Rules**:
- attackSuccessRate must be 0-100
- timeToBreach must be positive or null
- attackComplexityScore must be 1-10
- All count fields must be non-negative integers

**Derived Calculations**:
- `attackSuccessRate = (successfulBreaches / totalAttempts) * 100`
- `effectivenessRating = 100 - attackSuccessRate`

### 5. Simulation Result

Represents the complete outcome of an attack simulation.

**Fields**:
```typescript
{
  id: string;                    // UUID
  simulationId: string;          // References AttackSimulation.id
  authMethod: string;            // Authentication method tested
  attackType: string;            // Attack scenario executed
  result: 'success' | 'failure' | 'partial';
  metrics: SecurityMetric;       // Embedded metric data
  insights: string[];            // Educational takeaways
  recommendations: string[];     // Security improvements
  timestamp: Date;
  duration: number;              // Simulation duration (seconds)
}
```

**Validation Rules**:
- result must reflect actual simulation outcome
- insights array must have at least one educational point
- recommendations must be actionable
- duration must be positive number

### 6. Comparison Report

Aggregates multiple simulation results for comparative analysis.

**Fields**:
```typescript
{
  id: string;                    // UUID
  title: string;                 // Report title
  description: string;           // Report purpose
  results: Array<{
    authMethod: string;
    attackType: string;
    metrics: SecurityMetric;
    rank: number;                // 1-5 (1 = most secure)
  }>;
  summary: {
    mostSecure: string;          // Best performing auth method
    leastSecure: string;         // Worst performing auth method
    mfaImprovement: number;      // Percentage improvement over baseline
    totpVsSmsGap: number;        // TOTP vs SMS effectiveness gap
    phishingResistance: Record<string, number>; // Per-method resistance
  };
  visualizations: {
    successRateChart: string;    // ASCII chart
    comparisonTable: string;     // Formatted table
  };
  citations: string[];           // Research references
  createdAt: Date;
}
```

**Validation Rules**:
- results array must have at least 2 auth methods
- ranks must be unique 1-N where N = result count
- mfaImprovement must show >90% reduction (per research)
- totpVsSmsGap should be ~40.8% (per Microsoft research)

### 7. Hardware Token (Sub-entity)

Represents a simulated FIDO2/WebAuthn security key.

**Fields**:
```typescript
{
  tokenId: string;               // UUID
  credentialId: string;          // Base64 credential identifier
  publicKey: string;             // Base64 public key
  tokenName: string;             // User-friendly name
  algorithm: 'ES256' | 'RS256';  // Signing algorithm
  registeredAt: Date;
  lastUsed: Date | null;
  useCount: number;
}
```

**Validation Rules**:
- credentialId must be unique per user
- publicKey must be valid base64
- tokenName max 50 characters
- useCount must be non-negative

### 8. Challenge-Response (Sub-entity)

Represents cryptographic challenges for hardware token auth.

**Fields**:
```typescript
{
  challengeId: string;           // UUID
  challenge: string;             // Base64 random bytes
  expectedResponse: string;      // Base64 signature
  sessionId: string;             // Links to login session
  credentialId: string;          // Expected token
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
}
```

**Validation Rules**:
- challenge must be 32+ bytes random data
- expiresAt must be 2-5 minutes after createdAt
- attempts must not exceed 3
- expired challenges cannot be used

**State Transitions**:
```
Created → Valid → Used → Archived
           ↓
        Expired
```

## Relationships

### Entity Relationship Diagram

```
Authentication Method (1) ←──── (N) Test Account
                                        ↓
                                 (1) Attack Simulation
                                        ↓
                                 (1) Security Metric
                                        ↓
                                 (1) Simulation Result
                                        ↓
                                 (N) Comparison Report

Test Account (1) ←──── (N) Hardware Token
                            ↓
                      (N) Challenge-Response
```

### Relationship Rules

1. **Authentication Method → Test Account**: One-to-Many
   - Each account has exactly one auth method
   - Auth methods can have multiple accounts

2. **Test Account → Attack Simulation**: One-to-Many
   - Accounts can be targeted by multiple simulations
   - Simulations can target multiple accounts

3. **Attack Simulation → Security Metric**: One-to-One
   - Each simulation produces one metric set

4. **Security Metric → Simulation Result**: One-to-One
   - Metrics are wrapped in results with insights

5. **Simulation Result → Comparison Report**: Many-to-Many
   - Reports aggregate multiple results
   - Results can appear in multiple reports

## Data Validation Summary

### Critical Validations

1. **Password Security**:
   - All passwords MUST be bcrypt hashed
   - Salt rounds >= 10
   - Never store plain text

2. **TOTP Secrets**:
   - Must be base32 encoded
   - 32+ character length
   - RFC 6238 compliant

3. **Hardware Token Credentials**:
   - Cryptographically random generation
   - Unique per user per token
   - Base64 encoded

4. **Metric Accuracy**:
   - Success rates must reflect actual simulation
   - Time measurements in consistent units
   - No manufactured data

### Performance Constraints

1. **In-Memory Storage**:
   - Max 1000 accounts per session
   - Max 100 active simulations
   - Results cleared after report generation

2. **Lookup Performance**:
   - Use Map for O(1) lookups
   - Index accounts by ID and username
   - Index simulations by state

## Next Steps

Phase 1 will now generate:
1. TypeScript contracts in `contracts/` directory
2. quickstart.md with usage examples
3. CLAUDE.md for agent context

---
*Data model complete and ready for contract generation*
