'use client';

import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { ProcessStepProps } from '@/types/analytics';

export function ProcessStep({ 
  stepNumber, 
  title, 
  description, 
  icon: Icon, 
  isLast = false,
  animationDirection = 'up'
}: ProcessStepProps) {
  const { isIntersecting } = useIntersectionObserver({
    threshold: 0.3,
    triggerOnce: true
  });

  // Get animation variants based on direction
  const getAnimationVariants = () => {
    const baseHidden = { opacity: 0 };
    const baseVisible = { opacity: 1 };
    
    switch (animationDirection) {
      case 'left':
        return {
          hidden: { ...baseHidden, x: -50 },
          visible: { ...baseVisible, x: 0 }
        };
      case 'right':
        return {
          hidden: { ...baseHidden, x: 50 },
          visible: { ...baseVisible, x: 0 }
        };
      case 'down':
        return {
          hidden: { ...baseHidden, y: -50 },
          visible: {baseVisible, y: 0 }
        };
      case 'up':
      default:
        return {
          hidden: { ...baseHidden, y: 50 },
          visible: { ...baseVisible, y: 0 }
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <motion.li
      role="listitem"
      variants={variants}
      initial="hidden"
      animate={isIntersecting ? "visible" : "hidden"}
      transition={{ 
        duration: 0.6, 
        delay: stepNumber * 0.1,
        ease: "easeOut" 
      }}
      className="relative flex items-start space-x-6"
    >
      {/* Step Number and Icon Container */}
      <div className="flex-shrink-0 relative">
        {/* Step Number */}
        <motion.div
          variants={variants}
          className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full text-white font-bold text-xl shadow-lg"
          aria-label={`Step ${stepNumber}`}
        >
          {stepNumber}
        </motion.div>
        
        {/* Icon Overlay */}
        <motion.div
          variants={variants}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </motion.div>

        {/* Connector Line */}
        {!isLast && (
          <div 
            data-testid="step-connector"
            className="absolute top-16 left-1/2 w-0.5 h-24 bg-gradient-to-b from-blue-200 to-purple-200 transform -translate-x-1/2"
          />
        )}
      </div>

      {/* Content */}
      <motion.div 
        variants={variants}
        className="flex-1 pt-2"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed text-lg">
          {description}
        </p>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        variants={variants}
        className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-50"
      />
      <motion.div
        variants={variants}
        className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full opacity-30"
      />
    </motion.li>
  );
}