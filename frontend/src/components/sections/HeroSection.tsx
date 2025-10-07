import React from 'react';
import { HeroSectionProps } from '@/types/homepage';
import { useResponsive } from '@/hooks/useResponsive';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

const HeroSection: React.FC<HeroSectionProps> = ({
  id,
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  backgroundType = 'gradient',
  backgroundImage,
  reducedMotion: propReducedMotion,
  className,
  'aria-label': ariaLabel,
  'data-testid': testId,
}) => {
  const { breakpoint, isMobile, isTablet, isDesktop } = useResponsive();
  const prefersReducedMotion = useReducedMotion();

  const reducedMotion = propReducedMotion || prefersReducedMotion;

  const getBackgroundClasses = () => {
    switch (backgroundType) {
      case 'gradient':
        return cn(
          'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600',
          'dark:from-blue-800 dark:via-purple-800 dark:to-pink-800'
        );
      case 'image':
        return cn(
          'bg-cover bg-center bg-no-repeat',
          'before:absolute before:inset-0 before:bg-black/40'
        );
      case 'animation':
        return cn(
          'bg-gradient-to-r from-blue-500 to-purple-600',
          reducedMotion ? '' : 'animate-gradient'
        );
      default:
        return 'bg-gradient-to-br from-blue-600 to-purple-600';
    }
  };

  const getTextSize = () => {
    if (isMobile) return 'text-4xl';
    if (isTablet) return 'text-5xl';
    return 'text-6xl lg:text-7xl';
  };

  const getSubheadingSize = () => {
    if (isMobile) return 'text-lg';
    if (isTablet) return 'text-xl';
    return 'text-2xl';
  };

  const containerClasses = cn(
    'relative overflow-hidden',
    'min-h-screen flex items-center justify-center',
    'text-white',
    getBackgroundClasses(),
    className
  );

  const contentClasses = cn(
    'relative z-10',
    'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    'text-center'
  );

  const headingClasses = cn(
    'font-bold text-white mb-6',
    getTextSize(),
    reducedMotion ? '' : 'animate-fade-in-up'
  );

  const subheadingClasses = cn(
    'text-blue-100 mb-8 max-w-3xl mx-auto',
    getSubheadingSize(),
    reducedMotion ? '' : 'animate-fade-in-up animation-delay-200'
  );

  const buttonContainerClasses = cn(
    'flex flex-col sm:flex-row gap-4 justify-center items-center',
    reducedMotion ? '' : 'animate-fade-in-up animation-delay-400'
  );

  const renderCTAButton = (cta: typeof primaryCTA, variant: 'primary' | 'secondary') => {
    const baseClasses = cn(
      'inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg',
      'transition-all duration-300 transform hover:scale-105',
      'focus:outline-none focus:ring-4 focus:ring-white/30',
      reducedMotion ? 'transition-none' : ''
    );

    const primaryClasses = cn(
      baseClasses,
      'bg-white text-blue-600 hover:bg-blue-50',
      'shadow-lg hover:shadow-xl'
    );

    const secondaryClasses = cn(
      baseClasses,
      'bg-transparent text-white border-2 border-white hover:bg-white/10'
    );

    const buttonClasses = variant === 'primary' ? primaryClasses : secondaryClasses;

    const Icon = variant === 'primary' ? ArrowRight : Play;

    return (
      <Button
        key={cta.text}
        className={buttonClasses}
        onClick={cta.onClick}
        disabled={cta.disabled}
        aria-label={cta['aria-label'] || cta.text}
        data-testid={`${testId}-${variant}-cta`}
      >
        {cta.text}
        <Icon className="w-5 h-5" />
      </Button>
    );
  };

  return (
    <section
      id={id}
      className={containerClasses}
      style={{
        ...(backgroundImage && {
          backgroundImage: `url(${backgroundImage})`,
        }),
      }}
      aria-label={ariaLabel || 'Homepage hero section'}
      data-testid={testId}
    >
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 z-0" />

      <div className={contentClasses}>
        <h1 className={headingClasses}>
          {headline}
        </h1>

        {subheadline && (
          <p className={subheadingClasses}>
            {subheadline}
          </p>
        )}

        <div className={buttonContainerClasses}>
          {primaryCTA && renderCTAButton(primaryCTA, 'primary')}
          {secondaryCTA && renderCTAButton(secondaryCTA, 'secondary')}
        </div>
      </div>

      {/* Animated background elements (hidden when reduced motion is preferred) */}
      {!reducedMotion && (
        <>
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </>
      )}
    </section>
  );
};

export default HeroSection;