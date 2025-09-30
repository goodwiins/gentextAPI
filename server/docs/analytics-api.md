# Analytics API Documentation

## Overview

The GenText Analytics API provides comprehensive tracking and reporting capabilities for homepage performance metrics, user engagement, and conversion events. This REST API is built with FastAPI and provides real-time analytics data collection with background processing for optimal performance.

## Base URL

```
https://api.gentext.app/analytics
```

## Authentication

Currently, the analytics endpoints are publicly accessible for data collection. Future versions may include API key authentication for data retrieval endpoints.

## Rate Limiting

- **Data Collection Endpoints**: 100 requests per minute per IP
- **Data Retrieval Endpoints**: 50 requests per minute per IP

## API Endpoints

### 1. Track Homepage Metrics

Collects Core Web Vitals and page performance data.

**Endpoint:** `POST /analytics/homepage/metrics`

**Request Body:**
```json
{
  "sessionId": "string",
  "userId": "string (optional)",
  "timestamp": "string (ISO 8601)",
  "pageView": {
    "loadTime": "number (0-30000)",
    "lcp": "number (0-10000)",
    "fcp": "number (0-10000)",
    "cls": "number (0-1)",
    "fid": "number (0-1000)"
  },
  "userAgent": "string",
  "viewport": {
    "width": "number (320-5000)",
    "height": "number (240-5000)"
  },
  "referrer": "string (optional)"
}
```

**Response:**
```json
{
  "id": "string",
  "status": "success",
  "message": "Homepage metrics recorded successfully",
  "timestamp": "string (ISO 8601)"
}
```

**Example:**
```bash
curl -X POST "https://api.gentext.app/analytics/homepage/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_123456789",
    "userId": "user_987654321",
    "timestamp": "2024-01-15T10:30:00Z",
    "pageView": {
      "loadTime": 1200,
      "lcp": 2500,
      "fcp": 1100,
      "cls": 0.05,
      "fid": 50
    },
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "referrer": "https://google.com"
  }'
```

### 2. Track Conversion Events

Records user conversion actions such as CTA clicks, sign-ups, and other goal completions.

**Endpoint:** `POST /analytics/homepage/conversions`

**Request Body:**
```json
{
  "sessionId": "string",
  "userId": "string (optional)",
  "eventType": "string",
  "eventData": {
    "ctaText": "string",
    "ctaPosition": "string",
    "scrollDepth": "number (0-100)",
    "timeOnPage": "number"
  },
  "timestamp": "string (ISO 8601)",
  "successful": "boolean",
  "errorMessage": "string (optional)"
}
```

**Valid Event Types:**
- `signup_clicked`
- `login_clicked`
- `generate_clicked`
- `learn_more_clicked`
- `contact_clicked`

**Valid CTA Positions:**
- `hero`
- `features`
- `how-it-works`
- `testimonials`
- `footer`

**Response:**
```json
{
  "id": "string",
  "status": "success",
  "message": "Conversion event recorded successfully",
  "timestamp": "string (ISO 8601)"
}
```

**Example:**
```bash
curl -X POST "https://api.gentext.app/analytics/homepage/conversions" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_123456789",
    "userId": "user_987654321",
    "eventType": "signup_clicked",
    "eventData": {
      "ctaText": "Get Started Free",
      "ctaPosition": "hero",
      "scrollDepth": 25,
      "timeOnPage": 45000
    },
    "timestamp": "2024-01-15T10:35:00Z",
    "successful": true
  }'
```

### 3. Track Feature Engagement

Records user interactions with specific homepage sections and features.

**Endpoint:** `POST /analytics/homepage/engagement`

**Request Body:**
```json
{
  "sessionId": "string",
  "sectionName": "string",
  "engagementType": "string",
  "duration": "number (0-300000)",
  "scrollDepth": "number (0-100)",
  "interactions": "number",
  "timestamp": "string (ISO 8601)"
}
```

**Valid Section Names:**
- `hero`
- `features`
- `testimonials`
- `how-it-works`
- `cta`
- `footer`

**Valid Engagement Types:**
- `view`
- `interact`
- `complete_view`

**Response:**
```json
{
  "id": "string",
  "status": "success",
  "message": "Feature engagement recorded successfully",
  "timestamp": "string (ISO 8601)"
}
```

**Example:**
```bash
curl -X POST "https://api.gentext.app/analytics/homepage/engagement" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_123456789",
    "sectionName": "features",
    "engagementType": "interact",
    "duration": 15000,
    "scrollDepth": 60,
    "interactions": 3,
    "timestamp": "2024-01-15T10:32:00Z"
  }'
```

### 4. Get Analytics Summary

Retrieves aggregated analytics data for a specified date range.

**Endpoint:** `GET /analytics/homepage/summary`

**Query Parameters:**
- `dateFrom` (optional): Start date in ISO 8601 format
- `dateTo` (optional): End date in ISO 8601 format
- `groupBy` (optional): Time grouping (`hour`, `day`, `week`, `month`) - default: `day`

**Response:**
```json
{
  "dateRange": {
    "from": "string (ISO 8601)",
    "to": "string (ISO 8601)"
  },
  "totalPageViews": "number",
  "uniqueVisitors": "number",
  "averageLoadTime": "number",
  "conversionRate": "number",
  "topConversionEvents": [
    {
      "eventType": "string",
      "count": "number",
      "conversionRate": "number"
    }
  ],
  "performanceMetrics": {
    "average_lcp": "number",
    "average_fcp": "number",
    "average_cls": "number",
    "average_fid": "number"
  },
  "sectionEngagement": [
    {
      "sectionName": "string",
      "viewRate": "number",
      "averageDuration": "number",
      "interactionRate": "number"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "https://api.gentext.app/analytics/homepage/summary?dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z&groupBy=day"
```

### 5. Health Check

Checks the health status of the analytics service.

**Endpoint:** `GET /analytics/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "analytics",
  "timestamp": "string (ISO 8601)"
}
```

## Data Models

### Core Web Vitals Metrics

| Metric | Description | Range | Unit |
|--------|-------------|-------|------|
| `loadTime` | Page load time | 0-30000 | milliseconds |
| `lcp` | Largest Contentful Paint | 0-10000 | milliseconds |
| `fcp` | First Contentful Paint | 0-10000 | milliseconds |
| `cls` | Cumulative Layout Shift | 0-1 | ratio |
| `fid` | First Input Delay | 0-1000 | milliseconds |

### Performance Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FCP | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |

## Error Responses

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters or data |
| 422 | Validation Error - Data doesn't meet schema requirements |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "detail": "Error description",
  "status_code": 400,
  "timestamp": "string (ISO 8601)"
}
```

## Implementation Examples

### JavaScript Frontend Integration

```javascript
// Initialize analytics tracking
class GenTextAnalytics {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.apiBase = 'https://api.gentext.app/analytics';
  }

  // Track page metrics
  async trackPageMetrics(metrics) {
    const payload = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      pageView: metrics.pageView,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer || null
    };

    try {
      const response = await fetch(`${this.apiBase}/homepage/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Analytics error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to track page metrics:', error);
    }
  }

  // Track conversion events
  async trackConversion(eventType, ctaText, ctaPosition, scrollDepth, timeOnPage) {
    const payload = {
      sessionId: this.sessionId,
      eventType,
      eventData: {
        ctaText,
        ctaPosition,
        scrollDepth,
        timeOnPage
      },
      timestamp: new Date().toISOString(),
      successful: true
    };

    try {
      const response = await fetch(`${this.apiBase}/homepage/conversions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }

  // Track section engagement
  async trackEngagement(sectionName, engagementType, duration, scrollDepth, interactions) {
    const payload = {
      sessionId: this.sessionId,
      sectionName,
      engagementType,
      duration,
      scrollDepth,
      interactions,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.apiBase}/homepage/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }
}

// Usage example
const analytics = new GenTextAnalytics('sess_' + Math.random().toString(36).substr(2, 9));

// Track Core Web Vitals
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      analytics.trackPageMetrics({
        pageView: {
          loadTime: performance.now(),
          lcp: entry.startTime,
          fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          cls: 0, // Calculate from layout shift entries
          fid: 0  // Calculate from first input delay
        }
      });
    }
  }
}).observe({ entryTypes: ['largest-contentful-paint'] });
```

### React Hook Integration

```jsx
import { useEffect, useCallback } from 'react';

export const useAnalytics = (sessionId) => {
  const trackPageMetrics = useCallback(async (metrics) => {
    // Implementation similar to above
  }, [sessionId]);

  const trackConversion = useCallback(async (eventType, eventData) => {
    // Implementation similar to above
  }, [sessionId]);

  const trackEngagement = useCallback(async (sectionName, engagementData) => {
    // Implementation similar to above
  }, [sessionId]);

  return {
    trackPageMetrics,
    trackConversion,
    trackEngagement
  };
};
```

## Data Privacy & GDPR Compliance

### Data Retention
- Analytics data is automatically cleaned up after 90 days
- Users can request data deletion at any time
- No personally identifiable information (PII) is stored without consent

### Data Processing
- All data collection happens with explicit user consent
- Session IDs are randomly generated and don't contain personal information
- User IDs are only included when users are authenticated and have consented

### Data Export
- Users can request their analytics data export
- Data is provided in machine-readable JSON format
- Export includes all data associated with their user ID

## Performance Considerations

### Background Processing
- All data storage operations run in background tasks
- API responses are immediate, data processing is asynchronous
- No blocking operations affect user experience

### Caching
- Summary data is cached for 5 minutes to reduce database load
- Cache invalidation happens on new data ingestion
- Regional CDN caching for static responses

### Database Optimization
- Indexes on timestamp and sessionId fields
- Automatic data partitioning by date
- Query optimization for large datasets

## Monitoring & Alerts

### Health Monitoring
- Service health checks every 30 seconds
- Database connection monitoring
- API response time tracking

### Error Alerts
- Failed request rate > 5%
- Database connection failures
- Data processing queue backlog

### Performance Alerts
- Average response time > 200ms
- 95th percentile response time > 500ms
- Database query time > 1s

## API Versioning

Current version: `v1`

Future versions will maintain backward compatibility for at least 12 months. Breaking changes will be communicated 90 days in advance.

### Version Headers
```
API-Version: v1
```

## Support

For API support, please contact:
- Email: api-support@gentext.app
- Documentation: https://docs.gentext.app/analytics
- Status Page: https://status.gentext.app

---

*Last updated: January 2024*
*API Version: v1.0.0*