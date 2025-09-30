# Error Tracking Setup Guide

## Overview

Configure comprehensive error tracking for the Homepage SAAS feature to catch and monitor production issues.

## Recommended: Sentry Integration

### 1. Install Sentry

```bash
cd frontend
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 2. Configure Sentry

Create `frontend/sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Custom integrations
  integrations: [
    new Sentry.BrowserTracing({
      traceFetch: true,
      traceXHR: true,
    }),
    new Sentry.Replay(),
  ],

  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive information
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
```

Create `frontend/sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 3. Add Error Boundaries

Already implemented in `frontend/src/components/home/HomepageLayout.tsx`, but you can enhance:

```typescript
import * as Sentry from '@sentry/nextjs';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function HomePage() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        Sentry.captureException(error, { contexts: { react: errorInfo } });
      }}
    >
      <HomepageLayout />
    </ErrorBoundary>
  );
}
```

## Alternative: Custom Error Tracking

If not using Sentry, implement custom error tracking:

### 1. Create Error Service

Create `frontend/src/lib/error-tracking.ts`:

```typescript
interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  componentStack?: string;
}

class ErrorTracker {
  private endpoint: string;
  private enabled: boolean;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT || '/api/errors';
    this.enabled = process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED === 'true';
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (!this.enabled) return;

    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    };

    // Send to backend
    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog),
    }).catch(console.error);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorLog);
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.enabled) return;

    const log = {
      message,
      level,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch(console.error);
  }

  setUser(userId: string) {
    // Store user context for error reports
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('error_tracking_user', userId);
    }
  }

  clearUser() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('error_tracking_user');
    }
  }
}

export const errorTracker = new ErrorTracker();
```

### 2. Global Error Handlers

Add to `frontend/src/pages/_app.tsx`:

```typescript
import { errorTracker } from '@/lib/error-tracking';

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.captureException(event.error, {
      type: 'window.onerror',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureException(
      new Error(event.reason),
      { type: 'unhandledrejection' }
    );
  });
}
```

### 3. Backend Error Endpoint

Create `server/src/api/errors.py`:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import logging

router = APIRouter(prefix="/errors", tags=["Error Tracking"])

logger = logging.getLogger(__name__)

class ErrorLog(BaseModel):
    message: str
    stack: Optional[str] = None
    timestamp: str
    url: str
    userAgent: str
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    level: str = "error"

@router.post("/")
async def log_error(error: ErrorLog):
    """
    Log frontend errors for monitoring and debugging
    """
    try:
        # Log to file/database/monitoring service
        logger.error(
            f"Frontend Error: {error.message}",
            extra={
                "stack": error.stack,
                "url": error.url,
                "userId": error.userId,
                "sessionId": error.sessionId,
                "userAgent": error.userAgent,
                "timestamp": error.timestamp,
            }
        )

        # Store in database for analysis
        # await error_service.store_error(error)

        return {"status": "logged", "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        logger.exception("Failed to log error")
        raise HTTPException(status_code=500, detail="Failed to log error")
```

## Error Categories to Track

### 1. Critical Errors
- Payment processing failures
- Authentication failures
- Data loss scenarios
- Security breaches

### 2. Performance Errors
- LCP > 4s
- CLS > 0.25
- Memory leaks
- Failed API calls

### 3. User Experience Errors
- Form validation failures
- Navigation errors
- Analytics tracking failures
- Asset loading failures

### 4. Business Logic Errors
- Conversion tracking failures
- Quiz generation failures
- User data inconsistencies

## Monitoring Dashboards

### Key Metrics to Track

1. **Error Rate**: Errors per 1000 sessions
2. **Unique Errors**: Distinct error messages
3. **Error Impact**: Users affected
4. **Resolution Time**: Time to fix
5. **Repeat Rate**: How often errors recur

### Alerting Rules

```typescript
// Configure alerts
const alertRules = {
  errorRate: {
    threshold: 0.01, // 1% error rate
    window: '5m',
    action: 'notify-team',
  },
  criticalError: {
    pattern: /payment|auth|security/i,
    action: 'page-oncall',
  },
  performanceError: {
    threshold: 10, // 10 LCP errors per minute
    action: 'investigate',
  },
};
```

## Integration with Analytics

Link errors with user sessions:

```typescript
import { errorTracker } from '@/lib/error-tracking';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';

function HomePage() {
  const { sessionId, userId } = useHomepageAnalytics();

  useEffect(() => {
    // Link errors to analytics session
    errorTracker.setContext({
      sessionId,
      userId,
    });
  }, [sessionId, userId]);
}
```

## Production Checklist

- [ ] Error tracking service configured (Sentry/custom)
- [ ] Error boundaries implemented
- [ ] Global error handlers setup
- [ ] Backend error endpoint created
- [ ] Alerting rules configured
- [ ] Error dashboard accessible
- [ ] Team notification channels setup
- [ ] Error retention policy defined
- [ ] GDPR compliance verified

## Testing Error Tracking

```typescript
// Test error capture
errorTracker.captureException(
  new Error('Test error from production'),
  { component: 'HomePage', action: 'test' }
);

// Test error boundary
function TestErrorComponent() {
  throw new Error('Test error boundary');
}
```

---

**Status**: Ready for configuration
**Recommended**: Sentry for comprehensive error tracking
**Alternative**: Custom solution with backend error logging
