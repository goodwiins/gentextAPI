'use client';

import { motion } from 'framer-motion';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';
import { Button } from '@/components/ui/button';
import type { HomepageHeroProps, ConversionAction } from '@/specs/001-homepage-saas/contracts/frontend-components';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export function HomepageHero({ 
  user, 
  onCtaClick, 
  performanceMode = 'standard' 
}: HomepageHeroProps) {
  const { trackConversion } = useHomepageAnalytics();

  const handleCtaClick = async (action: ConversionAction) => {
    try {
      await trackConversion({
        eventType: action,
        eventData: {
          ctaText: user ? 'Generate Quiz' : 'Get Started',
          ctaPosition: 'hero',
          scrollDepth: 0,
          timeOnPage: 0
        },
        successful: true
      });
      onCtaClick(action);
    } catch (error) {
      console.error('Failed to track conversion:', error);
      onCtaClick(action);
    }
  };

  const getAnimationProps = () => {
    if (performanceMode === 'minimal') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 }
      };
    }
    
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6 }
    };
  };

  const isReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationProps = isReducedMotion || performanceMode === 'minimal' 
    ? { initial: {}, animate: {}, transition: {} }
    : getAnimationProps();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-10 blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...animationProps}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              AI-Powered Quiz Generation
            </span>
          </motion.div>

          {/* Main Heading */}
          <h1 
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            data-testid="hero-heading"
          >
            {user ? (
              <span>
                Welcome back, <span className="text-blue-600">
                  {user.prefs?.firstName || user.name?.split(' ')[0] || 'there'}
                </span>
              </span>
            ) : (
              <>
                Create Engaging{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Quizzes
                </span>{' '}
                in Seconds
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your educational content into interactive quizzes using advanced AI. 
            Perfect for teachers, content creators, and educational platforms.
            AI-powered quiz generation made simple.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {user ? (
              <>
                <Button
                  size="xl"
                  onClick={() => handleCtaClick('generate_clicked')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  aria-label="Generate quiz"
                  tabIndex={0}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Generate Quiz
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => handleCtaClick('learn_more_clicked')}
                  className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 font-semibold"
                  aria-label="Learn more about features"
                  tabIndex={0}
                >
                  Explore Features
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="xl"
                  onClick={() => handleCtaClick('signup_clicked')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  aria-label="Get started"
                  tabIndex={0}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => handleCtaClick('login_clicked')}
                  className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 font-semibold"
                  aria-label="Sign in"
                  tabIndex={0}
                >
                  Sign In
                </Button>
              </>
            )}
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Free tier available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI-powered questions</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center"
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}