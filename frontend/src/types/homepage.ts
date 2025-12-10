// Homepage content types based on the data model specification

export interface CallToActionButton {
  text: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  'aria-label'?: string;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCTA: CallToActionButton;
  secondaryCTA?: CallToActionButton;
  backgroundType: 'gradient' | 'image' | 'animation';
  backgroundImage?: string;
}

export interface FeatureContent {
  id: string;
  title: string;
  description: string;
  icon: string;
  cta?: CallToActionButton;
}

export interface BenefitContent {
  id: string;
  title: string;
  description: string;
  metric?: string;
  icon?: string;
}

export interface TestimonialContent {
  id: string;
  quote: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number; // 1-5 stars
}

export interface CallToActionContent {
  headline: string;
  description: string;
  primaryCTA: CallToActionButton;
  secondaryCTA?: CallToActionButton;
  backgroundType: 'solid' | 'gradient' | 'pattern';
}

export type SectionContent =
  | HeroContent
  | FeatureContent[]
  | BenefitContent[]
  | TestimonialContent[]
  | CallToActionContent;

export interface ResponsiveBreakpoints {
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

export interface HomepageSection {
  id: string;
  type: 'hero' | 'features' | 'benefits' | 'testimonials' | 'call-to-action';
  title: string;
  subtitle?: string;
  content: SectionContent;
  isVisible: boolean;
  order: number;
  responsiveConfig: ResponsiveBreakpoints;
}

export interface GlobalSettings {
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

export interface HomepageConfig {
  sections: HomepageSection[];
  globalSettings: GlobalSettings;
  version: string;
  lastUpdated: string;
}

// User statistics types
export interface UserStats {
  userId: string;
  quizzesCreated: number;
  questionsGenerated: number;
  averageQuestionsPerQuiz: number;
  lastQuizDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsDisplay {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

// Component prop types
export interface BaseHomepageSectionProps {
  id: string;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

export interface HomepageSectionProps extends BaseHomepageSectionProps {
  isVisible: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface HeroSectionProps extends HomepageSectionProps {
  headline: string;
  subheadline: string;
  primaryCTA: CallToActionButton;
  secondaryCTA?: CallToActionButton;
  backgroundType: 'gradient' | 'image' | 'animation';
  backgroundImage?: string;
  reducedMotion?: boolean;
}

export interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  cta?: CallToActionButton;
  isLoading?: boolean;
}

export interface FeaturesSectionProps extends HomepageSectionProps {
  features: FeatureCardProps[];
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  layout: 'grid' | 'carousel';
}

export interface BenefitsSectionProps extends HomepageSectionProps {
  benefits: BenefitContent[];
  showMetrics: boolean;
}

export interface TestimonialsSectionProps extends HomepageSectionProps {
  testimonials: TestimonialContent[];
  autoPlay?: boolean;
  showAvatars: boolean;
}

export interface CallToActionSectionProps extends HomepageSectionProps {
  headline: string;
  description: string;
  primaryCTA: CallToActionButton;
  secondaryCTA?: CallToActionButton;
  backgroundType: 'solid' | 'gradient' | 'pattern';
  size: 'sm' | 'md' | 'lg';
}

export interface UserStatsDisplayProps {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  compact?: boolean;
}

export interface StatItemProps {
  label: string;
  value: number | string;
  unit?: string;
  isLoading?: boolean;
  error?: boolean;
}

export interface MetricDisplayProps {
  value: string | number;
  label: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// API Response types
export interface HomepageApiSuccessResponse {
  success: true;
  data: HomepageConfig;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export type HomepageApiResponse = HomepageApiSuccessResponse | ApiErrorResponse;

export interface UserStatsApiSuccessResponse {
  success: true;
  data: UserStats;
  meta?: {
    timestamp: string;
    requestId: string;
    note?: string;
  };
}

export type UserStatsApiResponse = UserStatsApiSuccessResponse | ApiErrorResponse;

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Hook return types
export interface UseResponsiveReturn {
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export interface UseUserStatsOptions {
  enabled?: boolean;
  cacheTime?: number;
  retryLimit?: number;
  onSuccess?: (stats: UserStats) => void;
  onError?: (error: string) => void;
}

export interface UseUserStatsReturn {
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  retryCount: number;
}

export interface UseAnimationReturn {
  isReduced: boolean;
  prefersReduced: boolean;
  enableAnimations: boolean;
  toggleAnimations: () => void;
}