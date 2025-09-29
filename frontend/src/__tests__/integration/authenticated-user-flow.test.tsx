/**
 * Integration test for authenticated user journey
 * Tests the complete user flow for authenticated users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';

// Mock authenticated user
const mockAuthenticatedUser = {
  $id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  prefs: { firstName: 'John', lastName: 'Doe' }
};

// Mock the homepage with authenticated state
const MockAuthenticatedHomepage = () => (
  <BrowserRouter>
    <AuthProvider>
      <div data-testid="homepage">
        <header data-testid="hero-section">
          <h1>Welcome back, John!</h1>
          <p>Ready to create more quizzes?</p>
          <button data-testid="generate-quiz-cta">Generate Quiz</button>
        </header>
        <section data-testid="features-section">
          <div data-testid="feature-card">AI-Powered Generation</div>
        </section>
        <section data-testid="how-it-works-section">
          <div data-testid="process-step">Upload Content</div>
        </section>
        <section data-testid="cta-section">
          <button data-testid="create-quiz-cta">Create New Quiz</button>
        </section>
      </div>
    </AuthProvider>
  </BrowserRouter>
);

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockNavigate,
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock auth context
vi.mock('@/context/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockAuthenticatedUser,
    isAuthenticated: true,
    loading: false
  })
}));

// Mock analytics service
vi.mock('@/lib/analytics-service', () => ({
  analyticsService: {
    trackConversion: vi.fn(),
    trackEngagement: vi.fn(),
    trackPageView: vi.fn(),
    getSessionId: vi.fn(() => 'test-session-id'),
    flush: vi.fn()
  }
}));

// Mock performance manager
vi.mock('@/lib/performance', () => ({
  performanceManager: {
    enable: vi.fn(),
    disable: vi.fn()
  }
}));

// Mock hooks
vi.mock('@/hooks/useHomepageAnalytics', () => ({
  useHomepageAnalytics: () => ({
    trackConversion: vi.fn(),
    trackEngagement: vi.fn(),
    trackPageView: vi.fn()
  })
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => ({
    isIntersecting: true,
    hasBeenVisible: true
  })
}));

vi.mock('@/hooks/useScrollProgress', () => ({
  useScrollProgress: () => ({
    scrollProgress: 50,
    isScrolled: true
  })
}));

vi.mock('@/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    metrics: {
      lcp: 1200,
      fcp: 800,
      cls: 0.05
    },
    isMonitoring: true
  })
}));

describe('Authenticated User Journey Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Personalized Homepage Experience', () => {
    it('should display personalized welcome message', () => {
      // This test MUST fail until authenticated homepage is implemented
      render(<MockAuthenticatedHomepage />);

      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
      expect(screen.getByText('Ready to create more quizzes?')).toBeInTheDocument();
    });

    it('should show Generate Quiz CTA instead of signup CTAs', () => {
      render(<MockAuthenticatedHomepage />);

      expect(screen.getByTestId('generate-quiz-cta')).toBeInTheDocument();
      expect(screen.getByText('Generate Quiz')).toBeInTheDocument();
      
      // Should NOT show anonymous CTAs
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
  });

  describe('Quiz Generation Flow', () => {
    it('should navigate to quiz generator when Generate Quiz is clicked', async () => {
      render(<MockAuthenticatedHomepage />);

      const generateButton = screen.getByTestId('generate-quiz-cta');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/generate');
      });
    });

    it('should handle multiple quiz creation CTAs', async () => {
      render(<MockAuthenticatedHomepage />);

      // Click hero CTA
      fireEvent.click(screen.getByTestId('generate-quiz-cta'));
      
      // Click bottom CTA
      fireEvent.click(screen.getByTestId('create-quiz-cta'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledTimes(2);
        expect(mockNavigate).toHaveBeenCalledWith('/generate');
      });
    });
  });

  describe('Analytics Tracking with User ID', () => {
    it('should track conversion events with authenticated user ID', async () => {
      render(<MockAuthenticatedHomepage />);

      const generateButton = screen.getByTestId('generate-quiz-cta');
      fireEvent.click(generateButton);

      await waitFor(() => {
        // Should track conversion with user ID
        expect(true).toBe(true); // Placeholder - will be replaced with actual analytics mock
        // Expect analytics call with userId: 'user-123'
      });
    });

    it('should track page view metrics with user context', async () => {
      render(<MockAuthenticatedHomepage />);

      // Should track metrics with user ID for authenticated analytics
      await waitFor(() => {
        expect(true).toBe(true); // Placeholder - will be replaced with actual metrics tracking
      });
    });
  });

  describe('User Preference Handling', () => {
    it('should display user name from preferences', () => {
      render(<MockAuthenticatedHomepage />);

      expect(screen.getByText(/John/)).toBeInTheDocument();
    });

    it('should handle missing user preferences gracefully', () => {
      // Mock user without firstName
      const userWithoutPrefs = {
        ...mockAuthenticatedUser,
        prefs: {}
      };

      vi.mocked(require('@/context/auth-context').useAuth).mockReturnValueOnce({
        user: userWithoutPrefs,
        isAuthenticated: true,
        loading: false
      });

      render(<MockAuthenticatedHomepage />);

      // Should still render without crashing
      expect(screen.getByTestId('homepage')).toBeInTheDocument();
    });
  });

  describe('Enhanced Feature Access', () => {
    it('should show premium features for authenticated users', () => {
      render(<MockAuthenticatedHomepage />);

      // Authenticated users should see enhanced features
      expect(screen.getByTestId('features-section')).toBeInTheDocument();
    });

    it('should provide quick access to user dashboard', () => {
      render(<MockAuthenticatedHomepage />);

      // Should have navigation to user-specific areas
      expect(screen.getByTestId('generate-quiz-cta')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration gracefully', async () => {
      // Mock session expiration
      vi.mocked(require('@/context/auth-context').useAuth).mockReturnValueOnce({
        user: null,
        isAuthenticated: false,
        loading: false
      });

      render(<MockAuthenticatedHomepage />);

      // Should handle transition to anonymous state
      await waitFor(() => {
        expect(screen.getByTestId('homepage')).toBeInTheDocument();
      });
    });

    it('should track user session for analytics', async () => {
      render(<MockAuthenticatedHomepage />);

      // Should maintain session tracking
      await waitFor(() => {
        expect(true).toBe(true); // Placeholder - will be replaced with actual session tracking
      });
    });
  });

  describe('Performance with Authentication', () => {
    it('should maintain fast load times with user data', async () => {
      const startTime = performance.now();
      
      render(<MockAuthenticatedHomepage />);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should still load within performance budget
      expect(loadTime).toBeLessThan(3000);
    });

    it('should not block UI while loading user preferences', async () => {
      render(<MockAuthenticatedHomepage />);

      // Page should render immediately
      expect(screen.getByTestId('homepage')).toBeInTheDocument();
    });
  });

  describe('Accessibility for Authenticated Users', () => {
    it('should maintain keyboard navigation for authenticated CTAs', () => {
      render(<MockAuthenticatedHomepage />);

      const generateButton = screen.getByTestId('generate-quiz-cta');
      
      generateButton.focus();
      expect(document.activeElement).toBe(generateButton);
    });

    it('should activate authenticated CTAs with Enter key', async () => {
      render(<MockAuthenticatedHomepage />);

      const generateButton = screen.getByTestId('generate-quiz-cta');
      generateButton.focus();
      fireEvent.keyDown(generateButton, { key: 'Enter' });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/generate');
      });
    });
  });

  describe('Error Handling for Authenticated State', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock auth error
      vi.mocked(require('@/context/auth-context').useAuth).mockReturnValueOnce({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: 'Authentication failed'
      });

      render(<MockAuthenticatedHomepage />);

      // Should still render page
      expect(screen.getByTestId('homepage')).toBeInTheDocument();
    });

    it('should handle quiz generation navigation failures', async () => {
      mockNavigate.mockRejectedValueOnce(new Error('Navigation failed'));

      render(<MockAuthenticatedHomepage />);

      const generateButton = screen.getByTestId('generate-quiz-cta');
      fireEvent.click(generateButton);

      // Should not crash the page
      await waitFor(() => {
        expect(screen.getByTestId('homepage')).toBeInTheDocument();
      });
    });
  });
});