/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// ARIA label generators
export const ariaLabels = {
  hero: {
    mainHeading: 'GenText AI-Powered Quiz Generator - Transform Text into Engaging Quizzes',
    getStartedButton: 'Get started for free - Create your first AI-generated quiz',
    signInButton: 'Sign in to your existing account',
    watchDemoButton: 'Watch a demonstration of GenText features'
  },
  navigation: {
    mainMenu: 'Main navigation menu',
    toggleMenu: 'Toggle main navigation menu',
    home: 'Navigate to homepage',
    dashboard: 'Navigate to user dashboard',
    settings: 'Navigate to account settings',
    signOut: 'Sign out of your account'
  },
  userStats: {
    loading: 'Loading user statistics',
    error: 'Failed to load user statistics',
    retryButton: 'Retry loading user statistics',
    quizzesCreated: 'Number of quizzes you have created',
    questionsGenerated: 'Total number of questions generated across all quizzes',
    averageQuestionsPerQuiz: 'Average number of questions per quiz'
  },
  features: {
    aiPowered: 'AI-Powered Generation - Advanced AI creates relevant quiz questions automatically',
    instantResults: 'Instant Results - Generate comprehensive quizzes in seconds',
    customizable: 'Customizable Options - Tailor difficulty, format, and focus areas',
    multipleFormats: 'Multiple Formats - Support for various question types',
    collaboration: 'Collaboration Ready - Share quizzes with easy export options',
    analytics: 'Smart Analytics - Track performance and get insights'
  },
  footer: {
    copyright: (year: number) => `Copyright © ${year} GenText. All rights reserved.`,
    privacy: 'Read our privacy policy',
    terms: 'Read our terms of service',
    contact: 'Contact GenText support'
  }
};

// Skip link generator for accessibility
export const generateSkipLink = (targetId: string, label: string): string => {
  return `
    <a
      href="#${targetId}"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="${label}"
    >
      ${label}
    </a>
  `;
};

// Focus management utilities
export const focusManagement = {
  /**
   * Trap focus within a modal or dialog
   */
  trapFocus: (container: HTMLElement): void => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Store cleanup function
    (container as any)._focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  /**
   * Remove focus trap from container
   */
  removeFocusTrap: (container: HTMLElement): void => {
    const cleanup = (container as any)._focusTrapCleanup;
    if (cleanup) {
      cleanup();
      delete (container as any)._focusTrapCleanup;
    }
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus: (previousElement: HTMLElement | null): void => {
    if (previousElement && typeof previousElement.focus === 'function') {
      setTimeout(() => previousElement.focus(), 0);
    }
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  /**
   * Handle keyboard events for menu navigation
   */
  handleMenuNavigation: (
    e: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onSelect: (index: number) => void
  ): number => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        return (currentIndex + 1) % totalItems;
      case 'ArrowUp':
        e.preventDefault();
        return currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
      case 'Home':
        e.preventDefault();
        return 0;
      case 'End':
        e.preventDefault();
        return totalItems - 1;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(currentIndex);
        return currentIndex;
      case 'Escape':
        return -1; // Signal to close menu
      default:
        return currentIndex;
    }
  },

  /**
   * Handle keyboard events for tab navigation
   */
  handleTabNavigation: (
    e: KeyboardEvent,
    currentElement: HTMLElement,
    container: HTMLElement
  ): void => {
    if (e.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const currentIndex = Array.from(focusableElements).indexOf(currentElement);
    const isLastElement = currentIndex === focusableElements.length - 1;
    const isFirstElement = currentIndex === 0;

    if (e.shiftKey && isFirstElement) {
      e.preventDefault();
      focusableElements[focusableElements.length - 1].focus();
    } else if (!e.shiftKey && isLastElement) {
      e.preventDefault();
      focusableElements[0].focus();
    }
  }
};

// Screen reader announcements
export const screenReader = {
  /**
   * Announce a message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Announce loading state
   */
  announceLoading: (context: string): void => {
    screenReader.announce(`${context} is loading`, 'polite');
  },

  /**
   * Announce error state
   */
  announceError: (error: string, context: string): void => {
    screenReader.announce(`Error in ${context}: ${error}`, 'assertive');
  },

  /**
   * Announce success state
   */
  announceSuccess: (action: string, context: string): void => {
    screenReader.announce(`${action} completed successfully in ${context}`, 'polite');
  }
};

// Color contrast checker (basic implementation)
export const colorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = colorContrast.getLuminance(color1);
    const lum2 = colorContrast.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if contrast meets WCAG AA standards
   */
  meetsWCAAALevel: (contrastRatio: number, isLargeText: boolean = false): boolean => {
    const minimumRatio = isLargeText ? 3.0 : 4.5;
    return contrastRatio >= minimumRatio;
  }
};

// Reduced motion utilities
export const reducedMotion = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get animation duration based on user preference
   */
  getAnimationDuration: (defaultDuration: number): number => {
    return reducedMotion.prefersReducedMotion() ? 0 : defaultDuration;
  },

  /**
   * Apply reduced motion to CSS transitions
   */
  applyReducedMotion: (element: HTMLElement, baseTransition: string): void => {
    if (reducedMotion.prefersReducedMotion()) {
      element.style.transition = 'none';
    } else {
      element.style.transition = baseTransition;
    }
  }
};

// Accessibility testing utilities
export const accessibilityTesting = {
  /**
   * Check if all images have alt text
   */
  checkImageAltText: (): { missing: number; total: number; elements: Element[] } => {
    const images = document.querySelectorAll('img');
    const missing = Array.from(images).filter(img => !img.getAttribute('alt'));
    return {
      missing: missing.length,
      total: images.length,
      elements: missing
    };
  },

  /**
   * Check if all form inputs have labels
   */
  checkFormLabels: (): { missing: number; total: number; elements: Element[] } => {
    const inputs = document.querySelectorAll('input, select, textarea');
    const missing = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    return {
      missing: missing.length,
      total: inputs.length,
      elements: missing
    };
  },

  /**
   * Check if heading hierarchy is correct
   */
  checkHeadingHierarchy: (): { violations: string[] } => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const violations: string[] = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));

      if (index === 0 && currentLevel !== 1) {
        violations.push('First heading should be h1');
      }

      if (currentLevel > previousLevel + 1) {
        violations.push(`Heading level skipped: h${previousLevel} to h${currentLevel}`);
      }

      previousLevel = currentLevel;
    });

    return { violations };
  }
};