/**
 * TOTP Authenticator App-Based MFA
 *
 * Implements Time-based One-Time Password (TOTP) authentication.
 * Uses authenticator apps like Google Authenticator, Authy, Microsoft Authenticator.
 *
 * Security Benefits:
 * - Phishing resistant (codes change every 30 seconds)
 * - No SMS interception risk
 * - Works offline
 * - 40.8% more effective than SMS MFA (Microsoft research)
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');

class TotpMfaAuth {
  constructor() {
    this.users = new Map();
    this.loginAttempts = new Map();
    this.lockoutThreshold = 5;
    this.lockoutDuration = 15 * 60 * 1000;
  }

  /**
   * Register a new user with TOTP MFA
   */
  async register(username, password) {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `MFA-Comparison:${username}`,
      length: 32
    });

    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      totpSecret: secret.base32,
      totpQrCode: secret.otpauth_url,
      createdAt: new Date(),
      isLocked: false,
      lockoutUntil: null,
      mfaEnabled: true
    };

    this.users.set(username, user);

    return {
      id: user.id,
      username: user.username,
      mfaEnabled: true,
      totpSecret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }

  /**
   * Login with password and TOTP code
   */
  async login(username, password, totpCode) {
    const user = this.users.get(username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check account lockout
    if (user.isLocked) {
      if (user.lockoutUntil && new Date() < user.lockoutUntil) {
        const remainingTime = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
        throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
      } else {
        user.isLocked = false;
        user.lockoutUntil = null;
        this.loginAttempts.delete(username);
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.trackFailedAttempt(username, user);
      throw new Error('Invalid credentials');
    }

    // Verify TOTP code
    const isTotpValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1 // Allow 1 time step before/after for clock drift
    });

    if (!isTotpValid) {
      this.trackFailedAttempt(username, user);
      throw new Error('Invalid authentication code');
    }

    // Reset failed attempts on successful login
    this.loginAttempts.delete(username);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      authMethod: 'totp-mfa',
      timestamp: new Date()
    };
  }

  /**
   * Generate current TOTP code (for testing purposes)
   */
  generateCurrentCode(username) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    return speakeasy.totp({
      secret: user.totpSecret,
      encoding: 'base32'
    });
  }

  /**
   * Verify a TOTP code without logging in (for testing)
   */
  verifyCode(username, totpCode) {
    const user = this.users.get(username);
    if (!user) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1
    });
  }

  /**
   * Track failed login attempts
   */
  trackFailedAttempt(username, user) {
    const attempts = this.loginAttempts.get(username) || 0;
    const newAttempts = attempts + 1;
    this.loginAttempts.set(username, newAttempts);

    if (newAttempts >= this.lockoutThreshold) {
      user.isLocked = true;
      user.lockoutUntil = new Date(Date.now() + this.lockoutDuration);
      console.warn(`Account ${username} locked after ${newAttempts} failed attempts`);
    }
  }

  /**
   * Get user information
   */
  getUser(username) {
    const user = this.users.get(username);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      mfaEnabled: user.mfaEnabled,
      isLocked: user.isLocked,
      hasTotp: !!user.totpSecret
    };
  }

  /**
   * Get TOTP setup info (for setting up authenticator app)
   */
  getTotpSetup(username) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      secret: user.totpSecret,
      qrCode: user.totpQrCode,
      manualEntryKey: user.totpSecret
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalUsers = this.users.size;
    const lockedUsers = Array.from(this.users.values()).filter(u => u.isLocked).length;
    const usersWithTotp = Array.from(this.users.values()).filter(u => u.totpSecret).length;

    return {
      totalUsers,
      lockedUsers,
      usersWithTotp,
      authMethod: 'totp-mfa',
      securityLevel: 'high',
      advantages: [
        'Phishing resistant',
        'No SMS interception',
        'Works offline',
        '40.8% more effective than SMS (Microsoft research)'
      ]
    };
  }

  /**
   * Reset user account
   */
  resetUser(username) {
    const user = this.users.get(username);
    if (user) {
      user.isLocked = false;
      user.lockoutUntil = null;
      this.loginAttempts.delete(username);
    }
  }

  /**
   * Disable MFA for user (for testing)
   */
  disableMfa(username) {
    const user = this.users.get(username);
    if (user) {
      user.mfaEnabled = false;
    }
  }

  /**
   * Re-enable MFA for user
   */
  enableMfa(username) {
    const user = this.users.get(username);
    if (user && user.totpSecret) {
      user.mfaEnabled = true;
    }
  }
}

module.exports = TotpMfaAuth;
