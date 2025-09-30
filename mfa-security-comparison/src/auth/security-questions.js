/**
 * Security Questions Authentication
 *
 * Implements knowledge-based authentication using security questions.
 * Users answer predefined security questions as a second factor.
 *
 * Security Weaknesses:
 * - Answers often found on social media
 * - Vulnerable to social engineering
 * - Static answers never change
 * - Weaker than other MFA methods
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const PREDEFINED_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What was your favorite food as a child?",
  "What year did you graduate from high school?"
];

class SecurityQuestionsAuth {
  constructor() {
    this.users = new Map();
    this.loginAttempts = new Map();
    this.lockoutThreshold = 5;
    this.lockoutDuration = 15 * 60 * 1000;
  }

  /**
   * Register a new user with security questions
   */
  async register(username, password, securityAnswers) {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }

    if (!Array.isArray(securityAnswers) || securityAnswers.length < 3) {
      throw new Error('Must provide at least 3 security question answers');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Hash security answers (case-insensitive)
    const hashedAnswers = await Promise.all(
      securityAnswers.map(async (qa) => ({
        question: qa.question,
        answer: await bcrypt.hash(qa.answer.toLowerCase().trim(), 10)
      }))
    );

    const user = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      securityQuestions: hashedAnswers,
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
      questionsSet: securityAnswers.length
    };
  }

  /**
   * Login with password and security question answer
   */
  async login(username, password, questionIndex, answer) {
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

    // Verify security question answer
    if (questionIndex < 0 || questionIndex >= user.securityQuestions.length) {
      throw new Error('Invalid question index');
    }

    const questionData = user.securityQuestions[questionIndex];
    const normalizedAnswer = answer.toLowerCase().trim();
    const isAnswerValid = await bcrypt.compare(normalizedAnswer, questionData.answer);

    if (!isAnswerValid) {
      this.trackFailedAttempt(username, user);
      throw new Error('Incorrect answer to security question');
    }

    // Reset failed attempts on successful login
    this.loginAttempts.delete(username);

    return {
      success: true,
      userId: user.id,
      username: user.username,
      authMethod: 'security-questions',
      timestamp: new Date()
    };
  }

  /**
   * Get a random security question for the user
   */
  getRandomQuestion(username) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    const randomIndex = Math.floor(Math.random() * user.securityQuestions.length);
    return {
      questionIndex: randomIndex,
      question: user.securityQuestions[randomIndex].question
    };
  }

  /**
   * Get all security questions for a user (without answers)
   */
  getUserQuestions(username) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    return user.securityQuestions.map((q, index) => ({
      index,
      question: q.question
    }));
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
      questionCount: user.securityQuestions.length
    };
  }

  /**
   * Get predefined questions list
   */
  static getPredefinedQuestions() {
    return [...PREDEFINED_QUESTIONS];
  }

  /**
   * Update security questions
   */
  async updateSecurityQuestions(username, newAnswers) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    const hashedAnswers = await Promise.all(
      newAnswers.map(async (qa) => ({
        question: qa.question,
        answer: await bcrypt.hash(qa.answer.toLowerCase().trim(), 10)
      }))
    );

    user.securityQuestions = hashedAnswers;
    return { success: true, questionsUpdated: hashedAnswers.length };
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalUsers = this.users.size;
    const lockedUsers = Array.from(this.users.values()).filter(u => u.isLocked).length;
    const avgQuestionsPerUser = totalUsers > 0
      ? Array.from(this.users.values()).reduce((sum, u) => sum + u.securityQuestions.length, 0) / totalUsers
      : 0;

    return {
      totalUsers,
      lockedUsers,
      avgQuestionsPerUser: avgQuestionsPerUser.toFixed(1),
      authMethod: 'security-questions',
      securityLevel: 'low-medium',
      vulnerabilities: [
        'Answers often public on social media',
        'Vulnerable to social engineering',
        'Static answers',
        'Guessable information'
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

module.exports = SecurityQuestionsAuth;
module.exports.PREDEFINED_QUESTIONS = PREDEFINED_QUESTIONS;
