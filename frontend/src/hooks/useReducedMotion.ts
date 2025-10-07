import { useEffect, useState } from 'react';

/**
 * Hook to detect user's motion preferences
 * Respects prefers-reduced-motion CSS media query
 * @returns boolean indicating if motion should be reduced
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Utility function to get motion-safe animation props
 * @param prefersReducedMotion - boolean from useReducedMotion hook
 * @param animationProps - animation properties to apply when motion is enabled
 * @param reducedMotionProps - alternative properties for reduced motion
 */
export function getMotionProps(
  prefersReducedMotion: boolean,
  animationProps: Record<string, any>,
  reducedMotionProps: Record<string, any> = {}
) {
  return prefersReducedMotion ? reducedMotionProps : animationProps;
}