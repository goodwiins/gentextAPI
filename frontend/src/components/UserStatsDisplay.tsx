import React from 'react';
import { UserStatsDisplayProps, StatItemProps } from '@/types/homepage';
import SkeletonLoader, { TextSkeleton, HeadingSkeleton } from '@/components/ui/SkeletonLoader';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import {
  FileText,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  unit,
  isLoading = false,
  error = false,
}) => {
  const { isMobile } = useResponsive();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <SkeletonLoader
          type="text"
          width="w-20 h-4 mb-2"
          aria-label="Loading statistic"
        />
        <SkeletonLoader
          type="heading"
          width="w-16 h-8"
          aria-label="Loading statistic value"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <AlertCircle className="w-5 h-5 text-red-500 mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">Unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {unit && <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
};

const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({
  stats,
  isLoading,
  error,
  onRetry,
  compact = false,
}) => {
  const { isMobile, isTablet } = useResponsive();

  if (!stats && !isLoading && !error) {
    return null; // Don't show anything for unauthenticated users
  }

  const containerClasses = cn(
    'w-full',
    compact ? 'py-4' : 'py-8',
    isMobile ? 'px-4' : 'px-6'
  );

  const gridClasses = cn(
    'grid gap-4',
    {
      'grid-cols-1': isMobile,
      'grid-cols-3': !isMobile,
    }
  );

  const headerClasses = cn(
    'mb-6',
    {
      'text-center': isMobile,
      'text-left': !isMobile,
    }
  );

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className={containerClasses}>
      {(stats || isLoading || error) && (
        <>
          <div className={headerClasses}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your Quiz Statistics
            </h2>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>Failed to load statistics</span>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  aria-label="Retry loading statistics"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className={gridClasses}>
            <StatItem
              label="Quizzes Created"
              value={stats?.quizzesCreated || 0}
              isLoading={isLoading}
              error={!isLoading && !!error}
            />
            <StatItem
              label="Questions Generated"
              value={stats?.questionsGenerated || 0}
              isLoading={isLoading}
              error={!isLoading && !!error}
            />
            <StatItem
              label="Avg Questions/Quiz"
              value={stats?.averageQuestionsPerQuiz?.toFixed(1) || '0.0'}
              isLoading={isLoading}
              error={!isLoading && !!error}
            />
          </div>

          {!compact && stats?.lastQuizDate && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last quiz created: {new Date(stats.lastQuizDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserStatsDisplay;