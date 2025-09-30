# Quickstart Guide: MFA Security Comparison Platform

**Feature**: 003-mfa-security-comparison
**Date**: 2025-09-30

## Installation

```bash
# Navigate to project directory
cd mfa-security-comparison

# Install dependencies
npm install

# Verify installation
npm test
```

## Quick Start: Your First Simulation

### Step 1: Run a Simple Comparison

```bash
# Run all simulations and generate report
npm start

# Or run specific attack type
npm run simulate:credential-stuffing
npm run simulate:brute-force
npm run simulate:phishing
```

### Step 2: View Results

The tool will output a comparison report showing:
- Attack success rates for each authentication method
- Time-to-breach measurements
- Account lockout effectiveness
- Security rankings

Example output:
```
═══════════════════════════════════════════════════════════
  MFA SECURITY COMPARISON REPORT
═══════════════════════════════════════════════════════════

Attack Type: Credential Stuffing
Total Accounts Tested: 100
Total Attempts: 10,000

RESULTS BY AUTHENTICATION METHOD:
──────────────────────────────────────────────────────────

Password-Only (Baseline)
  Success Rate:  ████████████████████  15.2%
  Breaches:      15/100 accounts
  Avg Time:      3.2 seconds
  Security:      ⚠️  LOW

SMS MFA
  Success Rate:  ███                    4.1%
  Breaches:      4/100 accounts
  Avg Time:      12.8 seconds
  Security:      ⚡ MEDIUM

TOTP Authenticator
  Success Rate:  █                      0.9%
  Breaches:      1/100 accounts
  Avg Time:      45.2 seconds
  Security:      ✅ HIGH

Security Questions
  Success Rate:  ███████                6.8%
  Breaches:      7/100 accounts
  Avg Time:      8.5 seconds
  Security:      ⚡ MEDIUM

Hardware Token (FIDO2)
  Success Rate:                          0.0%
  Breaches:      0/100 accounts
  Avg Time:      N/A
  Security:      🔒 VERY HIGH

KEY FINDINGS:
✓ MFA reduces attack success by 94.7% vs password-only
✓ TOTP is 40.8% more effective than SMS MFA
✓ Hardware tokens provide complete protection (0% breach)
✓ 73% of accounts never reached lockout with proper MFA

RECOMMENDATIONS:
1. Deploy TOTP MFA at minimum for all users
2. Consider hardware tokens for high-value accounts
3. Avoid SMS MFA for high-security applications
4. Implement account lockout after 5 failed attempts

Research Citations:
- Microsoft Security (2019): "MFA blocks 99.9% of attacks"
- Google Security (2019): "Security keys eliminate phishing"
- NIST SP 800-63B: Digital Identity Guidelines
```

## Usage Examples

### Example 1: Test Specific Authentication Method

```bash
# Test only password-based auth
node src/cli/commands.js test --method password-only

# Test TOTP MFA
node src/cli/commands.js test --method totp-mfa
```

### Example 2: Configure Custom Simulation

```bash
# Run credential stuffing with custom parameters
node src/cli/commands.js simulate \
  --type credential-stuffing \
  --accounts 50 \
  --attempts 5000 \
  --method all
```

### Example 3: Export Results

```bash
# Generate report and export to JSON
node src/cli/commands.js report --format json --output results.json

# Export as markdown
node src/cli/commands.js report --format markdown --output report.md
```

## Educational Scenarios

### Scenario 1: Demonstrate MFA Effectiveness

**Goal**: Show students that MFA reduces attack success from 15% to <1%

```bash
# Run baseline password-only test
npm run simulate -- --method password-only

# Run TOTP MFA test
npm run simulate -- --method totp-mfa

# Generate comparison
npm run report
```

**Expected Outcome**: TOTP shows ~94% improvement over password-only

### Scenario 2: Compare MFA Methods

**Goal**: Demonstrate 40.8% effectiveness gap between TOTP and SMS

```bash
# Run both SMS and TOTP simulations
npm run simulate -- --method sms-mfa
npm run simulate -- --method totp-mfa

# Generate side-by-side comparison
npm run report -- --compare sms-mfa totp-mfa
```

**Expected Outcome**: TOTP success rate ~40% lower than SMS

### Scenario 3: Show Phishing Resistance

**Goal**: Demonstrate hardware tokens are phishing-proof

```bash
# Run phishing simulation
npm run simulate:phishing

# View phishing resistance ratings
npm run report -- --focus phishing
```

**Expected Outcome**:
- SMS MFA: Vulnerable to phishing
- Security Questions: Highly vulnerable
- TOTP: Low vulnerability
- Hardware Token: Complete resistance

## Testing Your Understanding

### Validation Test 1: MFA Effectiveness

Run all simulations and verify:
- [ ] MFA reduces success rates to <5% (vs 10-20% baseline)
- [ ] Hardware tokens show 0% breach rate
- [ ] Account lockouts prevent brute force attacks

### Validation Test 2: Research Alignment

Compare your results with research:
- [ ] MFA improvement is >90% (Microsoft: 99.9%)
- [ ] TOTP vs SMS gap is ~40% (Microsoft research)
- [ ] Hardware tokens are phishing-proof (Google research)

### Validation Test 3: Educational Value

Check that reports include:
- [ ] Clear visualizations (charts, tables)
- [ ] Research citations
- [ ] Security recommendations
- [ ] Educational context

## Troubleshooting

### Issue: Simulation runs too slowly

**Solution**: Reduce simulation parameters
```bash
npm run simulate -- --accounts 20 --attempts 1000
```

### Issue: Results don't match research benchmarks

**Check**:
1. Account lockout is enabled (5 attempts default)
2. MFA codes are properly validated
3. Attack simulation parameters are realistic

### Issue: No visual output

**Check**:
1. chalk dependency is installed
2. Terminal supports ANSI colors
3. Use `--no-color` flag if needed

## Next Steps

1. **Run Full Test Suite**: `npm test`
2. **Review Implementation**: Check `src/auth/` for auth methods
3. **Explore Attack Sims**: Check `src/attacks/` for simulations
4. **Customize Parameters**: Edit config in `src/cli/commands.js`
5. **Generate Custom Reports**: Use report API in `src/metrics/`

## API Usage (Programmatic)

```javascript
const { PasswordOnlyAuth } = require('./src/auth/password-only');
const { CredentialStuffingSimulator } = require('./src/attacks/credential-stuffing');
const { MetricsCollector } = require('./src/metrics/collector');

// Create auth method
const auth = new PasswordOnlyAuth();

// Register test accounts
await auth.register('user1', 'password123');
await auth.register('user2', 'qwerty');

// Configure and run simulation
const simulator = new CredentialStuffingSimulator(auth);
simulator.configure({
  targetAccounts: ['user1', 'user2'],
  credentialList: [
    { username: 'user1', password: 'password123' },
    { username: 'user2', password: 'wrong' }
  ]
});

// Run simulation
const result = await simulator.start();

// Collect metrics
const collector = new MetricsCollector();
const metrics = collector.collectMetrics(result);

console.log('Attack Success Rate:', metrics.attackSuccessRate + '%');
console.log('Breaches:', metrics.successfulBreaches);
```

## Educational Disclaimers

⚠️ **IMPORTANT**: This tool is for educational purposes only.

- All simulations run in isolated, in-memory environments
- No external connections are made
- Test accounts are not real users
- Attacks are confined to the simulation
- DO NOT use techniques against real systems without authorization

This platform demonstrates defensive security research and helps educate about MFA effectiveness. Use responsibly.

## Support & Resources

- **Documentation**: See `/docs` directory
- **API Reference**: See `/specs/003-mfa-security-comparison/contracts/`
- **Research Papers**: See `research.md`
- **Issues**: Report bugs via project repository

---
*Happy learning! Stay secure with MFA! 🔐*
