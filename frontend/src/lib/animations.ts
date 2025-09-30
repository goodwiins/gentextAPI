/**
 * Animation Utilities Library for Aceternity UI Integration
 * Performance-optimized animation helpers and configuration utilities
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { 
  AceternityAnimationProps, 
  AnimationSequence, 
  IntersectionAnimationOptions,
  AnimationState 
} from '@/types/aceternity';

// ============================================================================
// ANIMATION TIMING UTILITIES
// ============================================================================

export const EASING_PRESETS = {
  // Standard easings
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Custom cubic bezier easings
  bounceIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  bounceOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  backIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // Smooth easings for UI
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Aceternity-optimized
  aceternityDefault: 'cubic-bezier(0.16, 1, 0.3, 1)',
  aceternityBounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

export const DURATION_PRESETS = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 750,
  slowest: 1000,
  
  // Aceternity-optimized durations
  aceternityFast: 200,
  aceternityNormal: 400,
  aceternity3D: 600,
} as const;

/**
 * Calculate optimal animation duration based on distance/complexity
 */
export function calculateOptimalDuration(
  distance: number,
  baseSpeed: number = 300
): number {
  const minDuration = 200;
  const maxDuration = 1000;
  const calculated = Math.sqrt(distance) * baseSpeed;
  
  return Math.max(minDuration, Math.min(maxDuration, calculated));
}

/**
 * Create spring animation config
 */
export function createSpringConfig(
  tension: number = 300,
  friction: number = 30
): { tension: number; friction: number } {
  return { tension, friction };
}

// ============================================================================
// REDUCED MOTION UTILITIES
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Get reduced motion animation props
 */
export function getReducedMotionProps(
  originalProps: AceternityAnimationProps
): AceternityAnimationProps {
  if (!prefersReducedMotion()) return originalProps;
  
  return {
    ...originalProps,
    duration: Math.min(originalProps.duration || 300, 150),
    easing: EASING_PRESETS.linear,
    reduceMotion: true,
  };
}

/**
 * Conditional animation helper
 */
export function conditionalAnimation<T>(
  shouldAnimate: boolean,
  animatedValue: T,
  staticValue: T
): T {
  return shouldAnimate && !prefersReducedMotion() ? animatedValue : staticValue;
}

// ============================================================================
// INTERSECTION OBSERVER UTILITIES
// ============================================================================

/**
 * Create intersection observer for viewport-based animations
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };
  
  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Hook for intersection-based animations
 */
export function useIntersectionAnimation(
  options: IntersectionAnimationOptions
): {
  ref: React.RefObject<Element>;
  isVisible: boolean;
  hasAnimated: boolean;
} {
  const elementRef = useRef<Element>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && !hasAnimated) {
          setHasAnimated(true);
        }
      });
    },
    [hasAnimated]
  );
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = createIntersectionObserver(observerCallback, {
      threshold: options.threshold,
      rootMargin: options.rootMargin,
    });
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [observerCallback, options.threshold, options.rootMargin]);
  
  return {
    ref: elementRef,
    isVisible,
    hasAnimated: options.triggerOnce ? hasAnimated : isVisible,
  };
}

// ============================================================================
// ANIMATION QUEUE MANAGEMENT
// ============================================================================

export class AnimationQueue {
  private queue: Array<{
    id: string;
    animation: () => Promise<void>;
    priority: number;
  }> = [];
  
  private isProcessing = false;
  private maxConcurrent = 3;
  private activeAnimations = new Set<string>();
  
  /**
   * Add animation to queue
   */
  add(
    id: string,
    animation: () => Promise<void>,
    priority: number = 0
  ): void {
    this.queue.push({ id, animation, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessing) {
      this.process();
    }
  }
  
  /**
   * Remove animation from queue
   */
  remove(id: string): void {
    this.queue = this.queue.filter(item => item.id !== id);
    this.activeAnimations.delete(id);
  }
  
  /**
   * Clear all animations
   */
  clear(): void {
    this.queue = [];
    this.activeAnimations.clear();
  }
  
  /**
   * Process animation queue
   */
  private async process(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0 && this.activeAnimations.size < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;
      
      this.activeAnimations.add(item.id);
      
      item.animation()
        .catch((error) => {
          console.warn(`Animation ${item.id} failed:`, error);
        })
        .finally(() => {
          this.activeAnimations.delete(item.id);
          
          // Continue processing if there are more items
          if (this.queue.length > 0) {
            this.process();
          }
        });
    }
    
    if (this.activeAnimations.size === 0) {
      this.isProcessing = false;
    }
  }
  
  /**
   * Get queue status
   */
  getStatus(): {
    queued: number;
    active: number;
    total: number;
  } {
    return {
      queued: this.queue.length,
      active: this.activeAnimations.size,
      total: this.queue.length + this.activeAnimations.size,
    };
  }
}

// Global animation queue instance
export const globalAnimationQueue = new AnimationQueue();

// ============================================================================
// PERFORMANCE-OPTIMIZED ANIMATION HELPERS
// ============================================================================

/**
 * Throttle animation frame requests
 */
export function throttleAnimationFrame<T extends (...args: any[]) => void>(
  callback: T
): T {
  let ticking = false;
  
  return ((...args: Parameters<T>) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback(...args);
        ticking = false;
      });
      ticking = true;
    }
  }) as T;
}

/**
 * Debounce with requestAnimationFrame
 */
export function debounceAnimationFrame<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 16
): T {
  let timeoutId: number;
  let rafId: number;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
    
    timeoutId = window.setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        callback(...args);
      });
    }, delay);
  }) as T;
}

/**
 * Create optimized CSS transform string
 */
export function createTransform({
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  scale = 1,
  skewX = 0,
  skewY = 0,
}: {
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
  scale?: number;
  skewX?: number | string;
  skewY?: number | string;
} = {}): string {
  const transforms: string[] = [];
  
  if (translateX || translateY || translateZ) {
    transforms.push(`translate3d(${translateX}px, ${translateY}px, ${translateZ}px)`);
  }
  
  if (rotateX) transforms.push(`rotateX(${rotateX}deg)`);
  if (rotateY) transforms.push(`rotateY(${rotateY}deg)`);
  if (rotateZ) transforms.push(`rotateZ(${rotateZ}deg)`);
  if (scale !== 1) transforms.push(`scale(${scale})`);
  if (skewX) transforms.push(`skewX(${skewX}deg)`);
  if (skewY) transforms.push(`skewY(${skewY}deg)`);
  
  return transforms.join(' ');
}

// ============================================================================
// ANIMATION SEQUENCE UTILITIES
// ============================================================================

/**
 * Create sequential animation timeline
 */
export async function runAnimationSequence(
  sequence: AnimationSequence,
  element: HTMLElement
): Promise<void> {
  const { steps, loop = false, direction = 'normal' } = sequence;
  
  const runSequence = async () => {
    const stepsToRun = direction === 'reverse' ? [...steps].reverse() : steps;
    
    for (const step of stepsToRun) {
      await new Promise<void>((resolve) => {
        if (step.delay) {
          setTimeout(() => {
            animate(element, step, resolve);
          }, step.delay);
        } else {
          animate(element, step, resolve);
        }
      });
    }
  };
  
  await runSequence();
  
  if (loop) {
    // Continue looping (in a real implementation, you'd want a way to stop this)
    await runAnimationSequence(sequence, element);
  }
}

function animate(
  element: HTMLElement,
  step: AnimationSequence['steps'][0],
  onComplete: () => void
): void {
  const { duration, easing = EASING_PRESETS.smooth, properties } = step;
  
  // Apply CSS transition
  element.style.transition = `all ${duration}ms ${easing}`;
  
  // Apply properties
  Object.entries(properties).forEach(([key, value]) => {
    (element.style as any)[key] = value;
  });
  
  // Complete after duration
  setTimeout(onComplete, duration);
}

// ============================================================================
// CUSTOM HOOKS FOR ANIMATIONS
// ============================================================================

/**
 * Hook for managing animation state
 */
export function useAnimationState(
  initialState: AnimationState = 'idle'
): {
  state: AnimationState;
  start: () => void;
  pause: () => void;
  finish: () => void;
  error: () => void;
  reset: () => void;
} {
  const [state, setState] = useState<AnimationState>(initialState);
  
  const start = useCallback(() => setState('running'), []);
  const pause = useCallback(() => setState('paused'), []);
  const finish = useCallback(() => setState('finished'), []);
  const error = useCallback(() => setState('error'), []);
  const reset = useCallback(() => setState('idle'), []);
  
  return { state, start, pause, finish, error, reset };
}

/**
 * Hook for scroll-based animations
 */
export function useScrollAnimation(
  threshold: number = 0.1
): {
  scrollY: number;
  progress: number;
  isScrolling: boolean;
} {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const handleScroll = throttleAnimationFrame(() => {
    setScrollY(window.scrollY);
    setIsScrolling(true);
    
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  });
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  const progress = useMemo(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
  }, [scrollY]);
  
  return { scrollY, progress, isScrolling };
}

/**
 * Hook for mouse-based animations
 */
export function useMouseAnimation(): {
  mouseX: number;
  mouseY: number;
  isHovering: boolean;
} {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  const handleMouseMove = throttleAnimationFrame((event: MouseEvent) => {
    setMouseX(event.clientX);
    setMouseY(event.clientY);
  });
  
  useEffect(() => {
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove]);
  
  return { mouseX, mouseY, isHovering };
}

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Announce animation state changes for screen readers
 */
export function announceAnimationState(
  state: AnimationState,
  componentName: string
): void {
  if (!('speechSynthesis' in window)) return;
  
  const messages = {
    running: `${componentName} animation started`,
    finished: `${componentName} animation completed`,
    error: `${componentName} animation failed`,
    paused: `${componentName} animation paused`,
    idle: '',
  };
  
  const message = messages[state];
  if (message) {
    // Use aria-live region instead of speech synthesis for better compatibility
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Debug animation performance
 */
export function debugAnimationPerformance(
  animationName: string,
  startTime: number
): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`🎬 Animation "${animationName}" took ${duration.toFixed(2)}ms`);
  
  if (duration > 16) {
    console.warn(`⚠️ Animation "${animationName}" may cause frame drops`);
  }
}