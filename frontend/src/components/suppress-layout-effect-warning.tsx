'use client';

import { useEffect } from 'react';

// This component suppresses the useLayoutEffect warning from Framer Motion in development
export function SuppressLayoutEffectWarning() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Suppress the specific useLayoutEffect warning from Framer Motion
        if (typeof args[0] === 'string' && 
            args[0].includes('useLayoutEffect does nothing on the server') &&
            args[0].includes('ShadowPortal')) {
          return;
        }
        originalConsoleError(...args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    }
  }, []);

  return null;
}