import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  className?: string;
  maxWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  breakpoint,
  className,
  maxWidth,
  padding,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getCurrentBreakpoint = () => {
    if (breakpoint === 'mobile' && isMobile) return true;
    if (breakpoint === 'tablet' && isTablet) return true;
    if (breakpoint === 'desktop' && isDesktop) return true;
    return false;
  };

  const getMaxWidth = () => {
    if (isMobile && maxWidth?.mobile) return maxWidth.mobile;
    if (isTablet && maxWidth?.tablet) return maxWidth.tablet;
    if (isDesktop && maxWidth?.desktop) return maxWidth.desktop;
    return undefined;
  };

  const getPadding = () => {
    if (isMobile && padding?.mobile) return padding.mobile;
    if (isTablet && padding?.tablet) return padding.tablet;
    if (isDesktop && padding?.desktop) return padding.desktop;
    return undefined;
  };

  if (!getCurrentBreakpoint()) {
    return null;
  }

  const containerClasses = cn(
    'w-full mx-auto',
    {
      'max-w-sm': getMaxWidth() === 'sm',
      'max-w-md': getMaxWidth() === 'md',
      'max-w-lg': getMaxWidth() === 'lg',
      'max-w-xl': getMaxWidth() === 'xl',
      'max-w-2xl': getMaxWidth() === '2xl',
      'max-w-3xl': getMaxWidth() === '3xl',
      'max-w-4xl': getMaxWidth() === '4xl',
      'max-w-5xl': getMaxWidth() === '5xl',
      'max-w-6xl': getMaxWidth() === '6xl',
      'max-w-7xl': getMaxWidth() === '7xl',
      'max-w-full': getMaxWidth() === 'full',
      'px-4': getPadding() === 'sm',
      'px-6': getPadding() === 'md',
      'px-8': getPadding() === 'lg',
      'px-12': getPadding() === 'xl',
      'px-16': getPadding() === '2xl',
    },
    className
  );

  const containerStyle: React.CSSProperties = {
    maxWidth: getMaxWidth()?.startsWith('max-w-') ? undefined : getMaxWidth(),
  };

  return (
    <div className={containerClasses} style={containerStyle}>
      {children}
    </div>
  );
};

// Preset responsive containers for common use cases
export const MobileContainer: React.FC<Omit<ResponsiveContainerProps, 'breakpoint'>> = (props) => (
  <ResponsiveContainer {...props} breakpoint="mobile" />
);

export const TabletContainer: React.FC<Omit<ResponsiveContainerProps, 'breakpoint'>> = (props) => (
  <ResponsiveContainer {...props} breakpoint="tablet" />
);

export const DesktopContainer: React.FC<Omit<ResponsiveContainerProps, 'breakpoint'>> = (props) => (
  <ResponsiveContainer {...props} breakpoint="desktop" />
);

// Adaptive container that shows different content based on breakpoint
export const AdaptiveContainer: React.FC<{
  mobile: React.ReactNode;
  tablet: React.ReactNode;
  desktop: React.ReactNode;
  className?: string;
}> = ({ mobile, tablet, desktop, className }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div className={className}>
      {isMobile && mobile}
      {isTablet && tablet}
      {isDesktop && desktop}
    </div>
  );
};

export default ResponsiveContainer;