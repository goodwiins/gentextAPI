/**
 * Password-Only Authentication (Baseline)
 *
 * Traditional single-factor authentication using only username/password.
 * This serves as the baseline for comparison against MFA methods.
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class PasswordOnlyAuth {
  constructor() {
    this.users = new Map();
    this.loginAttempts = new Map();
    this.lockoutThreshold = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Register a new user with password-only authentication
   */
  async register(username, password) {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      createdAt: new Date(),
      isLocked: false,
      lockoutUntil: null
    };

    this.users.set(username, user);
    return { id: user.id, username: user.username };
  }

  /**
   * Authenticate user with password only
   */
  async login(username, password) {
    const user = this.users.get(username);

    if (!user) {
      // Generic error to prevent username enumeration
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      if (user.lockoutUntil && new Date() < user.lockoutUntil) {
        const remainingTime = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
        throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
      } else {
        // Unlock account if lockout period has passed
        user.isLocked = false;
        user.lockoutUntil = null;
        this.loginAttempts.delete(username);
      }
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      // Track failed attempts
      this.trackFailedAttempt(username, user);
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on successful login
    this.loginAttempts.delete(username);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      authMethod: 'password-only',
      timestamp: new Date()
    };
  }

  /**
   * Track failed login attempts and apply lockout if necessary
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
   * Get user information (for testing purposes)
   */
  getUser(username) {
    const user = this.users.get(username);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      isLocked: user.isLocked,
      lockoutUntil: user.lockoutUntil
    };
  }

  /**
   * Get failed login attempts count
   */
  getFailedAttempts(username) {
    return this.loginAttempts.get(username) || 0;
  }

  /**
   * Reset user account (for testing)
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
   * Get statistics for analysis
   */
  getStats() {
    const totalUsers = this.users.size;
    const lockedUsers = Array.from(this.users.values()).filter(u => u.isLocked).length;
    const usersWithFailedAttempts = this.loginAttempts.size;

    return {
      totalUsers,
      lockedUsers,
      usersWithFailedAttempts,
      authMethod: 'password-only',
      securityLevel: 'low'
    };
  }
}

module.exports = PasswordOnlyAuth;
