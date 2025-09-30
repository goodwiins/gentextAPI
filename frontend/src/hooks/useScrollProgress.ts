/**
 * useScrollProgress Hook
 * React hook for tracking scroll progress and direction
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useThrottledCallback } from 'use-debounce';
import type { UseScrollProgressReturn } from '@/types/analytics';
import type { UseScrollProgressReturn as ContractReturn } from '../../../specs/001-homepage-saas/contracts/frontend-components';

interface UseScrollProgressOptions {
  throttleMs?: number;
  element?: React.RefObject<Element>;
  trackDirection?: boolean;
  trackVelocity?: boolean;
}

export function useScrollProgress(
  options: UseScrollProgressOptions = {}
): ContractReturn {
  const {
    throttleMs = 16, // ~60fps
    element,
    trackDirection = true,
    trackVelocity = false
  } = options;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'none'>('none');
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [elementProgress, setElementProgress] = useState<number>();

  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const velocityRef = useRef(0);

  const calculateProgress = useCallback(() => {
    const targetElement = element?.current;
    const scrollContainer = targetElement || document.documentElement;
    const isWindow = !targetElement;

    const scrollTop = isWindow 
      ? window.pageYOffset || document.documentElement.scrollTop
      : scrollContainer.scrollTop;

    const scrollHeight = isWindow
      ? document.documentElement.scrollHeight - window.innerHeight
      : scrollContainer.scrollHeight - scrollContainer.clientHeight;

    // Calculate overall scroll progress
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    const clampedProgress = Math.max(0, Math.min(100, progress));

    setScrollProgress(clampedProgress);

    // Track position states
    setIsAtTop(scrollTop <= 5); // Small threshold for floating point precision
    setIsAtBottom(clampedProgress >= 99); // Small threshold for bottom detection

    // Track scroll direction
    if (trackDirection) {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastScrollTime.current;
      const deltaScroll = scrollTop - lastScrollTop.current;

      if (Math.abs(deltaScroll) > 1) { // Ignore very small movements
        setScrollDirection(deltaScroll > 0 ? 'down' : 'up');

        // Calculate velocity if enabled
        if (trackVelocity && deltaTime > 0) {
          velocityRef.current = Math.abs(deltaScroll) / deltaTime;
        }
      }

      lastScrollTop.current = scrollTop;
      lastScrollTime.current = currentTime;
    }

    // Calculate element-specific progress if element ref provided
    if (targetElement) {
      const elementRect = targetElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the element is visible
      const elementTop = elementRect.top;
      const elementHeight = elementRect.height;
      
      let elementProgressValue = 0;
      
      if (elementTop < windowHeight && elementTop + elementHeight > 0) {
        // Element is at least partially visible
        const visibleTop = Math.max(0, -elementTop);
        const visibleBottom = Math.min(elementHeight, windowHeight - elementTop);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        elementProgressValue = (visibleHeight / elementHeight) * 100;
      }
      
      setElementProgress(Math.max(0, Math.min(100, elementProgressValue)));
    }
  }, [element, trackDirection, trackVelocity]);

  // Throttled scroll handler
  const throttledCalculateProgress = useThrottledCallback(
    calculateProgress,
    throttleMs,
    { leading: true, trailing: true }
  );

  useEffect(() => {
    const scrollContainer = element?.current || window;
    const isWindow = scrollContainer === window;

    // Initial calculation
    calculateProgress();

    // Event listener
    const handleScroll = () => {
      throttledCalculateProgress();
    };

    if (isWindow) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
    } else {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (isWindow) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      } else {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      
      // Cancel any pending throttled calls
      throttledCalculateProgress.cancel();
    };
  }, [element, throttledCalculateProgress, calculateProgress]);

  return {
    scrollProgress,
    scrollDirection,
    isAtTop,
    isAtBottom
  };
}

/**
 * Hook for tracking scroll progress within a specific section
 */
export function useSectionScrollProgress(
  sectionRef: React.RefObject<Element>,
  options: Omit<UseScrollProgressOptions, 'element'> = {}
): UseScrollProgressReturn & {
  sectionProgress: number;
  isFullyVisible: boolean;
  isPartiallyVisible: boolean;
} {
  const scrollData = useScrollProgress({ ...options, element: sectionRef });
  const [sectionProgress, setSectionProgress] = useState(0);
  const [isFullyVisible, setIsFullyVisible] = useState(false);
  const [isPartiallyVisible, setIsPartiallyVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const calculateSectionProgress = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check visibility states
      const fullyVisible = rect.top >= 0 && rect.bottom <= windowHeight;
      const partiallyVisible = rect.top < windowHeight && rect.bottom > 0;
      
      setIsFullyVisible(fullyVisible);
      setIsPartiallyVisible(partiallyVisible);
      
      // Calculate progress through the section
      if (partiallyVisible) {
        const sectionHeight = rect.height;
        const viewportCenter = windowHeight / 2;
        const sectionCenter = rect.top + sectionHeight / 2;
        
        // Progress based on how close the section center is to viewport center
        const distanceFromCenter = Math.abs(viewportCenter - sectionCenter);
        const maxDistance = windowHeight / 2 + sectionHeight / 2;
        
        const progress = Math.max(0, (maxDistance - distanceFromCenter) / maxDistance) * 100;
        setSectionProgress(progress);
      } else {
        setSectionProgress(0);
      }
    };

    calculateSectionProgress();

    const handleScroll = () => {
      calculateSectionProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [sectionRef]);

  return {
    ...scrollData,
    sectionProgress,
    isFullyVisible,
    isPartiallyVisible
  };
}

/**
 * Hook for tracking reading progress through content
 */
export function useReadingProgress(
  contentRef: React.RefObject<Element>,
  options: UseScrollProgressOptions = {}
): {
  readingProgress: number;
  estimatedTimeRemaining: number;
  wordsPerMinute: number;
} {
  const [readingProgress, setReadingProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [wordsPerMinute] = useState(200); // Average reading speed

  const { scrollProgress } = useScrollProgress({ ...options, element: contentRef });

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    // Estimate reading progress based on scroll position
    const progress = scrollProgress;
    setReadingProgress(progress);

    // Estimate time remaining
    const textContent = element.textContent || '';
    const wordCount = textContent.split(/\s+/).length;
    const wordsRemaining = wordCount * ((100 - progress) / 100);
    const timeRemaining = (wordsRemaining / wordsPerMinute) * 60; // in seconds

    setEstimatedTimeRemaining(Math.max(0, timeRemaining));
  }, [scrollProgress, contentRef, wordsPerMinute]);

  return {
    readingProgress,
    estimatedTimeRemaining,
    wordsPerMinute
  };
}

export default useScrollProgress;