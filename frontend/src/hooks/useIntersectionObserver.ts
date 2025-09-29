/**
 * useIntersectionObserver Hook
 * React hook for tracking element visibility and intersection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { UseIntersectionObserverReturn } from '@/types/analytics';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<Element>, UseIntersectionObserverReturn] {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
    enabled = true
  } = options;

  const elementRef = useRef<Element>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [observerEntry] = entries;
    setEntry(observerEntry);
    setIsIntersecting(observerEntry.isIntersecting);

    if (observerEntry.isIntersecting) {
      setHasBeenVisible(true);

      // Disconnect observer if triggerOnce is enabled
      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }
  }, [triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Check if IntersectionObserver is supported
    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver is not supported');
      setIsIntersecting(true);
      setHasBeenVisible(true);
      return;
    }

    // Create observer if it doesn't exist or options changed
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        threshold,
        root,
        rootMargin
      });
    }

    // Start observing
    observerRef.current.observe(element);

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, root, rootMargin, enabled, handleIntersection]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return [elementRef, { isIntersecting, hasBeenVisible, entry }];
}

/**
 * Hook variant for tracking multiple thresholds
 */
export function useIntersectionObserverWithThresholds(
  thresholds: number[] = [0, 0.25, 0.5, 0.75, 1],
  options: Omit<UseIntersectionObserverOptions, 'threshold'> = {}
): [React.RefObject<Element>, UseIntersectionObserverReturn & { intersectionRatio: number; visibleThresholds: number[] }] {
  const [ref, observerReturn] = useIntersectionObserver({
    ...options,
    threshold: thresholds
  });

  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [visibleThresholds, setVisibleThresholds] = useState<number[]>([]);

  useEffect(() => {
    if (observerReturn.entry) {
      const ratio = observerReturn.entry.intersectionRatio;
      setIntersectionRatio(ratio);

      // Track which thresholds have been crossed
      const crossedThresholds = thresholds.filter(threshold => ratio >= threshold);
      setVisibleThresholds(prev => {
        const newThresholds = [...new Set([...prev, ...crossedThresholds])];
        return newThresholds.sort((a, b) => a - b);
      });
    }
  }, [observerReturn.entry, thresholds]);

  return [ref, { ...observerReturn, intersectionRatio, visibleThresholds }];
}

/**
 * Hook for tracking when element enters viewport
 */
export function useViewportEntry(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<Element>, { hasEntered: boolean; entryTime: number | null }] {
  const [ref, { hasBeenVisible }] = useIntersectionObserver({
    ...options,
    triggerOnce: true
  });

  const [entryTime, setEntryTime] = useState<number | null>(null);

  useEffect(() => {
    if (hasBeenVisible && entryTime === null) {
      setEntryTime(Date.now());
    }
  }, [hasBeenVisible, entryTime]);

  return [ref, { hasEntered: hasBeenVisible, entryTime }];
}

export default useIntersectionObserver;