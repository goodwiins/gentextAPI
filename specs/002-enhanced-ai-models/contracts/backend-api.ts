# Enhanced AI Models - Backend API Contracts

## Overview
This document defines the API contracts for the Enhanced AI Models feature, ensuring consistent interfaces between frontend and backend services.

## REST API Endpoints

### AI Provider Management

#### GET /api/v1/providers
Get all available AI providers and their status.

**Response:**
```json
{
  "providers": [
    {
      "id": "openai-gpt-4",
      "name": "OpenAI GPT-4",
      "status": "online",
      "capabilities": {
        "supportedQuestionTypes": ["multiple-choice", "short-answer", "essay"],
        "maxContextLength": 8192,
        "maxOutputTokens": 4096,
        "supportsStreaming": true,
        "supportsBatch": true,
        "supportsFunctionCalling": true,
        "supportsJsonMode": true,
        "languages": ["en", "es", "fr", "de"],
        "domains": ["general", "academic", "technical"]
      },
      "performance": {
        "averageResponseTime": 1200,
        "uptime": 99.9,
        "successRate": 98.5
      },
      "cost": {
        "inputTokenPrice": 0.03,
        "outputTokenPrice": 0.06,
        "currency": "USD"
      },
      "limits": {
        "requestsPerMinute": 60,
        "requestsPerHour": 3600,
        "tokensPerMinute": 90000,
        "concurrentRequests": 5
      }
    }
  ]
}
```

#### GET /api/v1/providers/{providerId}
Get detailed information about a specific provider.

**Response:**
```json
{
  "provider": {
    "id": "openai-gpt-4",
    "name": "OpenAI GPT-4",
    "apiVersion": "2023-06-01",
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-4",
    "config": {
      "temperature": 0.7,
      "maxTokens": 1000,
      "topP": 0.9
    },
    "status": {
      "isAvailable": true,
      "lastHealthCheck": "2023-12-01T10:00:00Z",
      "responseTime": 1200,
      "errorRate": 0.015,
      "uptime": 99.9,
      "consecutiveFailures": 0
    }
  }
}
```

#### POST /api/v1/providers/{providerId}/health-check
Manually trigger health check for a provider.

**Response:**
```json
{
  "status": "healthy",
  "responseTime": 1180,
  "timestamp": "2023-12-01T10:05:00Z",
  "metrics": {
    "tokenCount": 100,
    "validResponse": true,
    "errorFree": true
  }
}
```

### Question Generation

#### POST /api/v1/questions/generate
Generate questions using AI models.

**Request:**
```json
{
  "content": "The solar system consists of the Sun and the objects that orbit it, including eight planets...",
  "questionTypes": ["multiple-choice", "short-answer"],
  "difficulty": "intermediate",
  "questionCount": 5,
  "context": {
    "domain": "science",
    "topic": "astronomy",
    "audience": "high-school",
    "language": "en",
    "educationalLevel": "k10"
  },
  "modelSelection": {
    "strategy": "auto",
    "preferredProviders": ["openai-gpt-4"],
    "maxCost": 0.50,
    "minQuality": 0.8
  },
  "options": {
    "includeExplanations": true,
    "includeHints": false,
    "difficultyVariation": true,
    "questionVariations": 1,
    "validationLevel": "strict",
    "outputFormat": "json",
    "includeMetadata": true
  },
  "priority": "normal"
}
```

**Response:**
```json
{
  "requestId": "gen_123456789",
  "status": "processing",
  "questions": [
    {
      "id": "q_123456789",
      "type": "multiple-choice",
      "question": "Which planet is known as the Red Planet?",
      "options": ["Venus", "Mars", "Jupiter", "Saturn"],
      "correctAnswer": "Mars",
      "explanation": "Mars appears red due to iron oxide on its surface.",
      "difficulty": "intermediate",
      "topic": "planets",
      "domain": "science",
      "metadata": {
        "tokensUsed": 45,
        "processingTime": 1200,
        "provider": "openai-gpt-4",
        "model": "gpt-4",
        "cost": 0.012
      },
      "qualityScore": 0.92,
      "confidence": 0.95
    }
  ],
  "provider": {
    "id": "openai-gpt-4",
    "name": "OpenAI GPT-4"
  },
  "modelUsed": "gpt-4",
  "metrics": {
    "totalQuestions": 5,
    "successfulQuestions": 5,
    "failedQuestions": 0,
    "averageResponseTime": 1200,
    "totalTokensUsed": 245,
    "averageQualityScore": 0.89
  },
  "cost": {
    "inputTokens": 120,
    "outputTokens": 125,
    "inputCost": 0.0036,
    "outputCost": 0.0075,
    "totalCost": 0.0111,
    "currency": "USD"
  },
  "performance": {
    "requestStartTime": "2023-12-01T10:00:00Z",
    "requestEndTime": "2023-12-01T10:00:01.2Z",
    "totalTime": 1200,
    "apiCallTime": 1150,
    "processingTime": 50
  },
  "createdAt": "2023-12-01T10:00:00Z"
}
```

#### GET /api/v1/questions/generate/{requestId}
Get the status and results of a generation request.

**Response:**
```json
{
  "requestId": "gen_123456789",
  "status": "completed",
  "progress": {
    "totalQuestions": 5,
    "completedQuestions": 5,
    "failedQuestions": 0,
    "inProgressQuestions": 0,
    "percentageComplete": 100,
    "estimatedTimeRemaining": 0
  },
  "results": [...],
  "errors": [],
  "metrics": {...},
  "createdAt": "2023-12-01T10:00:00Z",
  "completedAt": "2023-12-01T10:00:01.2Z"
}
```

#### POST /api/v1/questions/regenerate/{questionId}
Regenerate a specific question.

**Request:**
```json
{
  "originalQuestion": {
    "id": "q_123456789",
    "type": "multiple-choice",
    "question": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctAnswer": "Mars"
  },
  "reason": "Need more challenging options",
  "options": {
    "adjustDifficulty": "harder",
    "changeFocus": "different aspect"
  }
}
```

**Response:**
```json
{
  "question": {
    "id": "q_987654321",
    "type": "multiple-choice",
    "question": "What causes Mars to appear red from Earth?",
    "options": [
      "Atmospheric scattering of light",
      "Iron oxide (rust) on its surface",
      "Volcanic activity",
      "Reflection from the Sun"
    ],
    "correctAnswer": "Iron oxide (rust) on its surface",
    "explanation": "Mars' reddish appearance is primarily due to iron oxide minerals covering its surface.",
    "difficulty": "advanced",
    "qualityScore": 0.94,
    "confidence": 0.96
  }
}
```

### Batch Generation

#### POST /api/v1/batch/generate
Generate questions in batch from uploaded content.

**Request:**
```json
{
  "files": [
    {
      "filename": "science_textbook_chapter3.pdf",
      "content": "base64-encoded-content",
      "mimeType": "application/pdf"
    }
  ],
  "config": {
    "questionTypes": ["multiple-choice", "true-false"],
    "difficulty": "intermediate",
    "questionsPerSection": 10,
    "options": {
      "includeExplanations": true,
      "validationLevel": "strict"
    }
  },
  "priority": "normal",
  "callbackUrl": "https://example.com/webhook",
  "notificationSettings": {
    "email": true,
    "webhook": true,
    "inApp": false
  }
}
```

**Response:**
```json
{
  "batchId": "batch_123456789",
  "status": "queued",
  "estimatedProcessingTime": 300,
  "totalItems": 1,
  "createdAt": "2023-12-01T10:00:00Z"
}
```

#### GET /api/v1/batch/{batchId}
Get batch generation status and results.

**Response:**
```json
{
  "batchId": "batch_123456789",
  "status": "completed",
  "progress": {
    "totalRequests": 1,
    "completedRequests": 1,
    "failedRequests": 0,
    "percentageComplete": 100
  },
  "results": [
    {
      "requestId": "gen_123456789",
      "filename": "science_textbook_chapter3.pdf",
      "questions": [...],
      "metrics": {...}
    }
  ],
  "errors": [],
  "metrics": {
    "totalRequests": 1,
    "successfulRequests": 1,
    "failedRequests": 0,
    "averageProcessingTime": 180,
    "totalCost": 0.25
  },
  "createdAt": "2023-12-01T10:00:00Z",
  "completedAt": "2023-12-01T10:03:00Z"
}
```

### Performance Monitoring

#### GET /api/v1/metrics/providers
Get performance metrics for all providers.

**Query Parameters:**
- `timeRange`: 1h, 24h, 7d, 30d, 90d
- `providerIds`: comma-separated list of provider IDs
- `metrics`: comma-separated list of metrics to include

**Response:**
```json
{
  "timeRange": "24h",
  "providers": [
    {
      "providerId": "openai-gpt-4",
      "name": "OpenAI GPT-4",
      "metrics": {
        "requests": {
          "total": 1250,
          "successful": 1230,
          "failed": 20,
          "successRate": 98.4
        },
        "performance": {
          "averageResponseTime": 1180,
          "minResponseTime": 450,
          "maxResponseTime": 3200,
          "p95ResponseTime": 2100,
          "p99ResponseTime": 2800
        },
        "quality": {
          "averageQualityScore": 0.91,
          "userSatisfaction": 4.3,
          "feedbackCount": 156
        },
        "cost": {
          "totalCost": 45.60,
          "averageCostPerRequest": 0.036,
          "averageCostPerToken": 0.000045
        }
      },
      "trends": {
        "requestVolume": [
          {"timestamp": "2023-12-01T00:00:00Z", "value": 52},
          {"timestamp": "2023-12-01T01:00:00Z", "value": 48}
        ],
        "responseTime": [
          {"timestamp": "2023-12-01T00:00:00Z", "value": 1150},
          {"timestamp": "2023-12-01T01:00:00Z", "value": 1200}
        ]
      }
    }
  ],
  "summary": {
    "totalRequests": 1250,
    "averageResponseTime": 1180,
    "totalCost": 45.60,
    "averageQualityScore": 0.91
  }
}
```

#### GET /api/v1/metrics/costs
Get cost analysis and breakdown.

**Query Parameters:**
- `timeRange`: 1h, 24h, 7d, 30d, 90d
- `groupBy`: provider, user, questionType

**Response:**
```json
{
  "timeRange": "30d",
  "costs": {
    "total": 1250.50,
    "byProvider": [
      {
        "providerId": "openai-gpt-4",
        "providerName": "OpenAI GPT-4",
        "cost": 890.30,
        "percentage": 71.2,
        "tokens": 245000,
        "requests": 7850
      },
      {
        "providerId": "anthropic-claude",
        "providerName": "Anthropic Claude",
        "cost": 360.20,
        "percentage": 28.8,
        "tokens": 180000,
        "requests": 4200
      }
    ],
    "byUser": [
      {
        "userId": "user_123",
        "cost": 125.50,
        "requests": 320,
        "percentage": 10.0
      }
    ],
    "byQuestionType": [
      {
        "type": "multiple-choice",
        "cost": 625.25,
        "percentage": 50.0,
        "count": 12500
      }
    ],
    "forecast": {
      "projectedMonthly": 1500,
      "projectedDaily": 50,
      "trend": "increasing",
      "confidence": 0.85
    }
  }
}
```

### Feedback and Ratings

#### POST /api/v1/questions/{questionId}/rate
Rate a generated question and provide feedback.

**Request:**
```json
{
  "rating": 4,
  "feedback": "Good question but the explanation could be more detailed",
  "feedbackType": "quality",
  "helpful": true,
  "suggestions": ["Add more scientific context"]
}
```

**Response:**
```json
{
  "ratingId": "rate_123456789",
  "questionId": "q_123456789",
  "userId": "user_123",
  "rating": 4,
  "feedback": "Good question but the explanation could be more detailed",
  "feedbackType": "quality",
  "helpful": true,
  "suggestions": ["Add more scientific context"],
  "timestamp": "2023-12-01T10:00:00Z"
}
```

#### GET /api/v1/questions/{questionId}/feedback
Get all feedback for a specific question.

**Response:**
```json
{
  "questionId": "q_123456789",
  "feedback": {
    "averageRating": 4.2,
    "totalRatings": 25,
    "ratingDistribution": {
      "1": 1,
      "2": 2,
      "3": 5,
      "4": 10,
      "5": 7
    },
    "comments": [
      {
        "id": "comm_123",
        "userId": "user_456",
        "rating": 4,
        "comment": "Clear and accurate",
        "helpful": true,
        "helpfulCount": 8,
        "timestamp": "2023-12-01T09:00:00Z"
      }
    ],
    "commonIssues": ["explanations too brief"],
    "improvementSuggestions": ["add more context"],
    "lastUpdated": "2023-12-01T10:00:00Z"
  }
}
```

## WebSocket Events

### Real-time Generation Updates

#### Client connects to: wss://api.example.com/ws/generate/{requestId}

**Events from Server:**
```json
{
  "event": "generation_started",
  "requestId": "gen_123456789",
  "timestamp": "2023-12-01T10:00:00Z",
  "data": {
    "provider": "openai-gpt-4",
    "model": "gpt-4",
    "estimatedQuestions": 5,
    "estimatedTime": 2000
  }
}
```

```json
{
  "event": "question_generated",
  "requestId": "gen_123456789",
  "timestamp": "2023-12-01T10:00:00.4Z",
  "data": {
    "questionNumber": 1,
    "question": {...},
    "qualityScore": 0.92,
    "processingTime": 400
  }
}
```

```json
{
  "event": "generation_progress",
  "requestId": "gen_123456789",
  "timestamp": "2023-12-01T10:00:00.8Z",
  "data": {
    "completedQuestions": 2,
    "totalQuestions": 5,
    "percentage": 40,
    "averageQualityScore": 0.89,
    "currentCost": 0.0089
  }
}
```

```json
{
  "event": "generation_completed",
  "requestId": "gen_123456789",
  "timestamp": "2023-12-01T10:00:01.2Z",
  "data": {
    "totalQuestions": 5,
    "successfulQuestions": 5,
    "failedQuestions": 0,
    "totalTime": 1200,
    "totalCost": 0.0223,
    "averageQualityScore": 0.91
  }
}
```

### Batch Generation Updates

#### Client connects to: wss://api.example.com/ws/batch/{batchId}

**Events from Server:**
```json
{
  "event": "batch_started",
  "batchId": "batch_123456789",
  "timestamp": "2023-12-01T10:00:00Z",
  "data": {
    "totalItems": 1,
    "estimatedTime": 300
  }
}
```

```json
{
  "event": "batch_progress",
  "batchId": "batch_123456789",
  "timestamp": "2023-12-01T10:01:00Z",
  "data": {
    "completedItems": 1,
    "totalItems": 1,
    "percentage": 100,
    "results": [...]
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Please wait before making another request.",
    "details": {
      "limit": 60,
      "window": "minute",
      "current": 65,
      "retryAfter": 30
    },
    "timestamp": "2023-12-01T10:00:00Z",
    "requestId": "req_123456789"
  }
}
```

### Common Error Codes
- `INVALID_REQUEST`: Malformed request body or parameters
- `AUTHENTICATION_FAILED`: Invalid API key or authentication
- `AUTHORIZATION_FAILED`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: API rate limits exceeded
- `QUOTA_EXCEEDED`: Usage quota exceeded
- `PROVIDER_UNAVAILABLE`: AI provider service is down
- `CONTENT_TOO_LONG`: Input content exceeds maximum length
- `INVALID_CONTENT`: Unsupported content type or format
- `GENERATION_FAILED`: Question generation failed
- `BATCH_TOO_LARGE`: Batch size exceeds limits
- `FILE_UPLOAD_FAILED`: File upload processing failed

## Webhook Payloads

### Generation Complete Webhook
```json
{
  "event": "generation.completed",
  "requestId": "gen_123456789",
  "userId": "user_123",
  "timestamp": "2023-12-01T10:00:01.2Z",
  "data": {
    "status": "completed",
    "totalQuestions": 5,
    "successfulQuestions": 5,
    "totalCost": 0.0223,
    "averageQualityScore": 0.91,
    "results": [...]
  }
}
```

### Batch Complete Webhook
```json
{
  "event": "batch.completed",
  "batchId": "batch_123456789",
  "userId": "user_123",
  "timestamp": "2023-12-01T10:03:00Z",
  "data": {
    "status": "completed",
    "totalItems": 1,
    "successfulItems": 1,
    "failedItems": 0,
    "totalCost": 0.25,
    "downloadUrl": "https://api.example.com/batch/batch_123456789/download"
  }
}
```

## Configuration Endpoints

### GET /api/v1/config
Get system configuration.

**Response:**
```json
{
  "version": "2.0.0",
  "providers": {
    "default": "openai-gpt-4",
    "fallbackChain": ["anthropic-claude", "cohere-command"],
    "loadBalancing": {
      "strategy": "weighted",
      "weights": {
        "openai-gpt-4": 0.6,
        "anthropic-claude": 0.3,
        "cohere-command": 0.1
      }
    }
  },
  "limits": {
    "maxConcurrentRequests": 10,
    "maxRequestsPerUser": 100,
    "maxBatchSize": 50,
    "maxContentLength": 100000,
    "maxQuestionsPerRequest": 20
  },
  "features": {
    "streaming": true,
    "batchProcessing": true,
    "qualityFiltering": true,
    "costOptimization": true,
    "caching": true
  }
}
```