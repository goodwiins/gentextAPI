# MFA Security Comparison Project

A simulated environment to demonstrate and compare authentication security across multiple scenarios.

## Project Overview

This project evaluates the effectiveness of different Multi-Factor Authentication (MFA) methods against various attack vectors to demonstrate real-world security improvements.

### Goal
Demonstrate that MFA reduces credential-based attack success rates to below 5% (compared to baseline password-only systems), and show effectiveness differences between MFA methods.

## Authentication Methods

We test five authentication methods:

1. **Password-only (baseline)** - Traditional single-factor authentication
2. **SMS-based MFA** - One-time codes sent via text message
3. **TOTP Authenticator App MFA** - Time-based one-time passwords (Google Authenticator, Authy)
4. **Security Questions** - Knowledge-based authentication
5. **Hardware Token (FIDO2/WebAuthn)** - Phishing-resistant hardware keys

## Attack Simulations

### 1. Credential Stuffing
- Simulates automated login attempts using compromised credentials
- Mimics 0.2%-2% success rates documented in real attacks
- Tests against large-scale automated attacks

### 2. Brute Force
- Tests common passwords like "123456", "password", "qwerty"
- Demonstrates vulnerability without MFA
- Measures time-to-breach and lockout effectiveness

### 3. Phishing Scenarios
- Evaluates which MFA methods remain vulnerable to social engineering
- Compares phishing-resistant methods (FIDO2) vs vulnerable methods (SMS)
- Tests man-in-the-middle attack scenarios

## Metrics Collected

- **Attack Success Rate**: Percentage of successful breaches per authentication method
- **Time-to-Breach**: Average time required to compromise an account
- **Attempts Before Lockout**: Number of failed attempts before account protection triggers
- **Attack Complexity**: Relative difficulty and resources required for each attack type

## Expected Results

Based on industry research (Microsoft, Google, NIST):

- Password-only: ~10-20% success rate for credential stuffing
- SMS MFA: ~3-5% success rate
- TOTP Authenticator: ~0.5-1% success rate (40.8% more effective than SMS)
- Hardware Token: <0.1% success rate (nearly phishing-proof)

## Project Structure

```
mfa-security-comparison/
├── src/
│   ├── auth/           # Authentication method implementations
│   ├── attacks/        # Attack simulation modules
│   ├── metrics/        # Data collection and analysis
│   └── utils/          # Helper functions
├── tests/              # Test suites
├── docs/               # Documentation and research notes
└── README.md           # This file
```

## Success Criteria

The project will be successful if we can demonstrate:

1. ✅ MFA reduces attack success rates to below 5%
2. ✅ Clear effectiveness differences between MFA methods
3. ✅ 40.8% effectiveness gap between authenticator apps and SMS (per Microsoft research)
4. ✅ Hardware tokens provide near-complete phishing resistance

## Getting Started

```bash
# Install dependencies
npm install

# Run the test suite
npm test

# Run specific attack simulation
npm run simulate:credential-stuffing
npm run simulate:brute-force
npm run simulate:phishing

# Generate comparison report
npm run report
```

## Technology Stack

- **Backend**: Node.js/Python for attack simulations
- **Authentication**: Various MFA libraries (speakeasy, otplib, @simplewebauthn)
- **Testing**: Jest/Mocha for automated testing
- **Metrics**: Data visualization with Chart.js or D3.js

## Research References

- Microsoft Security: "MFA blocks 99.9% of account compromise attacks"
- Google: "Security keys eliminate phishing"
- NIST SP 800-63B: Digital Identity Guidelines

## License

Educational and research purposes only. Not for malicious use.

## Disclaimer

⚠️ **IMPORTANT**: This project is for educational and defensive security research only.
All attack simulations are conducted in controlled, isolated environments with explicit permission.
Do not use these techniques against real systems without authorization.
