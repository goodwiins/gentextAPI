/**
 * Enhanced Auth Wrapper Component
 * Provides additional Aceternity UI effects and polish to auth pages
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { SparklesCore } from '@/components/ui/sparkles';
import { Meteors } from '@/components/ui/meteors';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useReducedMotion } from 'framer-motion';
import { useIntersectionAnimation } from '@/lib/animations';

interface EnhancedAuthWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  enableAnimations?: boolean;
}

interface ParticleEffectProps {
  id: string;
  className?: string;
  enabled: boolean;
}

const ParticleEffect: React.FC<ParticleEffectProps> = ({ id, className, enabled }) => {
  if (!enabled) return null;

  return (
    <SparklesCore
      id={id}
      background="transparent"
      minSize={0.4}
      maxSize={1.2}
      particleDensity={30}
      className={cn("absolute inset-0", className)}
      particleColor="#FFFFFF"
    />
  );
};

const FloatingElements: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  if (!enabled) return null;

  const elements = [
    { icon: '🎯', delay: 0, duration: 6 },
    { icon: '📚', delay: 1, duration: 8 },
    { icon: '🧠', delay: 2, duration: 7 },
    { icon: '✨', delay: 3, duration: 5 },
    { icon: '🚀', delay: 4, duration: 9 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements.map((element, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl opacity-20"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {element.icon}
        </motion.div>
      ))}
    </div>
  );
};

const GlowingOrb: React.FC<{ 
  x: number; 
  y: number; 
  size: number;
  color: string;
  delay: number;
  enabled: boolean;
}> = ({ x, y, size, color, delay, enabled }) => {
  if (!enabled) return null;

  return (
    <motion.div
      className="absolute rounded-full blur-3xl opacity-30"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, ${color}, transparent)`,
      }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export const EnhancedAuthWrapper: React.FC<EnhancedAuthWrapperProps> = ({
  children,
  title,
  subtitle,
  className,
  enableAnimations = true,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { ref, isVisible } = useIntersectionAnimation({
    threshold: 0.1,
    animation: { duration: 1000, easing: 'ease-out' },
  });

  const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor();

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!enableAnimations || prefersReducedMotion || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableAnimations, prefersReducedMotion]);

  const backgroundStyle = enableAnimations && !prefersReducedMotion ? {
    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(139, 92, 246, 0.1), transparent 50%)`,
  } : {};

  return (
    <AuroraBackground className={cn('min-h-screen relative overflow-hidden', className)}>
      {/* Dynamic background gradient */}
      <motion.div
        ref={containerRef}
        className="absolute inset-0 transition-all duration-300"
        style={backgroundStyle}
      />

      {/* Background effects */}
      <div className="absolute inset-0">
        <BackgroundBeams />
        
        {enableAnimations && !prefersReducedMotion && (
          <>
            <ParticleEffect id="auth-particles-1" enabled />
            <ParticleEffect id="auth-particles-2" enabled className="opacity-50" />
            <FloatingElements enabled />
            
            {/* Glowing orbs */}
            <GlowingOrb x={20} y={20} size={200} color="#8B5CF6" delay={0} enabled />
            <GlowingOrb x={80} y={30} size={150} color="#3B82F6" delay={2} enabled />
            <GlowingOrb x={60} y={80} size={180} color="#10B981" delay={4} enabled />
          </>
        )}
      </div>

      {/* Content */}
      <div 
        ref={ref as any}
        className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: isVisible ? 1 : 0, 
            scale: isVisible ? 1 : 0.9, 
            y: isVisible ? 0 : 20 
          }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.2 
          }}
          className="w-full max-w-lg"
        >
          {/* Header section */}
          {(title || subtitle) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-center mb-8"
            >
              {title && (
                <motion.h1 
                  className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {title}
                </motion.h1>
              )}
              
              {subtitle && (
                <motion.p 
                  className="text-lg md:text-xl text-gray-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  {subtitle}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Auth card with enhanced effects */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            {/* Meteors effect */}
            {enableAnimations && !prefersReducedMotion && (
              <Meteors number={15} />
            )}

            {/* Card content */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Animated border */}
              {enableAnimations && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899, #3B82F6)',
                    backgroundSize: '400% 400%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-1 rounded-[15px] bg-gray-900 dark:bg-black" />
                </motion.div>
              )}

              {/* Main content */}
              <div className="relative z-10 p-1">
                {children}
              </div>
            </motion.div>
          </motion.div>

          {/* Footer decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-8 text-center"
          >
            <motion.div
              className="inline-flex items-center space-x-2 text-gray-400"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span>✨</span>
              <span className="text-sm">Powered by AI</span>
              <span>✨</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AuroraBackground>
  );
};

export default EnhancedAuthWrapper;