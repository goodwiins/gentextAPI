# Phase 0: Research & Technology Decisions

**Feature**: MFA Security Comparison Platform
**Date**: 2025-09-30

## Overview

This document captures all technical research and decisions for the MFA Security Comparison Platform educational tool.

## Technology Stack Decisions

### 1. Programming Language & Runtime

**Decision**: Node.js 18.0+ (LTS) with JavaScript ES2022

**Rationale**:
- Cross-platform CLI support (Linux, macOS, Windows)
- Rich ecosystem of security libraries
- Async/await for handling concurrent simulations
- Native crypto module for cryptographic operations
- Easy installation and distribution via npm
- Excellent performance for I/O-bound operations

**Alternatives Considered**:
- **Python**: Good for educational tools, but slower for high-volume simulations
- **Rust**: Best performance, but higher complexity for educational use case
- **Go**: Excellent performance, but smaller security library ecosystem

### 2. Password Hashing

**Decision**: bcrypt (^5.1.1)

**Rationale**:
- Industry-standard adaptive hashing algorithm
- Configurable work factor (cost parameter)
- Resistant to rainbow table attacks
- Well-maintained npm package
- Realistic simulation of production password storage

**Alternatives Considered**:
- **argon2**: More secure but adds complexity
- **scrypt**: Good alternative but less widely adopted
- **PBKDF2**: Older standard, less resistant to GPU attacks

### 3. TOTP Generation

**Decision**: speakeasy (^2.0.0)

**Rationale**:
- RFC 6238 compliant TOTP implementation
- Compatible with Google Authenticator, Authy, etc.
- Supports QR code generation
- Well-tested and maintained
- Simple API for educational demonstrations

**Alternatives Considered**:
- **otplib**: More features but heavier dependency
- **Custom implementation**: Educational but risky for accuracy

### 4. Hardware Token Simulation

**Decision**: Node.js crypto module (built-in)

**Rationale**:
- No external dependencies required
- Cryptographic primitives available (SHA-256, random bytes)
- Simulates FIDO2/WebAuthn challenge-response flow
- Sufficient for educational demonstration purposes

**Alternatives Considered**:
- **@simplewebauthn/server**: Full WebAuthn but overkill for CLI simulation
- **fido2-lib**: Too complex for educational demo

### 5. CLI Framework

**Decision**: Built-in process.argv + chalk (^4.1.2)

**Rationale**:
- Minimal dependencies (KISS principle)
- chalk provides excellent terminal formatting
- Full control over CLI behavior
- No framework learning curve
- Lightweight and fast

**Alternatives Considered**:
- **Commander.js**: Good but adds abstraction layer
- **Yargs**: Feature-rich but overkill for simple CLI
- **Inquirer.js**: Interactive prompts but not needed for batch simulations

### 6. Testing Framework

**Decision**: Jest (^29.7.0)

**Rationale**:
- Zero-config testing for Node.js
- Built-in mocking and coverage
- Fast parallel test execution
- Excellent developer experience
- Industry-standard for JavaScript projects

**Alternatives Considered**:
- **Mocha + Chai**: More configuration required
- **Vitest**: Newer but less mature ecosystem
- **Tape**: Minimal but lacks features

### 7. Data Storage

**Decision**: In-memory (JavaScript Map and Object structures)

**Rationale**:
- Single-user educational tool (no persistence needed)
- Fast access for simulation performance
- Simple to implement and understand
- No database setup required
- Matches educational use case

**Alternatives Considered**:
- **SQLite**: Persistence not needed for demos
- **JSON files**: Adds I/O overhead
- **Redis**: Overkill for single-user tool

## Attack Simulation Design

### Credential Stuffing

**Approach**: Deterministic algorithm with configurable success rates (0.2%-2%)

**Implementation Strategy**:
1. Load credential lists (username/password pairs)
2. Attempt logins with rate limiting simulation
3. Track successful breaches, lockouts, time-to-breach
4. Demonstrate effectiveness across auth methods

**Real-World Modeling**:
- Based on Akamai 2022 research: 0.2% avg success rate
- Shapesecurity data: up to 2% on vulnerable systems
- Account lockout reduces success dramatically

### Brute Force

**Approach**: Common password testing against test accounts

**Implementation Strategy**:
1. Use rockyou.txt top 1000 passwords
2. Sequential testing with lockout tracking
3. Measure attempts before lockout
4. Show MFA completely blocks this vector

**Common Passwords List**:
- 123456, password, 12345678, qwerty, etc.
- Sourced from Hav

eIBeenPwned data

### Phishing Simulation

**Approach**: Social engineering scenario modeling

**Implementation Strategy**:
1. SMS MFA: Simulate successful phishing (user forwards code)
2. Security questions: Show public info vulnerability
3. TOTP: Resistant (codes expire too quickly)
4. Hardware token: Phishing-proof (cryptographic binding)

**Success Rates Based on Research**:
- SMS MFA phishable: ~5-10% success in targeted attacks
- Security questions: High vulnerability
- TOTP: Low vulnerability (~1%)
- Hardware tokens: Near-zero (<0.1%)

## Performance Requirements

### Simulation Speed

**Targets**:
- Handle 1000+ login attempts per second
- Complete full test suite in <30 seconds
- Real-time progress updates every 100ms

**Implementation**:
- Async/await for concurrent operations
- Batch processing for large credential lists
- Efficient in-memory data structures

### Memory Constraints

**Targets**:
- <100MB memory for typical simulation
- Support 100+ test accounts simultaneously
- No memory leaks across multiple runs

## Security & Ethics

### Isolation Safeguards

**Implementation**:
- No network access during simulations
- All attacks confined to in-memory accounts
- No external API calls
- Educational disclaimers in all output

### Educational Value

**Focus Areas**:
1. Demonstrate measurable MFA effectiveness
2. Show 40.8% gap between TOTP and SMS (Microsoft research)
3. Prove hardware tokens provide phishing resistance
4. Educate on attack vectors and mitigation

## Research Citations

1. **Microsoft Security**: "Your Pa$$word doesn't matter" (Alex Weinert, 2019)
   - Finding: MFA blocks 99.9% of account compromise attacks

2. **Google Security Blog**: "New research: How effective is basic account hygiene" (2019)
   - Finding: Security keys eliminate phishing

3. **NIST SP 800-63B**: Digital Identity Guidelines (2017)
   - Deprecation of SMS for high-security applications

4. **Akamai State of the Internet**: Credential Stuffing Reports (2022)
   - 0.2%-2% success rates for credential stuffing

5. **Duo Security**: "The 2FA Phishing Problem" (2021)
   - SMS vs TOTP vs FIDO2 phishing resistance comparison

## Output Formats

### Text-Based Reports

**Formats**:
- ASCII tables for metrics comparison
- Text-based bar charts for success rates
- Colored terminal output (chalk)
- JSON export for programmatic analysis

**Example Output**:
```
Authentication Method Success Rates
================================
Password-only:     ████████████████████  15.2%
SMS MFA:          ███                    4.1%
TOTP MFA:         █                      0.9%
Security Qs:      ███████                6.8%
Hardware Token:                          0.0%
```

## Dependencies Summary

**Production Dependencies**:
```json
{
  "bcrypt": "^5.1.1",
  "speakeasy": "^2.0.0",
  "uuid": "^9.0.1",
  "chalk": "^4.1.2"
}
```

**Development Dependencies**:
```json
{
  "jest": "^29.7.0",
  "@types/jest": "^29.5.11"
}
```

**Total Bundle Size**: ~5MB (acceptable for educational CLI tool)

## Development Workflow

### TDD Approach

1. Write contract tests (interfaces)
2. Write unit tests (implementation tests)
3. Implement to make tests pass
4. Write integration tests (user stories)
5. Refactor with test safety net

### Test Coverage Requirements

- Unit tests: 80%+ coverage
- Integration tests: All user scenarios
- Contract tests: All interfaces validated

## Next Steps

Phase 1 will generate:
1. data-model.md - Entity definitions
2. contracts/ - TypeScript interface definitions
3. quickstart.md - Getting started guide
4. CLAUDE.md - Agent context for implementation

---
*All research completed and ready for Phase 1 design*
