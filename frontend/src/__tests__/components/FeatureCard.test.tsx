/**
 * Component test for FeatureCard
 * Tests the contract compliance and functionality of feature card components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeatureCard } from '@/components/home/FeatureCard';
import type { FeatureCardProps } from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock icon component
const MockIcon = ({ className }: { className?: string }) => (
  <div className={className} data-testid="feature-icon">Icon</div>
);

describe('FeatureCard Contract Tests', () => {
  let mockOnView: ReturnType<typeof vi.fn>;
  let mockOnInteraction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnView = vi.fn();
    mockOnInteraction = vi.fn();
  });

  describe('Component Interface Compliance', () => {
    it('should accept all required props from FeatureCardProps interface', () => {
      // This test MUST fail until component is implemented
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      expect(() => {
        render(<FeatureCard {...props} />);
      }).not.toThrow();
    });

    it('should render with optional props', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        animationDelay: 0.2,
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      expect(() => {
        render(<FeatureCard {...props} />);
      }).not.toThrow();
    });
  });

  describe('Content Display', () => {
    it('should display title and description', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'AI-Powered Generation',
        description: 'Generate quizzes using advanced AI',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      render(<FeatureCard {...props} />);

      expect(screen.getByText('AI-Powered Generation')).toBeInTheDocument();
      expect(screen.getByText('Generate quizzes using advanced AI')).toBeInTheDocument();
    });

    it('should render the provided icon', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      render(<FeatureCard {...props} />);

      expect(screen.getByTestId('feature-icon')).toBeInTheDocument();
    });
  });

  describe('Interaction Tracking', () => {
    it('should call onView when feature becomes visible', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      render(<FeatureCard {...props} />);

      // Should call onView when component mounts and becomes visible
      expect(mockOnView).toHaveBeenCalled();
    });

    it('should call onInteraction when clicked', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      render(<FeatureCard {...props} />);

      const card = screen.getByRole('article');
      fireEvent.click(card);

      expect(mockOnInteraction).toHaveBeenCalledWith('Test Feature', 'click');
    });
  });

  describe('Animation Properties', () => {
    it('should handle animation delay prop', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        animationDelay: 0.5,
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      expect(() => {
        render(<FeatureCard {...props} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      render(<FeatureCard {...props} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Test Feature',
        description: 'Test description',
        onView: mockOnView,
        onInteraction: mockOnInteraction
      };

      render(<FeatureCard {...props} />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex');
    });
  });
});