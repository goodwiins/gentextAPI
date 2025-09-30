/**
 * Component test for CtaSection
 * Tests the contract compliance and functionality of CTA section components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CtaSection } from '@/components/home/CtaSection';
import type { CtaSectionProps, AuthUser, ConversionAction } from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock the useHomepageAnalytics hook
vi.mock('@/hooks/useHomepageAnalytics', () => ({
  useHomepageAnalytics: () => ({
    trackConversion: vi.fn().mockResolvedValue(undefined),
    sessionId: 'test-session-123',
    isTracking: true
  })
}));

describe('CtaSection Contract Tests', () => {
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let mockUser: AuthUser | null;

  beforeEach(() => {
    mockOnCtaClick = vi.fn();
    mockUser = null;
  });

  describe('Component Interface Compliance', () => {
    it('should accept all required props from CtaSectionProps interface', () => {
      // This test MUST fail until component is implemented
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      expect(() => {
        render(<CtaSection {...props} />);
      }).not.toThrow();
    });

    it('should render with all optional props', () => {
      const props: CtaSectionProps = {
        variant: 'secondary',
        user: null,
        onCtaClick: mockOnCtaClick,
        showSocialProof: true,
        backgroundColor: 'gradient'
      };

      expect(() => {
        render(<CtaSection {...props} />);
      }).not.toThrow();
    });
  });

  describe('Variant Handling', () => {
    const variants: Array<'primary' | 'secondary' | 'minimal'> = ['primary', 'secondary', 'minimal'];

    variants.forEach(variant => {
      it(`should handle ${variant} variant`, () => {
        const props: CtaSectionProps = {
          variant,
          user: null,
          onCtaClick: mockOnCtaClick
        };

        expect(() => {
          render(<CtaSection {...props} />);
        }).not.toThrow();
      });
    });
  });

  describe('Background Color Options', () => {
    const backgrounds: Array<'default' | 'gradient' | 'solid'> = ['default', 'gradient', 'solid'];

    backgrounds.forEach(bg => {
      it(`should handle ${bg} background`, () => {
        const props: CtaSectionProps = {
          variant: 'primary',
          user: null,
          onCtaClick: mockOnCtaClick,
          backgroundColor: bg
        };

        expect(() => {
          render(<CtaSection {...props} />);
        }).not.toThrow();
      });
    });
  });

  describe('Anonymous User CTAs', () => {
    it('should display primary CTA for anonymous users', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('should call onCtaClick with signup_clicked for primary CTA', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      const primaryButton = screen.getByRole('button', { name: /get started/i });
      fireEvent.click(primaryButton);

      expect(mockOnCtaClick).toHaveBeenCalledWith('signup_clicked');
    });

    it('should display secondary CTA for anonymous users', () => {
      const props: CtaSectionProps = {
        variant: 'secondary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });
  });

  describe('Authenticated User CTAs', () => {
    beforeEach(() => {
      mockUser = {
        $id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        prefs: { firstName: 'John' }
      };
    });

    it('should display Generate Quiz CTA for authenticated users', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: mockUser,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      expect(screen.getByRole('button', { name: /generate quiz/i })).toBeInTheDocument();
    });

    it('should call onCtaClick with generate_clicked for authenticated users', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: mockUser,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      const generateButton = screen.getByRole('button', { name: /generate quiz/i });
      fireEvent.click(generateButton);

      expect(mockOnCtaClick).toHaveBeenCalledWith('generate_clicked');
    });
  });

  describe('Social Proof Display', () => {
    it('should show social proof when enabled', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick,
        showSocialProof: true
      };

      render(<CtaSection {...props} />);

      expect(screen.getByText(/10,000\+ users/i)).toBeInTheDocument();
    });

    it('should hide social proof when disabled', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick,
        showSocialProof: false
      };

      render(<CtaSection {...props} />);

      expect(screen.queryByText(/join thousands/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper section role', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);

      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toHaveAttribute('tabIndex');
    });
  });
});