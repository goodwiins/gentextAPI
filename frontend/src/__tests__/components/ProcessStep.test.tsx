/**
 * Component test for ProcessStep
 * Tests the contract compliance and functionality of process step components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProcessStep } from '@/components/home/ProcessStep';
import type { ProcessStepProps } from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock icon component
const MockIcon = ({ className }: { className?: string }) => (
  <div className={className} data-testid="step-icon">Icon</div>
);

describe('ProcessStep Contract Tests', () => {
  describe('Component Interface Compliance', () => {
    it('should accept all required props from ProcessStepProps interface', () => {
      // This test MUST fail until component is implemented
      const props: ProcessStepProps = {
        stepNumber: 1,
        title: 'Upload Content',
        description: 'Upload your educational content',
        icon: MockIcon
      };

      expect(() => {
        render(<ProcessStep {...props} />);
      }).not.toThrow();
    });

    it('should render with all optional props', () => {
      const props: ProcessStepProps = {
        stepNumber: 3,
        title: 'Generate Quiz',
        description: 'AI generates quiz questions',
        icon: MockIcon,
        isLast: true,
        animationDirection: 'right'
      };

      expect(() => {
        render(<ProcessStep {...props} />);
      }).not.toThrow();
    });
  });

  describe('Content Display', () => {
    it('should display step number, title, and description', () => {
      const props: ProcessStepProps = {
        stepNumber: 2,
        title: 'Configure Settings',
        description: 'Customize your quiz parameters',
        icon: MockIcon
      };

      render(<ProcessStep {...props} />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Configure Settings')).toBeInTheDocument();
      expect(screen.getByText('Customize your quiz parameters')).toBeInTheDocument();
    });

    it('should render the provided icon', () => {
      const props: ProcessStepProps = {
        stepNumber: 1,
        title: 'Test Step',
        description: 'Test description',
        icon: MockIcon
      };

      render(<ProcessStep {...props} />);

      expect(screen.getByTestId('step-icon')).toBeInTheDocument();
    });
  });

  describe('Animation Direction Handling', () => {
    const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];

    directions.forEach(direction => {
      it(`should handle ${direction} animation direction`, () => {
        const props: ProcessStepProps = {
          stepNumber: 1,
          title: 'Test Step',
          description: 'Test description',
          icon: MockIcon,
          animationDirection: direction
        };

        expect(() => {
          render(<ProcessStep {...props} />);
        }).not.toThrow();
      });
    });
  });

  describe('Last Step Handling', () => {
    it('should handle isLast prop correctly', () => {
      const props: ProcessStepProps = {
        stepNumber: 3,
        title: 'Final Step',
        description: 'Complete the process',
        icon: MockIcon,
        isLast: true
      };

      render(<ProcessStep {...props} />);

      // Last step should not show connector line
      expect(screen.queryByTestId('step-connector')).not.toBeInTheDocument();
    });

    it('should show connector for non-last steps', () => {
      const props: ProcessStepProps = {
        stepNumber: 1,
        title: 'First Step',
        description: 'Begin the process',
        icon: MockIcon,
        isLast: false
      };

      render(<ProcessStep {...props} />);

      expect(screen.getByTestId('step-connector')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const props: ProcessStepProps = {
        stepNumber: 1,
        title: 'Test Step',
        description: 'Test description',
        icon: MockIcon
      };

      render(<ProcessStep {...props} />);

      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should have accessible step number', () => {
      const props: ProcessStepProps = {
        stepNumber: 2,
        title: 'Test Step',
        description: 'Test description',
        icon: MockIcon
      };

      render(<ProcessStep {...props} />);

      const stepNumber = screen.getByText('2');
      expect(stepNumber).toHaveAttribute('aria-label', 'Step 2');
    });
  });
});