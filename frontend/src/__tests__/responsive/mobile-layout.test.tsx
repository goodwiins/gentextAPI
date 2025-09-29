/**
 * Mobile Responsiveness Tests
 * Validates homepage components work correctly on mobile devices
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { HomepageHero } from '@/components/home/HomepageHero';
import { FeatureCard } from '@/components/home/FeatureCard';
import { CtaSection } from '@/components/home/CtaSection';

import type { AuthUser, ConversionAction } from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock icon
const MockIcon = () => <div data-testid="mock-icon">Icon</div>;

describe('Mobile Responsiveness Tests', () => {
  let mockUser: AuthUser | null;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUser = null;
    mockOnCtaClick = vi.fn();

    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667
    });
  });

  it('should render HomepageHero correctly on mobile', () => {
    const props = {
      user: null,
      onCtaClick: mockOnCtaClick,
      performanceMode: 'standard' as const
    };

    render(<HomepageHero {...props} />);

    // Check that key elements are visible
    expect(screen.getByText(/Generate Engaging Quizzes with AI/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });

  it('should render FeatureCard correctly on mobile', () => {
    const props = {
      icon: MockIcon,
      title: 'Test Feature',
      description: 'Test feature description',
      onView: vi.fn(),
      onInteraction: vi.fn()
    };

    render(<FeatureCard {...props} />);

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Test feature description')).toBeInTheDocument();
  });

  it('should render CtaSection correctly on mobile', () => {
    const props = {
      variant: 'primary' as const,
      user: null,
      onCtaClick: mockOnCtaClick
    };

    render(<CtaSection {...props} />);

    expect(screen.getByRole('region', { name: /call to action/i })).toBeInTheDocument();
  });
});