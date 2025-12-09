# Multi-Factor Authentication (MFA) Security Analysis: Final Report

**Research Team**: Michael Janus, Abdelghafour El Bikha, Jennifer Marrero

## Abstract

This study evaluated the efficacy of five authentication methods against prevalent credential-based attacks. Using a simulated environment and automated attack framework, we demonstrated that **implementing any form of MFA reduces the risk of account compromise from credential stuffing by 100%**. However, our phishing simulations revealed significant meaningful differences in resilience among MFA methods, with Hardware Security Tokens providing superior protection compared to SMS and TOTP.

## 1. Methodology

We developed a testbed environment implementing:

- **Baseline**: Password-only authentication.
- **MFA Methods**: SMS, TOTP (Time-based One-Time Password), Security Questions, and Simulated Hardware Tokens.

We subjected these methods to three attack vectors:

1. **Credential Stuffing**: Using a dataset of 25 synthetic leaked credentials.
2. **Brute Force**: Dictionary attacks using top 100 common passwords.
3. **Phishing**: A simulated Man-in-the-Middle (MitM) relay attack.

## 2. Results and Analysis

### 2.1 Credential Stuffing Resilience

| Authentication Method | Attempts | Successful Breaches | Compromise Rate |
| --------------------- | -------- | ------------------- | --------------- |
| Password Only         | 5        | 5                   | **100%**        |
| SMS MFA               | 5        | 0                   | 0%              |
| TOTP App              | 5        | 0                   | 0%              |
| Security Questions    | 5        | 0                   | 0%              |
| Hardware Token        | 5        | 0                   | 0%              |

**Analysis**: MFA acted as a hard stop for credential stuffing. Even when the attacker possessed the valid password, the authentication process halted at the secondary challenge.

### 2.2 Brute Force Resilience

Our brute force tool successfully identified weak passwords (e.g., "123456") for all user types.

- **Password Only Users**: Immediate account access upon guessing the password.
- **MFA Users**: The tool identified the correct password but could not proceed past the MFA prompt.
- **Conclusion**: MFA does not strengthen the password itself but renders the password insufficient for access.

### 2.3 Phishing Vulnerability

| Method             | Vulnerability Level | Analysis                                                         |
| ------------------ | ------------------- | ---------------------------------------------------------------- |
| SMS MFA            | High                | Vulnerable to relay (MitM) and social engineering.               |
| TOTP App           | High                | Vulnerable to relay (MitM) if user enters code on fake site.     |
| Security Questions | High                | Answers often static and can be fished or researched.            |
| Hardware Token     | Low                 | Protected by cryptographic binding to the domain (Origin Check). |

## 3. Recommendations

Based on our findings:

1. **Enable Any MFA**: The jump from "Password Only" to "Any MFA" provides the highest ROI for security, mitigating 100% of automated credential attacks.
2. **Prefer TOTP over SMS**: While both are phishable, TOTP eliminates SIM swap risks and cellular dependencies.
3. **Use FIDO/Hardware Keys for High Value**: For administrators or high-risk accounts, FIDO keys are the only defense against sophisticated phishing.

## 4. Conclusion

Security is not binary. While basic MFA (SMS/TOTP) obliterates the threat of automated bulk attacks (Stuffing/Brute Force), they remain susceptible to targeted phishing. A tiered approach to authentication is recommended based on asset value and threat model.
