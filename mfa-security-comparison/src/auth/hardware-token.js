/**
 * Hardware Token (FIDO2/WebAuthn) Authentication
 *
 * Simulates FIDO2/WebAuthn hardware security key authentication.
 * Examples: YubiKey, Google Titan Key, Windows Hello
 *
 * Security Benefits:
 * - Phishing-proof (cryptographic challenge-response)
 * - No shared secrets
 * - Device-bound credentials
 * - Strongest MFA method
 * - Nearly 100% effective against automated attacks
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class HardwareTokenAuth {
  constructor() {
    this.users = new Map();
    this.registeredTokens = new Map();
    this.loginAttempts = new Map();
    this.pendingChallenges = new Map();
    this.lockoutThreshold = 5;
    this.lockoutDuration = 15 * 60 * 1000;
    this.challengeExpiry = 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Register a new user with hardware token
   */
  async register(username, password) {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      createdAt: new Date(),
      isLocked: false,
      lockoutUntil: null,
      mfaEnabled: true,
      tokens: []
    };

    this.users.set(username, user);

    return {
      id: user.id,
      username: user.username,
      mfaEnabled: true,
      message: 'User created. Please register a hardware token.'
    };
  }

  /**
   * Register a hardware token for a user
   */
  async registerToken(username, tokenName = 'Security Key') {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate token credentials
    const tokenId = uuidv4();
    const credentialId = this.generateCredentialId();
    const publicKey = this.generatePublicKey();

    const token = {
      tokenId,
      credentialId,
      publicKey,
      tokenName,
      registeredAt: new Date(),
      lastUsed: null,
      useCount: 0
    };

    user.tokens.push(token);
    this.registeredTokens.set(credentialId, {
      username,
      tokenId,
      publicKey
    });

    return {
      tokenId,
      credentialId,
      tokenName,
      message: 'Hardware token registered successfully'
    };
  }

  /**
   * Step 1: Verify password and generate challenge
   */
  async loginStep1(username, password) {
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

    if (user.tokens.length === 0) {
      throw new Error('No hardware tokens registered. Please register a security key.');
    }

    // Generate cryptographic challenge
    const challenge = this.generateChallenge();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + this.challengeExpiry);

    this.pendingChallenges.set(sessionId, {
      username,
      challenge,
      createdAt: new Date(),
      expiresAt,
      allowedCredentials: user.tokens.map(t => t.credentialId)
    });

    console.log(`[Hardware Token] Challenge generated for ${username}`);

    return {
      sessionId,
      challenge,
      allowedCredentials: user.tokens.map(t => ({
        credentialId: t.credentialId,
        tokenName: t.tokenName
      })),
      expiresIn: this.challengeExpiry / 1000
    };
  }

  /**
   * Step 2: Verify hardware token response
   */
  async loginStep2(sessionId, credentialId, signedChallenge) {
    const challengeData = this.pendingChallenges.get(sessionId);

    if (!challengeData) {
      throw new Error('Invalid or expired session');
    }

    if (new Date() > challengeData.expiresAt) {
      this.pendingChallenges.delete(sessionId);
      throw new Error('Challenge expired');
    }

    // Verify credential is allowed
    if (!challengeData.allowedCredentials.includes(credentialId)) {
      throw new Error('Invalid credential for this session');
    }

    // Get token data
    const tokenData = this.registeredTokens.get(credentialId);
    if (!tokenData) {
      throw new Error('Token not found');
    }

    // Verify signature
    const isValid = this.verifySignature(
      challengeData.challenge,
      signedChallenge,
      tokenData.publicKey
    );

    if (!isValid) {
      this.pendingChallenges.delete(sessionId);
      throw new Error('Invalid token signature');
    }

    // Update token usage
    const user = this.users.get(challengeData.username);
    const token = user.tokens.find(t => t.credentialId === credentialId);
    if (token) {
      token.lastUsed = new Date();
      token.useCount++;
    }

    // Cleanup
    this.pendingChallenges.delete(sessionId);
    this.loginAttempts.delete(challengeData.username);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      authMethod: 'hardware-token',
      tokenUsed: token.tokenName,
      timestamp: new Date()
    };
  }

  /**
   * Simulate hardware token signing (for testing)
   */
  signChallenge(credentialId, challenge) {
    const tokenData = this.registeredTokens.get(credentialId);
    if (!tokenData) {
      throw new Error('Token not found');
    }

    // In real FIDO2, this happens on the hardware device
    // Here we simulate it with a signature
    return crypto
      .createHash('sha256')
      .update(challenge + tokenData.publicKey)
      .digest('hex');
  }

  /**
   * Generate cryptographic challenge
   */
  generateChallenge() {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate credential ID
   */
  generateCredentialId() {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Generate public key
   */
  generatePublicKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Verify signature
   */
  verifySignature(challenge, signedChallenge, publicKey) {
    const expectedSignature = crypto
      .createHash('sha256')
      .update(challenge + publicKey)
      .digest('hex');

    return expectedSignature === signedChallenge;
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
      tokenCount: user.tokens.length,
      tokens: user.tokens.map(t => ({
        tokenName: t.tokenName,
        registeredAt: t.registeredAt,
        lastUsed: t.lastUsed,
        useCount: t.useCount
      }))
    };
  }

  /**
   * Remove a hardware token
   */
  removeToken(username, credentialId) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    user.tokens = user.tokens.filter(t => t.credentialId !== credentialId);
    this.registeredTokens.delete(credentialId);

    return { success: true, remainingTokens: user.tokens.length };
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalUsers = this.users.size;
    const lockedUsers = Array.from(this.users.values()).filter(u => u.isLocked).length;
    const totalTokens = this.registeredTokens.size;
    const activeChallenges = this.pendingChallenges.size;

    return {
      totalUsers,
      lockedUsers,
      totalTokens,
      activeChallenges,
      authMethod: 'hardware-token',
      securityLevel: 'very-high',
      advantages: [
        'Phishing-proof',
        'No shared secrets',
        'Device-bound credentials',
        'Cryptographic challenge-response',
        'Nearly 100% effective against automated attacks'
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
}

module.exports = HardwareTokenAuth;
