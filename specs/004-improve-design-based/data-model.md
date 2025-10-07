# Data Model: Homepage Design Improvements

**Feature**: Improve Homepage Design and User Experience
**Date**: 2025-10-06
**Status**: Draft

## Homepage Content Structure

### HomepageSection Entity
```typescript
interface HomepageSection {
  id: string;
  type: 'hero' | 'features' | 'benefits' | 'testimonials' | 'call-to-action';
  title: string;
  subtitle?: string;
  content: SectionContent;
  isVisible: boolean;
  order: number;
  responsiveConfig: ResponsiveBreakpoints;
}
```

### SectionContent Union Type
```typescript
type SectionContent =
  | HeroContent
  | FeatureContent[]
  | BenefitContent[]
  | TestimonialContent[]
  | CallToActionContent;
```

### Hero Section
```typescript
interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCTA: CallToActionButton;
  secondaryCTA?: CallToActionButton;
  backgroundType: 'gradient' | 'image' | 'animation';
  backgroundImage?: string;
}
```

### Feature Section
```typescript
interface FeatureContent {
  id: string;
  title: string;
  description: string;
  icon: string; // icon name or URL
  cta?: CallToActionButton;
}
```

### Benefit Section
```typescript
interface BenefitContent {
  id: string;
  title: string;
  description: string;
  metric?: string; // e.g., "10x faster", "95% accuracy"
}
```

### Testimonial Section
```typescript
interface TestimonialContent {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number; // 1-5 stars
}
```

### Call to Action Content
```typescript
interface CallToActionContent {
  headline: string;
  description: string;
  primaryCTA: CallToActionButton;
  secondaryCTA?: CallToActionButton;
  backgroundType: 'solid' | 'gradient' | 'pattern';
}
```

### Call to Action Button
```typescript
interface CallToActionButton {
  text: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
}
```

## User Statistics Integration

### UserStats (from Appwrite)
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

### UserStatsDisplay
```typescript
interface UserStatsDisplay {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}
```

## Responsive Configuration

### ResponsiveBreakpoints
```typescript
interface ResponsiveBreakpoints {
  mobile: {
    enabled: boolean;
    columns?: number;
    spacing: string;
    fontSize: string;
  };
  tablet: {
    enabled: boolean;
    columns?: number;
    spacing: string;
    fontSize: string;
  };
  desktop: {
    enabled: boolean;
    columns?: number;
    spacing: string;
    fontSize: string;
  };
}
```

## State Management

### Homepage State
```typescript
interface HomepageState {
  sections: HomepageSection[];
  userStats: UserStatsDisplay;
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  isLoading: boolean;
  error: string | null;
}
```

## Validation Rules

### Homepage Content Validation
- All section titles must be non-empty strings
- CTA buttons must have valid URLs
- Order values must be unique within each section type
- Responsive configuration must match defined breakpoints

### User Stats Validation
- Stats can be null for unauthenticated users
- Retry count must not exceed 3 attempts
- Loading states must be properly managed

### Performance Validation
- Total sections visible must not exceed performance targets
- Images must have optimized dimensions for each breakpoint
- Animation effects must respect reduced motion preferences

## Data Flow

1. **Load Homepage Configuration**
   - Fetch section configuration from backend/API
   - Apply responsive settings based on current viewport
   - Validate section data structure

2. **Load User Statistics (if authenticated)**
   - Fetch user stats from Appwrite
   - Handle loading states with skeleton placeholders
   - Implement retry logic for failed requests

3. **Update State**
   - React to viewport changes for responsive behavior
   - Handle authentication state changes
   - Update content based on user interactions

## Integration Points

### Appwrite Collections
- **Users Collection**: Authentication and user profile data
- **Quizzes Collection**: User quiz statistics
- **Statistics API**: Aggregated user metrics

### Component Libraries
- **Radix UI**: Accessible component primitives
- **TailwindCSS**: Responsive design utilities
- **Framer Motion**: Animation library for micro-interactions