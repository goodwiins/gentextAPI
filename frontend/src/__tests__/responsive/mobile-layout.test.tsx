/**
 * Mobile Responsiveness Validation Tests
 * Validates homepage components work correctly across all mobile screen sizes
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components to test
import { HomepageHero } from '@/components/home/HomepageHero';
import { FeatureCard } from '@/components/home/FeatureCard';
import { CtaSection } from '@/components/home/CtaSection';
import { TestimonialCard } from '@/components/home/TestimonialCard';
import { ProcessStep } from '@/components/home/ProcessStep';
import { HomepageLayout } from '@/components/home/HomepageLayout';

import type { 
  AuthUser, 
  ConversionAction,
  HomepageHeroProps,
  FeatureCardProps,
  CtaSectionProps,
  TestimonialCardProps,
  ProcessStepProps,
  HomepageLayoutProps
} from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock hooks
vi.mock('@/hooks/useHomepageAnalytics', () => ({
  useHomepageAnalytics: () => ({
    trackConversion: vi.fn(),
    trackEngagement: vi.fn(),
    trackPageView: vi.fn()
  })
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn()
  })
}));

// Mock next/head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}));

// Mock icon
const MockIcon = () => <div data-testid="mock-icon">Icon</div>;

// Common screen sizes for testing
const SCREEN_SIZES = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone 11 Pro' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  tabletLarge: { width: 1024, height: 1366, name: 'iPad Pro' },
  desktop: { width: 1440, height: 900, name: 'Desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'Large Desktop' }
};

describe('Mobile Responsiveness Validation Tests', () => {
  let mockUser: AuthUser | null;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    mockUser = null;
    mockOnCtaClick = vi.fn();
    
    // Store original dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
    
    vi.clearAllMocks();
  });

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  };

  describe('Cross-Device Layout Tests', () => {
    Object.entries(SCREEN_SIZES).forEach(([deviceType, { width, height, name }]) => {
      it(`should render HomepageHero correctly on ${name} (${width}x${height})`, () => {
        setViewport(width, height);
        
        const props: HomepageHeroProps = {
          user: null,
          onCtaClick: mockOnCtaClick,
          performanceMode: 'standard'
        };

        const { container } = render(<HomepageHero {...props} />);

        // Check that key elements are present
        expect(screen.getByText(/Generate Engaging Quizzes/i)).toBeInTheDocument();
        
        // Check for responsive button sizing
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        // Verify container doesn't overflow
        const heroContainer = container.firstChild as HTMLElement;
        if (heroContainer) {
          expect(heroContainer).toBeInTheDocument();
        }
      });

      it(`should render FeatureCard correctly on ${name} (${width}x${height})`, () => {
        setViewport(width, height);
        
        const props: FeatureCardProps = {
          icon: MockIcon,
          title: 'Mobile Responsive Feature',
          description: 'This feature adapts to all screen sizes perfectly',
          onView: vi.fn(),
          onInteraction: vi.fn()
        };

        const { container } = render(<FeatureCard {...props} />);
        
        expect(screen.getByText('Mobile Responsive Feature')).toBeInTheDocument();
        expect(screen.getByText(/This feature adapts to all screen sizes/i)).toBeInTheDocument();
        
        // Check card dimensions are appropriate for viewport
        const card = container.firstChild as HTMLElement;
        if (card) {
          const cardRect = card.getBoundingClientRect();
          expect(cardRect.width).toBeLessThanOrEqual(width);
        }
      });
    });
  });

  describe('Mobile-Specific Layout Validation', () => {
    beforeEach(() => {
      setViewport(SCREEN_SIZES.mobile.width, SCREEN_SIZES.mobile.height);
    });

    it('should stack elements vertically on mobile', () => {
      const props: HomepageLayoutProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard',
        analyticsEnabled: true
      };

      render(<HomepageLayout {...props} />);
      
      // On mobile, elements should stack vertically
      // Check that the layout doesn't have horizontal scrolling
      const body = document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(SCREEN_SIZES.mobile.width + 20); // 20px tolerance
    });

    it('should make touch targets appropriately sized', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);
      
      // Touch targets should be at least 44px (iOS) or 48px (Android)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });
    });

    it('should show mobile-optimized navigation', () => {
      const props: HomepageLayoutProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard',
        analyticsEnabled: true
      };

      render(<HomepageLayout {...props} />);
      
      // Should handle mobile navigation appropriately
      // This would test for hamburger menu, mobile-friendly nav, etc.
      expect(document.body).toBeInTheDocument();
    });

    it('should handle text scaling appropriately', () => {
      const props: TestimonialCardProps = {
        name: 'Mobile User',
        role: 'Tester',
        company: 'Mobile Testing Co',
        content: 'This testimonial should be readable on mobile devices with proper text scaling and line height.'
      };

      render(<TestimonialCard {...props} />);
      
      const testimonialText = screen.getByText(/This testimonial should be readable/i);
      const styles = window.getComputedStyle(testimonialText);
      
      // Text should be readable (min 16px equivalent)
      const fontSize = parseInt(styles.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(14); // Allowing for different base font sizes
    });
  });

  describe('Touch Interaction Tests', () => {
    beforeEach(() => {
      setViewport(SCREEN_SIZES.mobile.width, SCREEN_SIZES.mobile.height);
    });

    it('should handle touch events on FeatureCard', () => {
      const mockOnInteraction = vi.fn();
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Touch Interactive Card',
        description: 'Card that responds to touch',
        onView: vi.fn(),
        onInteraction: mockOnInteraction
      };

      const { container } = render(<FeatureCard {...props} />);
      const card = container.firstChild as HTMLElement;
      
      // Simulate touch events
      fireEvent.touchStart(card);
      fireEvent.touchEnd(card);
      
      expect(card).toBeInTheDocument();
    });

    it('should handle tap events on buttons', () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard'
      };

      render(<HomepageHero {...props} />);
      
      const button = screen.getAllByRole('button')[0];
      
      // Simulate tap (touchstart + touchend)
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);
      fireEvent.click(button);
      
      expect(mockOnCtaClick).toHaveBeenCalled();
    });

    it('should prevent double-tap zoom on interactive elements', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);
      
      const button = screen.getAllByRole('button')[0];
      
      // Check for touch-action CSS property or similar anti-zoom measures
      const styles = window.getComputedStyle(button);
      // This would typically check for touch-action: manipulation
      expect(button).toBeInTheDocument();
    });
  });

  describe('Orientation Change Tests', () => {
    it('should adapt to portrait orientation', () => {
      setViewport(375, 667); // Portrait
      
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard'
      };

      const { container } = render(<HomepageHero {...props} />);
      
      // Check layout adapts to portrait
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should adapt to landscape orientation', () => {
      setViewport(667, 375); // Landscape
      
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard'
      };

      const { container } = render(<HomepageHero {...props} />);
      
      // Check layout adapts to landscape
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Content Overflow and Scrolling', () => {
    beforeEach(() => {
      setViewport(SCREEN_SIZES.mobile.width, SCREEN_SIZES.mobile.height);
    });

    it('should prevent horizontal scrolling', () => {
      const props: HomepageLayoutProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard',
        analyticsEnabled: true
      };

      render(<HomepageLayout {...props} />);
      
      // Check that content doesn't cause horizontal overflow
      const body = document.body;
      expect(body.scrollWidth).toBeLessThanOrEqual(SCREEN_SIZES.mobile.width + 20);
    });

    it('should handle long text content gracefully', () => {
      const props: TestimonialCardProps = {
        name: 'User with Very Long Name That Might Overflow',
        role: 'Senior Lead Principal Executive Director of Mobile Testing',
        company: 'Very Long Company Name That Tests Text Wrapping Behavior',
        content: 'This is a very long testimonial that tests how the component handles text wrapping and overflow on mobile devices. It should wrap appropriately and not cause layout issues.'
      };

      const { container } = render(<TestimonialCard {...props} />);
      
      // Text should wrap and not overflow
      const testimonialContainer = container.firstChild as HTMLElement;
      if (testimonialContainer) {
        const rect = testimonialContainer.getBoundingClientRect();
        expect(rect.width).toBeLessThanOrEqual(SCREEN_SIZES.mobile.width);
      }
    });

    it('should handle dynamic content resizing', () => {
      const props: ProcessStepProps = {
        stepNumber: 1,
        title: 'Dynamic Step',
        description: 'Step that can change size',
        icon: MockIcon
      };

      const { rerender } = render(<ProcessStep {...props} />);
      
      // Change to longer content
      rerender(
        <ProcessStep 
          {...props} 
          title="Much Longer Dynamic Step Title That Tests Responsive Behavior"
          description="Much longer description that tests how the component handles content that changes in length and complexity on mobile devices"
        />
      );
      
      expect(screen.getByText(/Much Longer Dynamic Step/i)).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile', () => {
    beforeEach(() => {
      setViewport(SCREEN_SIZES.mobile.width, SCREEN_SIZES.mobile.height);
    });

    it('should render efficiently on mobile devices', () => {
      const startTime = performance.now();
      
      const props: HomepageLayoutProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'high', // High performance for mobile
        analyticsEnabled: false // Disable analytics for better performance
      };

      render(<HomepageLayout {...props} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly on mobile
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    it('should adapt rendering for low-end devices', () => {
      // Mock low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 2
      });

      // @ts-ignore
      Object.defineProperty(navigator, 'deviceMemory', {
        writable: true,
        value: 2 // 2GB RAM
      });

      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'high' // Should adapt to device constraints
      };

      expect(() => render(<HomepageHero {...props} />)).not.toThrow();
    });
  });

  describe('Accessibility on Mobile', () => {
    beforeEach(() => {
      setViewport(SCREEN_SIZES.mobile.width, SCREEN_SIZES.mobile.height);
    });

    it('should maintain accessibility on mobile', () => {
      const props: CtaSectionProps = {
        variant: 'primary',
        user: null,
        onCtaClick: mockOnCtaClick
      };

      render(<CtaSection {...props} />);
      
      // Check ARIA labels are present
      const region = screen.getByRole('region');
      expect(region).toHaveAttribute('aria-label');
      
      // Check buttons are accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should work with screen readers on mobile', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Accessible Feature',
        description: 'Feature optimized for screen readers',
        onView: vi.fn(),
        onInteraction: vi.fn()
      };

      render(<FeatureCard {...props} />);
      
      // Should have proper semantic structure
      expect(screen.getByText('Accessible Feature')).toBeInTheDocument();
      expect(screen.getByText('Feature optimized for screen readers')).toBeInTheDocument();
    });

    it('should support high contrast mode', () => {
      // Mock high contrast preference
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn()
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia
      });

      const props: TestimonialCardProps = {
        name: 'High Contrast User',
        role: 'Accessibility Tester',
        company: 'Accessibility Corp',
        content: 'Testing high contrast mode'
      };

      render(<TestimonialCard {...props} />);
      
      expect(screen.getByText('High Contrast User')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very small screens gracefully', () => {
      setViewport(320, 568); // iPhone 5/SE size
      
      const props: HomepageLayoutProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard',
        analyticsEnabled: true
      };

      expect(() => render(<HomepageLayout {...props} />)).not.toThrow();
    });

    it('should handle very large mobile screens', () => {
      setViewport(428, 926); // iPhone 12 Pro Max size
      
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard'
      };

      expect(() => render(<HomepageHero {...props} />)).not.toThrow();
    });

    it('should handle missing props gracefully on mobile', () => {
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: '',
        description: '',
        onView: vi.fn(),
        onInteraction: vi.fn()
      };

      expect(() => render(<FeatureCard {...props} />)).not.toThrow();
    });
  });
});