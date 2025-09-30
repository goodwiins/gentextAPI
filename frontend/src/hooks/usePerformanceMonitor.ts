import { useEffect, useState, useCallback, useRef } from 'react';
import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
import type { UsePerformanceMonitorReturn, PageViewMetrics, WebVitalsMetrics } from '@/types/analytics';
import type { 
  UsePerformanceMonitorReturn as ContractReturn,
  PerformanceMetrics 
} from '../../../specs/001-homepage-saas/contracts/frontend-components';
import { analyticsService } from '@/lib/analytics-service';

export function usePerformanceMonitor(): ContractReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({});

  const startTime = useRef<number>(Date.now());
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
    metricsRef.current = { ...metricsRef.current, ...newMetrics };
    
    const hasRequiredMetrics = 
      metricsRef.current.loadTime !== undefined &&
      metricsRef.current.lcp !== undefined &&
      metricsRef.current.fcp !== undefined &&
      metricsRef.current.cls !== undefined &&
      metricsRef.current.fid !== undefined;

    if (hasRequiredMetrics) {
      const completeMetrics = metricsRef.current as PerformanceMetrics;
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

  const stopMonitoring = useCallback((): PerformanceMetrics | null => {
    if (!isMonitoring) return metrics;

    setIsMonitoring(false);
    
    const finalLoadTime = Date.now() - startTime.current;
    const finalMetrics = {
      ...metricsRef.current,
      loadTime: finalLoadTime
    } as PerformanceMetrics;

    setMetrics(finalMetrics);
    return finalMetrics;
  }, [isMonitoring, metrics]);

  const reportMetrics = useCallback(async (): Promise<void> => {
    if (!metrics) {
      console.warn('No metrics available to report');
      return;
    }

    try {
      await analyticsService.trackPageViewMetrics(metrics);
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }, [metrics]);

  useEffect(() => {
    startMonitoring();
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [startMonitoring, stopMonitoring, isMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    reportMetrics
  };
}

export default usePerformanceMonitor;