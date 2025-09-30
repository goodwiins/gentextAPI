/**
 * Component test for HomepageHero
 * Tests the contract compliance and functionality of the hero section component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomepageHero } from '@/components/home/HomepageHero';
import type { HomepageHeroProps, AuthUser, ConversionAction } from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock dependencies
vi.mock('@/hooks/useHomepageAnalytics', () => ({
  useHomepageAnalytics: () => ({
    trackConversion: vi.fn(),
    sessionId: 'test-session-123'
  })
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => 0,
}));

describe('HomepageHero Contract Tests', () => {
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let mockUser: AuthUser | null;

  beforeEach(() => {
    mockOnCtaClick = vi.fn();
    mockUser = null;
  });

  describe('Component Interface Compliance', () => {
    it('should accept all required props from HomepageHeroProps interface', () => {
      // This test MUST fail until component is implemented
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard'
      };

      expect(() => {
        render(<HomepageHero {...props} />);
      }).not.toThrow();
    });

    it('should render without optional props', () => {
      const minimalProps: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      expect(() => {
        render(<HomepageHero {...minimalProps} />);
      }).not.toThrow();
    });

    it('should handle all performance mode variants', () => {
      const performanceModes: Array<'high' | 'standard' | 'minimal'> = ['high', 'standard', 'minimal'];
      
      performanceModes.forEach(mode => {
        const props: HomepageHeroProps = {
          user: null,
          onCtaClick: mockOnCtaClick,
          performanceMode: mode
        };

        expect(() => {
          render(<HomepageHero {...props} />);
        }).not.toThrow();
      });
    });
  });

  describe('Anonymous User Experience', () => {
    it('should display "Get Started" CTA for anonymous users', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('should call onCtaClick with signup_clicked when Get Started is clicked', async () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      fireEvent.click(getStartedButton);

      await waitFor(() => {
        expect(mockOnCtaClick).toHaveBeenCalledWith('signup_clicked');
      });
    });

    it('should display login option for anonymous users', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should call onCtaClick with login_clicked when Sign In is clicked', async () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockOnCtaClick).toHaveBeenCalledWith('login_clicked');
      });
    });
  });

  describe('Authenticated User Experience', () => {
    beforeEach(() => {
      mockUser = {
        $id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        prefs: {
          firstName: 'John',
          lastName: 'Doe'
        }
      };
    });

    it('should display "Generate Quiz" CTA for authenticated users', () => {
      const props: HomepageHeroProps = {
        user: mockUser,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      expect(screen.getByRole('button', { name: /generate quiz/i })).toBeInTheDocument();
    });

    it('should call onCtaClick with generate_clicked when Generate Quiz is clicked', async () => {
      const props: HomepageHeroProps = {
        user: mockUser,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const generateButton = screen.getByRole('button', { name: /generate quiz/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnCtaClick).toHaveBeenCalledWith('generate_clicked');
      });
    });

    it('should display personalized welcome message', () => {
      const props: HomepageHeroProps = {
        user: mockUser,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const heading = screen.getByTestId('hero-heading');
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toMatch(/welcome back, john/i);
    });

    it('should not display signup/login CTAs for authenticated users', () => {
      const props: HomepageHeroProps = {
        user: mockUser,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });

  describe('Content Requirements', () => {
    it('should display main value proposition', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByText(/quiz generation/i)).toHaveLength(2); // Badge and subtitle
    });

    it('should include descriptive text about the service', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const heading = screen.getByTestId('hero-heading');
      expect(heading.textContent).toMatch(/create engaging quizzes/i);
    });
  });

  describe('Accessibility Requirements', () => {
    it('should have proper heading hierarchy', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      expect(getStartedButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      expect(getStartedButton).toHaveAttribute('tabIndex');
    });
  });

  describe('Performance Mode Handling', () => {
    it('should render minimal animations in minimal performance mode', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'minimal'
      };

      render(<HomepageHero {...props} />);

      // Component should still render but with reduced animations
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should handle prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<HomepageHero {...props} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle onCtaClick errors gracefully', async () => {
      const faultyOnCtaClick = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: faultyOnCtaClick
      };

      render(<HomepageHero {...props} />);

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      
      // Should not crash the component
      expect(() => {
        fireEvent.click(getStartedButton);
      }).not.toThrow();
    });
  });
});