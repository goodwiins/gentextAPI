# Homepage API Contracts

**Feature**: Improve Homepage Design and User Experience
**Version**: 1.0.0
**Date**: 2025-10-06

## Overview

This document defines the API contracts for the homepage feature, including data fetching endpoints and response formats.

## Data Models

### Homepage Configuration
```typescript
interface HomepageConfig {
  sections: HomepageSection[];
  globalSettings: GlobalSettings;
  version: string;
  lastUpdated: string;
}

interface GlobalSettings {
  theme: 'light' | 'dark' | 'auto';
  animations: {
    enabled: boolean;
    reducedMotion: boolean;
    duration: number; // in milliseconds
  };
  performance: {
    lazyLoadImages: boolean;
    prefetchCriticalResources: boolean;
  };
}
```

### User Statistics
```typescript
interface UserStats {
  userId: string;
  quizzesCreated: number;
  questionsGenerated: number;
  averageQuestionsPerQuiz: number;
  lastQuizDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Endpoints

### 1. Get Homepage Configuration

**Endpoint**: `GET /api/homepage/config`

**Description**: Retrieves the homepage configuration including all sections and settings.

**Query Parameters**:
- `breakpoint` (optional): `'mobile' | 'tablet' | 'desktop'` - Current viewport breakpoint
- `auth` (optional): `boolean` - Whether user is authenticated

**Response**:
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "id": "hero-1",
        "type": "hero",
        "title": "Generate AI-Powered Quizzes",
        "content": {
          "headline": "Create engaging quizzes in seconds",
          "subheadline": "AI-powered question generation for educators and content creators",
          "primaryCTA": {
            "text": "Start Creating",
            "url": "/signup",
            "variant": "primary",
            "size": "lg"
          },
          "secondaryCTA": {
            "text": "Learn More",
            "url": "/features",
            "variant": "outline",
            "size": "md"
          },
          "backgroundType": "gradient"
        },
        "isVisible": true,
        "order": 1,
        "responsiveConfig": {
          "mobile": { "enabled": true, "spacing": "compact", "fontSize": "base" },
          "tablet": { "enabled": true, "spacing": "normal", "fontSize": "lg" },
          "desktop": { "enabled": true, "spacing": "comfortable", "fontSize": "xl" }
        }
      }
    ],
    "globalSettings": {
      "theme": "auto",
      "animations": {
        "enabled": true,
        "reducedMotion": false,
        "duration": 300
      },
      "performance": {
        "lazyLoadImages": true,
        "prefetchCriticalResources": true
      }
    },
    "version": "1.0.0",
    "lastUpdated": "2025-10-06T12:00:00Z"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "CONFIG_NOT_FOUND",
    "message": "Homepage configuration not available",
    "details": {}
  }
}
```

### 2. Get User Statistics

**Endpoint**: `GET /api/user/stats`

**Description**: Retrieves user-specific statistics for personalized homepage content.

**Headers**:
- `Authorization`: Bearer token (required)

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "quizzesCreated": 15,
    "questionsGenerated": 342,
    "averageQuestionsPerQuiz": 22.8,
    "lastQuizDate": "2025-10-05T14:30:00Z",
    "createdAt": "2025-09-01T10:00:00Z",
    "updatedAt": "2025-10-05T14:30:00Z"
  }
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": {}
  }
}
```

404 Not Found:
```json
{
  "success": false,
  "error": {
    "code": "USER_STATS_NOT_FOUND",
    "message": "User statistics not available",
    "details": {}
  }
}
```

### 3. Update User Preferences

**Endpoint**: `PUT /api/user/preferences`

**Description**: Updates user preferences for homepage display and behavior.

**Headers**:
- `Authorization`: Bearer token (required)
- `Content-Type`: application/json

**Request Body**:
```json
{
  "homepage": {
    "preferredSections": ["hero", "features", "benefits"],
    "animationPreferences": {
      "enabled": true,
      "reducedMotion": false
    },
    "theme": "auto"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "preferencesUpdated": true,
    "timestamp": "2025-10-06T12:00:00Z"
  }
}
```

## Response Standards

### Success Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-06T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

## Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `CONFIG_NOT_FOUND` | 404 | Homepage configuration is not available |
| `UNAUTHORIZED` | 401 | User is not authenticated |
| `USER_STATS_NOT_FOUND` | 404 | User statistics are not available |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

- **Homepage Config**: 100 requests per minute per IP
- **User Stats**: 60 requests per minute per authenticated user
- **User Preferences**: 20 requests per minute per authenticated user

## Caching Strategy

- **Homepage Config**: Cache for 5 minutes, CDN edge caching
- **User Stats**: Cache for 1 minute, user-specific cache
- **User Preferences**: No caching (real-time updates)

## Security Considerations

- All endpoints require proper authentication where specified
- Sensitive user data is masked in logs
- CORS policies restrict cross-origin requests
- Rate limiting prevents abuse
- Input validation prevents injection attacks

## Performance Requirements

- **Homepage Config**: < 200ms response time (p95)
- **User Stats**: < 300ms response time (p95)
- **User Preferences**: < 150ms response time (p95)
- All responses must be gzip compressed
- Responses must include appropriate cache headers