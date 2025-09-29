import { useEffect, useState, useCallback, useRef } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
import { performanceManager } from '@/lib/performance';
import type { UsePerformanceMonitorReturn, PageViewMetrics, WebVitalsMetrics } from '@/types/analytics';

export function usePerformanceMonitor(): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PageViewMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});

  const startTime = useRef<number>(Date.now());
  const metricsRef = useRef<Partial<PageViewMetrics>>({});

  const updateMetrics = useCallback((newMetrics: Partial<PageViewMetrics>) => {
    metricsRef.current = { ...metricsRef.current, ...newMetrics };
    
    const hasRequiredMetrics = 
      metricsRef.current.loadTime !== undefined &&
      metricsRef.current.lcp !== undefined &&
      metricsRef.current.fcp !== undefined &&
      metricsRef.current.cls !== undefined &&
      metricsRef.current.fid !== undefined;

    if (hasRequiredMetrics) {
      const completeMetrics = metricsRef.current as PageViewMetrics;
      setMetrics(completeMetrics);
    }
  }, []);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    startTime.current = Date.now();

    try {
      onLCP((metric) => {
        const lcp = Math.round(metric.value);
        setWebVitals(prev => ({ ...prev, lcp }));
        updateMetrics({ lcp });
      });

      onFCP((metric) => {
        const fcp = Math.round(metric.value);
        setWebVitals(prev => ({ ...prev, fcp }));
        updateMetrics({ fcp });
      });

      onCLS((metric) => {
        const cls = Math.round(metric.value * 1000) / 1000;
        setWebVitals(prev => ({ ...prev, cls }));
        updateMetrics({ cls });
      });

      onFID((metric) => {
        const fid = Math.round(metric.value);
        setWebVitals(prev => ({ ...prev, fid }));
        updateMetrics({ fid });
      });

      onTTFB((metric) => {
        const ttfb = Math.round(metric.value);
        setWebVitals(prev => ({ ...prev, ttfb }));
        updateMetrics({ ttfb });
      });

    } catch (error) {
      console.warn('Web Vitals not supported:', error);
    }

    const loadTime = Date.now() - startTime.current;
    updateMetrics({ loadTime });
  }, [isMonitoring, updateMetrics]);

  const stopMonitoring = useCallback((): PageViewMetrics | null => {
    if (!isMonitoring) return metrics;

    setIsMonitoring(false);
    
    const finalLoadTime = Date.now() - startTime.current;
    const finalMetrics = {
      ...metricsRef.current,
      loadTime: finalLoadTime
    } as PageViewMetrics;

    setMetrics(finalMetrics);
    return finalMetrics;
  }, [isMonitoring, metrics]);

  const reportMetrics = useCallback(async (): Promise<void> => {
    if (!metrics) {
      console.warn('No metrics available to report');
      return;
    }
  }, [metrics]);

  useEffect(() => {
    startMonitoring();
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, []);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    reportMetrics,
    webVitals
  };
}

export default usePerformanceMonitor;