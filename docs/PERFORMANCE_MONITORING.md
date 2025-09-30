# Performance Monitoring Setup Guide

## Overview

This guide explains how to enable and configure performance monitoring for the Homepage SAAS feature in production.

## Prerequisites

- Production environment configured
- Appwrite collections created
- Analytics backend deployed

## 1. Enable Performance Monitoring

### Frontend Configuration

Add to `frontend/.env.production`:

```bash
# Enable performance monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
NEXT_PUBLIC_PERFORMANCE_MODE=high

# Performance thresholds (milliseconds)
NEXT_PUBLIC_LCP_THRESHOLD=3000
NEXT_PUBLIC_FCP_THRESHOLD=1500
NEXT_PUBLIC_FID_THRESHOLD=100
NEXT_PUBLIC_CLS_THRESHOLD=0.1

# Monitoring interval (ms)
NEXT_PUBLIC_PERFORMANCE_SAMPLE_RATE=1.0  # Monitor 100% of sessions
NEXT_PUBLIC_PERFORMANCE_REPORT_INTERVAL=30000  # Report every 30s
```

### Backend Configuration

The performance monitoring is automatically enabled through the FastAPI middleware in `server/src/api/fastapi_app.py`.

## 2. Monitoring Features

### Automatic Tracking

The system automatically tracks:

- **Core Web Vitals**: LCP, FCP, CLS, FID, TTFB
- **Animation Performance**: Frame rates, dropped frames
- **Memory Usage**: Heap size, component memory
- **Network Performance**: API call latency, failed requests
- **User Sessions**: Duration, page views, interactions

### Manual Tracking

You can manually track custom metrics:

```typescript
import { performanceManager } from '@/lib/performance';

// Track custom metric
performanceManager.trackCustomMetric('checkout_duration', 5432);

// Track feature usage
performanceManager.trackFeatureUsage('payment_method', 'stripe');
```

## 3. Performance Dashboard

### Accessing Metrics

Metrics are stored in Appwrite collections and can be accessed via:

1. **Analytics API**:
   ```bash
   GET /analytics/homepage/summary?dateFrom=2025-01-01&dateTo=2025-01-31
   ```

2. **Appwrite Console**:
   - Navigate to your Appwrite project
   - Open the `homepage_metrics` collection
   - View documents and run queries

### Key Metrics to Monitor

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <2.5s | 2.5s - 4.0s | >4.0s |
| FCP | <1.8s | 1.8s - 3.0s | >3.0s |
| CLS | <0.1 | 0.1 - 0.25 | >0.25 |
| FID | <100ms | 100ms - 300ms | >300ms |
| TTFB | <600ms | 600ms - 1800ms | >1800ms |

## 4. Alerting Setup

### Threshold Alerts

Configure alerts for performance degradation:

```typescript
// In frontend/src/lib/performance.ts
const performanceConfig = {
  alerts: {
    lcp: {
      warning: 2500,
      critical: 4000,
    },
    fcp: {
      warning: 1500,
      critical: 3000,
    },
    memoryUsage: {
      warning: 50 * 1024 * 1024, // 50MB
      critical: 100 * 1024 * 1024, // 100MB
    }
  }
};
```

### Error Tracking Integration

If using Sentry or similar:

```typescript
import * as Sentry from '@sentry/nextjs';

// Report performance issues to Sentry
if (metrics.lcp > LCP_THRESHOLD) {
  Sentry.captureMessage('Poor LCP performance', {
    level: 'warning',
    extra: { lcp: metrics.lcp }
  });
}
```

## 5. Performance Optimization

### Adaptive Performance

The system automatically adjusts based on device capabilities:

```typescript
// Automatically detected
const deviceCapability = detectDeviceCapability();

// Performance modes:
// - 'high': Full animations, all features
// - 'standard': Reduced animations, core features
// - 'minimal': No animations, essential features only
```

### Bundle Size Optimization

Monitor bundle size in production:

```bash
# Analyze bundle
npm run build
npm run analyze

# Check specific chunks
ls -lh .next/static/chunks/
```

### Lazy Loading Strategy

Components are lazy-loaded based on viewport visibility:

```typescript
// Automatically applied via useIntersectionObserver
const { isIntersecting } = useIntersectionObserver(ref, {
  threshold: 0.1,
  triggerOnce: true
});
```

## 6. Production Monitoring Tools

### Recommended Tools

1. **Real User Monitoring (RUM)**:
   - Google Analytics with Web Vitals
   - Vercel Analytics (if using Vercel)
   - Custom analytics dashboard

2. **Synthetic Monitoring**:
   - Lighthouse CI
   - WebPageTest
   - Calibre or SpeedCurve

3. **Error Tracking**:
   - Sentry
   - LogRocket
   - Rollbar

### Setting Up Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Configure lighthouse CI
# Create lighthouserc.js in project root
```

Example `lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['https://yourdomain.com/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}],
        'first-contentful-paint': ['error', {maxNumericValue: 1500}],
        'largest-contentful-paint': ['error', {maxNumericValue: 3000}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],
      },
    },
  },
};
```

## 7. Performance Budget

### Current Budget

```json
{
  "bundles": {
    "homepage": {
      "maxSize": "500KB",
      "current": "~420KB"
    }
  },
  "metrics": {
    "lcp": {
      "target": "1500ms",
      "max": "3000ms"
    },
    "fcp": {
      "target": "1000ms",
      "max": "1500ms"
    },
    "cls": {
      "target": "0.05",
      "max": "0.1"
    }
  }
}
```

### Monitoring Budget

```bash
# Check bundle size
npm run build && du -sh .next/static

# Alert if exceeds budget
if [ $(du -s .next/static | cut -f1) -gt 512000 ]; then
  echo "❌ Bundle size exceeds 500KB budget"
  exit 1
fi
```

## 8. Continuous Monitoring

### GitHub Actions Workflow

Create `.github/workflows/performance.yml`:

```yaml
name: Performance Monitoring

on:
  push:
    branches: [main, 001-homepage-saas]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.yourdomain.com/
          uploadArtifacts: true
```

## 9. Debugging Performance Issues

### Enable Debug Mode

```bash
# Frontend
NEXT_PUBLIC_DEBUG_PERFORMANCE=true npm run dev

# Backend
DEBUG=true python main.py
```

### Performance Profiling

```typescript
// Enable profiling in browser DevTools
// Or use the built-in profiler:

import { performanceManager } from '@/lib/performance';

performanceManager.startProfiling('homepage_load');
// ... your code ...
performanceManager.stopProfiling('homepage_load');
```

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| High LCP | Large images | Use Next.js Image, WebP format |
| High CLS | Dynamic content | Reserve space, use aspect ratio |
| High FID | Heavy JS execution | Code splitting, defer non-critical JS |
| Memory leaks | Event listeners | Proper cleanup in useEffect |

## 10. Reporting and Analytics

### Weekly Performance Report

Automated report includes:
- Average Core Web Vitals
- Performance trends
- Top performing/underperforming pages
- Device-specific metrics
- Conversion impact of performance

### Query Performance Data

```bash
# Get last 7 days of metrics
curl -X GET "https://api.yourdomain.com/analytics/homepage/summary?dateFrom=2025-01-23&dateTo=2025-01-30"

# Export to CSV for analysis
curl -X GET "https://api.yourdomain.com/analytics/homepage/summary?format=csv" > performance.csv
```

---

**Last Updated**: 2025-01-30
**Monitoring Status**: ✅ Configured and Ready
