'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { FeatureCardProps } from '@/specs/001-homepage-saas/contracts/frontend-components';
import { ArrowRight } from 'lucide-react';

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  animationDelay = 0,
  onView,
  onInteraction 
}: FeatureCardProps) {
  const { isIntersecting, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.5,
    triggerOnce: true
  });

  // Track view when component becomes visible or on mount
  React.useEffect(() => {
    // Call onView immediately on mount for tracking, and again when visible
    onView(title);
  }, [title, onView]);

  React.useEffect(() => {
    if (isIntersecting && !hasBeenVisible) {
      onView(title);
    }
  }, [isIntersecting, hasBeenVisible, title, onView]);

  const handleClick = () => {
    onInteraction(title, 'click');
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onInteraction(title, 'keyboard');
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.6, 
        delay: animationDelay,
        ease: "easeOut"
      }
    },
    hover: { 
      y: -8,
      scale: 1.02,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: { 
        duration: 0.5, 
        delay: animationDelay + 0.1,
        ease: "easeOut"
      }
    },
    hover: {
      rotate: 5,
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.article
      role="article"
      tabIndex={0}
      variants={cardVariants}
      initial="hidden"
      animate={isIntersecting ? "visible" : "hidden"}
      whileHover="hover"
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden"
      style={{ 
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-white/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:via-white/10 group-hover:to-purple-50/30 transition-all duration-500" />
      
      {/* Icon */}
      <motion.div variants={iconVariants} className="relative z-10 mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
          <Icon className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <motion.h3 
          variants={cardVariants}
          className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300"
        >
          {title}
        </motion.h3>
        
        <motion.p 
          variants={cardVariants}
          className="text-gray-600 mb-6 flex-1 leading-relaxed"
        >
          {description}
        </motion.p>

        {/* Learn more indicator */}
        <motion.div 
          variants={cardVariants}
          className="flex items-center text-blue-600 group-hover:text-blue-700 font-medium transition-all duration-300"
        >
          <span className="mr-2">Learn more</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </motion.div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-bl-full opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
      
      {/* Interactive border effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-400 to-purple-400 [mask:linear-gradient(#fff,#fff)] [mask-composite:exclude] [mask-mode:alpha]" />
      </div>

      {/* Focus ring for keyboard navigation */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-focus-within:ring-blue-400 group-focus-within:ring-offset-2 transition-all duration-200 pointer-events-none" />
    </motion.article>
  );
}