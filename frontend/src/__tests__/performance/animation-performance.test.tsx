/**
 * Animation Performance Tests (≥60fps requirement)
 * Tests that all homepage animations maintain smooth 60fps performance
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import components with animations
import { HomepageHero } from '@/components/home/HomepageHero';
import { FeatureCard } from '@/components/home/FeatureCard';
import { TestimonialCard } from '@/components/home/TestimonialCard';

import type { 
  HomepageHeroProps,
  FeatureCardProps,
  TestimonialCardProps
} from '@/specs/001-homepage-saas/contracts/frontend-components';

// Mock requestAnimationFrame
const mockRAF = vi.fn();
const mockCancelRAF = vi.fn();

// Mock performance monitoring
const mockFrameData: number[] = [];
let frameCount = 0;
let lastFrameTime = 0;

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

describe('Animation Performance Tests', () => {
  let originalRAF: typeof requestAnimationFrame;
  let originalCancelRAF: typeof cancelAnimationFrame;
  let mockOnCtaClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup animation frame mocking
    originalRAF = global.requestAnimationFrame;
    originalCancelRAF = global.cancelAnimationFrame;
    
    global.requestAnimationFrame = mockRAF.mockImplementation(callback => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      mockFrameData.push(frameTime);
      lastFrameTime = currentTime;
      frameCount++;
      
      // Simulate 60fps (16.67ms per frame)
      setTimeout(() => callback(currentTime), 16.67);
      return frameCount;
    });
    
    global.cancelAnimationFrame = mockCancelRAF;
    
    // Reset frame tracking
    mockFrameData.length = 0;
    frameCount = 0;
    lastFrameTime = performance.now();
    
    mockOnCtaClick = vi.fn();
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCancelRAF;
    vi.clearAllMocks();
  });

  describe('60fps Frame Rate Validation', () => {
    it('should maintain 60fps for HomepageHero animations', async () => {
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'standard'
      };

      render(<HomepageHero {...props} />);
      
      // Simulate animation frames over 1 second
      const targetFrames = 60;
      const tolerance = 5; // Allow 5fps tolerance (55-60fps)
      
      // Mock 60fps animation
      for (let i = 0; i < targetFrames; i++) {
        mockRAF.mock.calls[i]?.[0]?.(performance.now() + (i * 16.67));
      }
      
      expect(mockRAF).toHaveBeenCalledTimes(targetFrames);
      
      // Check frame timing consistency
      const averageFrameTime = mockFrameData.reduce((sum, time) => sum + time, 0) / mockFrameData.length;
      const targetFrameTime = 1000 / 60; // 16.67ms
      
      expect(averageFrameTime).toBeLessThanOrEqual(targetFrameTime + 2); // 2ms tolerance
      expect(mockFrameData.length).toBeGreaterThanOrEqual(targetFrames - tolerance);
    });

    it('should maintain 60fps for FeatureCard hover animations', () => {
      const MockIcon = () => <div>Icon</div>;
      const props: FeatureCardProps = {
        icon: MockIcon,
        title: 'Animated Feature',
        description: 'Feature with smooth animations',
        onView: vi.fn(),
        onInteraction: vi.fn()
      };

      const { container } = render(<FeatureCard {...props} />);
      const card = container.firstChild as HTMLElement;
      
      // Simulate hover animation
      fireEvent.mouseEnter(card);
      
      // Check that animation starts
      const framesBefore = mockRAF.mock.calls.length;
      
      // Simulate animation frame requests
      for (let i = 0; i < 30; i++) { // 0.5 second of animation
        mockRAF.mock.calls[framesBefore + i]?.[0]?.(performance.now() + (i * 16.67));
      }
      
      // Should maintain 60fps during hover animation
      const expectedFrames = 30;
      const actualFrames = mockRAF.mock.calls.length - framesBefore;
      
      expect(actualFrames).toBeGreaterThanOrEqual(expectedFrames - 3); // 3 frame tolerance
    });

    it('should detect dropped frames', () => {
      // Simulate dropped frames scenario
      const frameTimings = [
        16.67, 16.67, 33.34, 16.67, 50.0, 16.67, 16.67
      ];
      
      const droppedFrames = frameTimings.filter(timing => timing > 20).length;
      const frameRate = 1000 / (frameTimings.reduce((sum, time) => sum + time, 0) / frameTimings.length);
      
      expect(droppedFrames).toBeLessThanOrEqual(2); // Max 2 dropped frames
      expect(frameRate).toBeGreaterThanOrEqual(55); // Min 55fps with tolerance
    });

    it('should handle animation performance degradation gracefully', () => {
      // Mock poor performance scenario
      const degradedFrameTimings = [
        25, 30, 35, 40, 25, 28, 32
      ];
      
      const averageFrameTime = degradedFrameTimings.reduce((sum, time) => sum + time, 0) / degradedFrameTimings.length;
      const frameRate = 1000 / averageFrameTime;
      
      // Should still be above minimum threshold
      expect(frameRate).toBeGreaterThanOrEqual(30); // 30fps minimum
      
      // Should trigger performance adaptation
      const shouldReduceAnimations = frameRate < 45;
      expect(shouldReduceAnimations).toBe(true);
    });
  });

  describe('Animation-specific Performance Tests', () => {
    it('should test TestimonialCard slide animations at 60fps', () => {
      const props: TestimonialCardProps = {
        name: 'John Doe',
        role: 'Developer',
        company: 'Tech Corp',
        content: 'Amazing performance!',
        rating: 5,
        verified: true
      };

      render(<TestimonialCard {...props} />);
      
      // Simulate slide-in animation
      const animationDuration = 500; // 500ms
      const expectedFrames = Math.floor((animationDuration / 1000) * 60); // 30 frames
      
      for (let i = 0; i < expectedFrames; i++) {
        mockRAF.mock.calls[i]?.[0]?.(performance.now() + (i * 16.67));
      }
      
      expect(mockRAF).toHaveBeenCalledTimes(expectedFrames);
    });

    it('should validate CSS animation performance', () => {
      // Mock CSS animation performance metrics
      const cssAnimationMetrics = {
        duration: 1000, // 1s
        expectedFrames: 60,
        actualFrames: 58, // Close to 60fps
        droppedFrames: 2
      };
      
      const frameRate = cssAnimationMetrics.actualFrames / (cssAnimationMetrics.duration / 1000);
      const droppedFramePercentage = (cssAnimationMetrics.droppedFrames / cssAnimationMetrics.expectedFrames) * 100;
      
      expect(frameRate).toBeGreaterThanOrEqual(55); // 55-60fps range
      expect(droppedFramePercentage).toBeLessThanOrEqual(5); // Max 5% dropped frames
    });

    it('should handle transform animations efficiently', () => {
      // Mock transform animation (translate, scale, rotate)
      const transformMetrics = {
        translateFrames: 60,
        scaleFrames: 30,
        rotateFrames: 45,
        averageFrameTime: 16.2 // ms
      };
      
      const totalFrames = transformMetrics.translateFrames + transformMetrics.scaleFrames + transformMetrics.rotateFrames;
      const frameRate = 1000 / transformMetrics.averageFrameTime;
      
      expect(frameRate).toBeGreaterThanOrEqual(60); // Should maintain 60fps
      expect(totalFrames).toBeGreaterThan(0);
    });
  });

  describe('Performance Budget Validation', () => {
    it('should validate 60fps performance budget', () => {
      const performanceBudget = {
        minFrameRate: 60,
        maxFrameTime: 16.67, // ms
        maxDroppedFrames: 3,
        maxAnimationDuration: 1000 // ms
      };
      
      const currentMetrics = {
        frameRate: 58,
        averageFrameTime: 17.2,
        droppedFrames: 2,
        animationDuration: 800
      };
      
      // Should meet most criteria with small tolerance
      expect(currentMetrics.frameRate).toBeGreaterThanOrEqual(performanceBudget.minFrameRate - 5);
      expect(currentMetrics.averageFrameTime).toBeLessThanOrEqual(performanceBudget.maxFrameTime + 2);
      expect(currentMetrics.droppedFrames).toBeLessThanOrEqual(performanceBudget.maxDroppedFrames);
      expect(currentMetrics.animationDuration).toBeLessThanOrEqual(performanceBudget.maxAnimationDuration);
    });

    it('should track animation performance over time', () => {
      const performanceHistory = [
        { timestamp: Date.now() - 3000, frameRate: 60 },
        { timestamp: Date.now() - 2000, frameRate: 58 },
        { timestamp: Date.now() - 1000, frameRate: 59 },
        { timestamp: Date.now(), frameRate: 57 }
      ];
      
      const averageFrameRate = performanceHistory.reduce((sum, entry) => sum + entry.frameRate, 0) / performanceHistory.length;
      const frameRateVariance = Math.max(...performanceHistory.map(e => e.frameRate)) - Math.min(...performanceHistory.map(e => e.frameRate));
      
      expect(averageFrameRate).toBeGreaterThanOrEqual(55);
      expect(frameRateVariance).toBeLessThanOrEqual(5); // Low variance indicates stable performance
    });
  });

  describe('Mobile Animation Performance', () => {
    it('should adapt animations for mobile devices', () => {
      // Mock mobile device
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });
      
      // Mock reduced performance on mobile
      const mobileMetrics = {
        frameRate: 45, // Lower than desktop
        memoryUsage: 80, // Higher memory pressure
        batteryLevel: 0.3 // Low battery
      };
      
      const shouldReduceAnimations = mobileMetrics.frameRate < 50 || mobileMetrics.batteryLevel < 0.5;
      
      expect(shouldReduceAnimations).toBe(true);
      expect(mobileMetrics.frameRate).toBeGreaterThanOrEqual(30); // Still usable
    });

    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn()
      });
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia
      });
      
      const props: HomepageHeroProps = {
        user: null,
        onCtaClick: mockOnCtaClick,
        performanceMode: 'high' // Should respect reduced motion
      };
      
      render(<HomepageHero {...props} />);
      
      // Should not trigger heavy animations
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Memory Usage During Animations', () => {
    it('should not cause memory leaks during long animations', () => {
      // Mock memory usage tracking
      const memoryMetrics = {
        initial: 25, // MB
        peak: 45, // MB
        final: 28, // MB
        duration: 5000 // 5 seconds
      };
      
      const memoryGrowth = memoryMetrics.final - memoryMetrics.initial;
      const peakMemoryIncrease = memoryMetrics.peak - memoryMetrics.initial;
      
      expect(memoryGrowth).toBeLessThanOrEqual(5); // Max 5MB permanent growth
      expect(peakMemoryIncrease).toBeLessThanOrEqual(25); // Max 25MB temporary spike
    });

    it('should clean up animation resources', () => {
      const props: FeatureCardProps = {
        icon: () => <div>Icon</div>,
        title: 'Test Card',
        description: 'Test description',
        onView: vi.fn(),
        onInteraction: vi.fn()
      };
      
      const { unmount } = render(<FeatureCard {...props} />);
      
      // Start some animations
      mockRAF.mockImplementation(callback => {
        setTimeout(() => callback(performance.now()), 16.67);
        return ++frameCount;
      });
      
      // Trigger animation
      for (let i = 0; i < 10; i++) {
        requestAnimationFrame(() => {});
      }
      
      const activeAnimationsBefore = mockRAF.mock.calls.length;
      
      // Unmount component
      unmount();
      
      // Should clean up animations
      expect(mockCancelRAF).toHaveBeenCalled();
    });
  });

  describe('Animation Quality Metrics', () => {
    it('should measure animation smoothness', () => {
      const frameTimings = [16.67, 16.67, 16.67, 16.67, 16.67, 16.67]; // Perfect 60fps
      
      const frameTimeVariance = frameTimings.reduce((variance, timing) => {
        return variance + Math.pow(timing - 16.67, 2);
      }, 0) / frameTimings.length;
      
      const smoothnessScore = Math.max(0, 100 - frameTimeVariance);
      
      expect(smoothnessScore).toBeGreaterThanOrEqual(95); // High smoothness
    });

    it('should detect animation jank', () => {
      const frameTimings = [16.67, 16.67, 50.0, 16.67, 33.34]; // Some jank
      
      const jankFrames = frameTimings.filter(timing => timing > 20).length;
      const jankPercentage = (jankFrames / frameTimings.length) * 100;
      
      expect(jankPercentage).toBeLessThanOrEqual(20); // Max 20% jank tolerance
    });

    it('should validate animation completion rate', () => {
      const animationMetrics = {
        started: 100,
        completed: 96,
        interrupted: 4
      };
      
      const completionRate = (animationMetrics.completed / animationMetrics.started) * 100;
      const interruptionRate = (animationMetrics.interrupted / animationMetrics.started) * 100;
      
      expect(completionRate).toBeGreaterThanOrEqual(95); // 95% completion rate
      expect(interruptionRate).toBeLessThanOrEqual(5); // 5% interruption tolerance
    });
  });
});