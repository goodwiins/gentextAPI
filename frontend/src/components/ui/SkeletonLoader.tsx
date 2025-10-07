import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  type: 'text' | 'heading' | 'card' | 'button' | 'avatar';
  lines?: number; // for text type
  width?: string | number;
  height?: string | number;
  className?: string;
  'aria-label'?: string; // for screen readers
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  lines = 1,
  width,
  height,
  className,
  'aria-label': ariaLabel,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const getTypeClasses = () => {
    switch (type) {
      case 'text':
        return 'h-4';
      case 'heading':
        return 'h-8';
      case 'card':
        return 'h-24';
      case 'button':
        return 'h-10';
      case 'avatar':
        return 'h-12 w-12 rounded-full';
      default:
        return 'h-4';
    }
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className={cn('space-y-2', className)} role="status" aria-label={ariaLabel || 'Loading text'}>
            {Array.from({ length: lines }, (_, index) => (
              <div
                key={index}
                className={cn(
                  baseClasses,
                  getTypeClasses(),
                  index === lines - 1 ? 'w-3/4' : 'w-full'
                )}
                style={{
                  width: index === lines - 1 && width ? width : undefined,
                }}
              />
            ))}
          </div>
        );

      case 'card':
        return (
          <div
            className={cn(baseClasses, getTypeClasses(), className)}
            style={{ width, height }}
            role="status"
            aria-label={ariaLabel || 'Loading card content'}
          />
        );

      case 'avatar':
        return (
          <div
            className={cn(baseClasses, getTypeClasses(), className)}
            style={{ width, height }}
            role="status"
            aria-label={ariaLabel || 'Loading avatar'}
          />
        );

      default:
        return (
          <div
            className={cn(baseClasses, getTypeClasses(), className)}
            style={{ width, height }}
            role="status"
            aria-label={ariaLabel || `Loading ${type}`}
          />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;

// Preset skeleton components for common use cases
export const TextSkeleton: React.FC<Omit<SkeletonLoaderProps, 'type'>> = (props) => (
  <SkeletonLoader {...props} type="text" />
);

export const HeadingSkeleton: React.FC<Omit<SkeletonLoaderProps, 'type'>> = (props) => (
  <SkeletonLoader {...props} type="heading" />
);

export const CardSkeleton: React.FC<Omit<SkeletonLoaderProps, 'type'>> = (props) => (
  <SkeletonLoader {...props} type="card" />
);

export const ButtonSkeleton: React.FC<Omit<SkeletonLoaderProps, 'type'>> = (props) => (
  <SkeletonLoader {...props} type="button" />
);

export const AvatarSkeleton: React.FC<Omit<SkeletonLoaderProps, 'type'>> = (props) => (
  <SkeletonLoader {...props} type="avatar" />
);