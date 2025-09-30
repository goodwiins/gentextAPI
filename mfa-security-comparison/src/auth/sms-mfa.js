/**
 * SMS-Based MFA Authentication
 *
 * Implements SMS-based two-factor authentication.
 * Users receive a 6-digit code via SMS after password authentication.
 *
 * Security Notes:
 * - Vulnerable to SIM swapping attacks
 * - Susceptible to SMS interception
 * - NIST deprecates SMS for high-security applications
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class SmsMfaAuth {
  constructor() {
    this.users = new Map();
    this.loginAttempts = new Map();
    this.pendingSessions = new Map();
    this.smsCodes = new Map();
    this.lockoutThreshold = 5;
    this.lockoutDuration = 15 * 60 * 1000;
    this.codeExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Register a new user with SMS MFA
   */
  async register(username, password, phoneNumber) {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      phoneNumber,
      createdAt: new Date(),
      isLocked: false,
      lockoutUntil: null,
      mfaEnabled: true
    };

    this.users.set(username, user);
    return { id: user.id, username: user.username, mfaEnabled: true };
  }

  /**
   * Step 1: Verify password and send SMS code
   */
  async loginStep1(username, password) {
    const user = this.users.get(username);

    if (!user) {
      throw new Error('Invalid credentials');
    }

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
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      this.trackFailedAttempt(username, user);
      throw new Error('Invalid credentials');
    }

    // Generate and "send" SMS code
    const smsCode = this.generateSmsCode();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + this.codeExpiry);

    this.pendingSessions.set(sessionId, {
      username,
      createdAt: new Date(),
      expiresAt
    });

    this.smsCodes.set(sessionId, {
      code: smsCode,
      expiresAt,
      attempts: 0
    });

    // In a real system, this would send an actual SMS
    console.log(`[SIMULATED SMS] Code for ${username}: ${smsCode}`);

    return {
      sessionId,
      message: 'SMS code sent to ' + this.maskPhoneNumber(user.phoneNumber),
      expiresIn: this.codeExpiry / 1000
    };
  }

  /**
   * Step 2: Verify SMS code
   */
  async loginStep2(sessionId, smsCode) {
    const session = this.pendingSessions.get(sessionId);
    const codeData = this.smsCodes.get(sessionId);

    if (!session || !codeData) {
      throw new Error('Invalid or expired session');
    }

    if (new Date() > session.expiresAt) {
      this.pendingSessions.delete(sessionId);
      this.smsCodes.delete(sessionId);
      throw new Error('SMS code expired');
    }

    // Track code verification attempts
    codeData.attempts++;

    if (codeData.attempts > 3) {
      this.pendingSessions.delete(sessionId);
      this.smsCodes.delete(sessionId);
      throw new Error('Too many attempts. Please request a new code');
    }

    // Verify SMS code
    if (codeData.code !== smsCode) {
      throw new Error('Invalid SMS code');
    }

    // Cleanup
    this.pendingSessions.delete(sessionId);
    this.smsCodes.delete(sessionId);
    this.loginAttempts.delete(session.username);

    const user = this.users.get(session.username);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      authMethod: 'sms-mfa',
      timestamp: new Date()
    };
  }

  /**
   * Generate a 6-digit SMS code
   */
  generateSmsCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Mask phone number for display
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return '****';
    return '***-***-' + phoneNumber.slice(-4);
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
      phoneNumber: this.maskPhoneNumber(user.phoneNumber),
      mfaEnabled: user.mfaEnabled,
      isLocked: user.isLocked
    };
  }

  /**
   * Get SMS code for testing (DO NOT use in production!)
   */
  getTestCode(sessionId) {
    const codeData = this.smsCodes.get(sessionId);
    return codeData ? codeData.code : null;
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalUsers = this.users.size;
    const lockedUsers = Array.from(this.users.values()).filter(u => u.isLocked).length;
    const activeSessions = this.pendingSessions.size;

    return {
      totalUsers,
      lockedUsers,
      activeSessions,
      authMethod: 'sms-mfa',
      securityLevel: 'medium',
      vulnerabilities: ['SIM swapping', 'SMS interception', 'Social engineering']
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
}

module.exports = SmsMfaAuth;
