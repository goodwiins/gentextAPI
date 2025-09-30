'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useHomepageAnalytics } from '@/hooks/useHomepageAnalytics';
import type { CtaSectionProps, ConversionAction } from '@/types/analytics';
import { SectionName } from '@/types/analytics';
import { ArrowRight, Users, Star, Zap, CheckCircle } from 'lucide-react';

export function CtaSection({ 
  variant,
  user,
  onCtaClick,
  showSocialProof = false,
  backgroundColor = 'default'
}: CtaSectionProps) {
  const { trackConversion } = useHomepageAnalytics();

  const handleCtaClick = (action: ConversionAction) => {
    // Fire the callback immediately for better UX
    onCtaClick(action);
    
    // Track conversion asynchronously (don't await)
    trackConversion({
      userId: user?.$id,
      eventType: action,
      eventData: {
        ctaText: user ? 'Generate Quiz' : 'Get Started',
        ctaPosition: SectionName.CTA,
        scrollDepth: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
        timeOnPage: Date.now() - (window.performance?.timeOrigin || Date.now())
      }
    }).catch(error => {
      console.error('Failed to track conversion:', error);
    });
  };

  // Get background classes based on prop
  const getBackgroundClasses = () => {
    switch (backgroundColor) {
      case 'gradient':
        return 'bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800';
      case 'solid':
        return variant === 'primary' ? 'bg-gray-900' : 'bg-blue-600';
      case 'default':
      default:
        return 'bg-gradient-to-br from-gray-50 to-white';
    }
  };

  // Get text color classes based on background
  const getTextClasses = () => {
    if (backgroundColor === 'gradient' || (backgroundColor === 'solid' && variant === 'primary')) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  // Get CTA content based on user state and variant
  const getCtaContent = () => {
    if (user) {
      return {
        primaryText: 'Generate Quiz',
        primaryAction: 'generate_clicked' as ConversionAction,
        secondaryText: 'View Dashboard',
        secondaryAction: 'learn_more_clicked' as ConversionAction,
        heading: 'Ready to create your next quiz?',
        subheading: 'Continue your quiz creation journey'
      };
    }

    if (variant === 'primary') {
      return {
        primaryText: 'Get Started',
        primaryAction: 'signup_clicked' as ConversionAction,
        secondaryText: 'Learn More',
        secondaryAction: 'learn_more_clicked' as ConversionAction,
        heading: 'Start creating amazing quizzes today',
        subheading: 'Start your journey today'
      };
    }

    return {
      primaryText: 'Learn More',
      primaryAction: 'learn_more_clicked' as ConversionAction,
      secondaryText: 'View Features',
      secondaryAction: 'learn_more_clicked' as ConversionAction,
      heading: 'Discover the power of AI-driven quiz generation',
      subheading: 'Discover the possibilities today'
    };
  };

  const ctaContent = getCtaContent();
  const backgroundClasses = getBackgroundClasses();
  const textClasses = getTextClasses();
  const isDarkBackground = backgroundColor === 'gradient' || (backgroundColor === 'solid' && variant === 'primary');

  return (
    <section 
      role="region"
      aria-label="Call to action"
      data-testid="cta-section"
      data-test-section="cta"
      className={`relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden ${backgroundClasses}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Main Content */}
          <div className="max-w-3xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className={`text-4xl md:text-5xl font-bold mb-6 ${textClasses}`}
            >
              {ctaContent.heading}
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className={`text-xl md:text-2xl mb-8 ${isDarkBackground ? 'text-gray-200' : 'text-gray-600'}`}
            >
              {ctaContent.subheading}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button
                size="xl"
                onClick={() => handleCtaClick(ctaContent.primaryAction)}
                className={`
                  ${isDarkBackground 
                    ? 'bg-white text-gray-900 hover:bg-gray-100' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  }
                  shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200
                `}
                aria-label={ctaContent.primaryText}
                tabIndex={0}
              >
                {ctaContent.primaryText}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {variant !== 'minimal' && (
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => handleCtaClick(ctaContent.secondaryAction)}
                  className={`
                    ${isDarkBackground 
                      ? 'border-white text-white hover:bg-white hover:text-gray-900' 
                      : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                    }
                    font-semibold
                  `}
                  aria-label={ctaContent.secondaryText}
                  tabIndex={0}
                >
                  {ctaContent.secondaryText}
                </Button>
              )}
            </motion.div>

            {/* Social Proof */}
            {showSocialProof && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isDarkBackground ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">10,000+ Users</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">4.9/5 Rating</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">99.9% Uptime</span>
                </div>
              </motion.div>
            )}

            {/* Additional Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm ${isDarkBackground ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-400" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-br-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-tl-full blur-2xl" />
    </section>
  );
}