/**
 * Hero Section Component with Animated Background Effects
 * Implements Aurora background, Background beams, Sparkles, and Text generation effects
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { SparklesCore } from '@/components/ui/sparkles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import usePerformanceMonitor from '@/hooks/usePerformanceMonitor';
import { useIntersectionAnimation } from '@/lib/animations';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  words,
  className,
  filter = true,
  duration = 1000,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const wordsArray = useMemo(() => words.split(' '), [words]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(words);
      return;
    }

    if (currentIndex < wordsArray.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + (prev ? ' ' : '') + wordsArray[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, duration / wordsArray.length);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, wordsArray, duration, words, prefersReducedMotion]);

  return (
    <div className={cn('font-bold', className)}>
      {wordsArray.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          className={cn(
            'transition-all duration-200',
            idx <= currentIndex - 1 
              ? 'opacity-100' 
              : 'opacity-0',
            filter && idx <= currentIndex - 1 && 'text-shadow-glow'
          )}
        >
          {word}{idx < wordsArray.length - 1 ? ' ' : ''}
        </span>
      ))}
    </div>
  );
};

interface TypewriterEffectProps {
  words: Array<{ text: string; className?: string }>;
  className?: string;
  cursorClassName?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  delayBetweenWords?: number;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  words,
  className,
  cursorClassName,
  typeSpeed = 100,
  deleteSpeed = 50,
  delayBetweenWords = 2000,
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const currentWord = words[currentWordIndex];

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentText(currentWord.text);
      return;
    }

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentWord.text.length) {
          setCurrentText(currentWord.text.slice(0, currentText.length + 1));
        } else {
          // Word complete, start deleting after delay
          setTimeout(() => setIsDeleting(true), delayBetweenWords);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          // Deletion complete, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWord, typeSpeed, deleteSpeed, delayBetweenWords, words.length, prefersReducedMotion]);

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className={cn('inline-flex items-center', className)}>
      <span className={currentWord.className}>
        {currentText}
      </span>
      <span 
        className={cn(
          'ml-1 transition-opacity duration-100',
          showCursor ? 'opacity-100' : 'opacity-0',
          cursorClassName || 'text-blue-500'
        )}
      >
        |
      </span>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  style?: React.CSSProperties;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className,
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className={cn(
        'group relative p-6 bg-white/10 dark:bg-black/10 backdrop-blur-sm',
        'border border-white/20 dark:border-white/10 rounded-lg',
        'transition-all duration-300 hover:bg-white/20 dark:hover:bg-white/5',
        'hover:border-white/30 dark:hover:border-white/20',
        !prefersReducedMotion && 'hover:scale-105 hover:shadow-xl',
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background glow effect */}
      {isHovered && !prefersReducedMotion && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg blur-xl transition-opacity duration-300" />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className={cn(
            'p-2 rounded-lg bg-blue-500/20 text-blue-400 transition-transform duration-200',
            isHovered && !prefersReducedMotion && 'scale-110'
          )}>
            {icon}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
        
        <p className="text-gray-300 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

interface HeroSectionProps {
  className?: string;
  enableAnimations?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  className,
  enableAnimations = true,
}) => {
  const { ref, isVisible } = useIntersectionAnimation({
    threshold: 0.1,
    animation: { duration: 800, easing: 'ease-out' },
  });

  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  const typewriterWords = useMemo(() => [
    { text: 'Educational Content', className: 'text-blue-400' },
    { text: 'Study Materials', className: 'text-green-400' },
    { text: 'Lecture Notes', className: 'text-purple-400' },
    { text: 'Research Papers', className: 'text-orange-400' },
  ], []);

  const features = useMemo(() => [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Generation',
      description: 'Advanced AI analyzes your content to create relevant, challenging questions automatically.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant Results',
      description: 'Generate comprehensive quizzes in seconds, not hours. Perfect for educators and students.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      title: 'Quality Assurance',
      description: 'Each question is crafted to test comprehension, ensuring meaningful learning outcomes.',
    },
  ], []);

  const handleGetStarted = useCallback(() => {
    startMonitoring();
    // Navigation will be handled by Next.js Link
    setTimeout(() => stopMonitoring(), 500);
  }, [startMonitoring, stopMonitoring]);

  return (
    <AuroraBackground className={cn('relative min-h-screen flex items-center justify-center', className)}>
      {/* Background effects layer */}
      <div className="absolute inset-0">
        <BackgroundBeams />
        
        {enableAnimations && (
          <SparklesCore
            id="hero-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={60}
            className="w-full h-full absolute inset-0"
            particleColor="#FFFFFF"
          />
        )}
      </div>

      {/* Content layer */}
      <div 
        ref={ref as any}
        className={cn(
          'relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center',
          'transition-all duration-800',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        )}
      >
        {/* Hero content */}
        <div className="max-w-4xl mx-auto mb-16">
          {/* Beta badge */}
          <div className="mb-8">
            <Badge 
              variant="outline" 
              className="px-4 py-2 text-sm bg-white/10 border-white/20 text-white backdrop-blur-sm"
            >
              🚀 AI-Powered Quiz Generation
            </Badge>
          </div>

          {/* Main headline */}
          <div className="mb-6">
            <TextGenerateEffect
              words="Transform Your Content into Engaging Quiz Questions"
              className="text-4xl md:text-6xl lg:text-7xl text-white leading-tight"
              duration={1200}
            />
          </div>

          {/* Subtitle with typewriter effect */}
          <div className="mb-8 text-xl md:text-2xl text-gray-300">
            <span>Convert </span>
            <TypewriterEffect
              words={typewriterWords}
              className="font-semibold"
              typeSpeed={100}
              deleteSpeed={50}
              delayBetweenWords={2000}
            />
            <span> into interactive quizzes instantly</span>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Powered by advanced AI, our platform analyzes your educational content and generates 
            comprehensive quiz questions to enhance learning and retention.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/quiz" onClick={handleGetStarted}>
              <Button 
                size="lg" 
                className={cn(
                  'px-8 py-4 text-lg font-semibold',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'border border-blue-500 rounded-lg',
                  'transition-all duration-200',
                  'hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25'
                )}
              >
                Start Creating Quiz
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            
            <Link href="/aceternity-demo">
              <Button 
                variant="outline" 
                size="lg"
                className={cn(
                  'px-8 py-4 text-lg font-semibold',
                  'bg-white/10 hover:bg-white/20 text-white border-white/30',
                  'backdrop-blur-sm transition-all duration-200',
                  'hover:scale-105'
                )}
              >
                View Demo
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </Button>
            </Link>
          </div>

          {/* Social proof / stats */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Instant generation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Multiple formats</span>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className={cn(
                'transition-all duration-300',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              )}
              style={{
                transitionDelay: `${index * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </AuroraBackground>
  );
};

export default HeroSection;