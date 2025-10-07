import { useState, useEffect } from 'react';

interface UseResponsiveOptions {
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  debounceMs?: number;
}

interface UseResponsiveReturn {
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

const DEFAULT_BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
};

export function useResponsive(options: UseResponsiveOptions = {}): UseResponsiveReturn {
  const { breakpoints = DEFAULT_BREAKPOINTS, debounceMs = 150 } = options;

  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Handle window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine breakpoint based on width
  const getBreakpoint = (width: number): 'mobile' | 'tablet' | 'desktop' => {
    if (width >= breakpoints.desktop) return 'desktop';
    if (width >= breakpoints.tablet) return 'tablet';
    return 'mobile';
  };

  const breakpoint = getBreakpoint(windowSize.width);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    width: windowSize.width,
    height: windowSize.height,
  };
}