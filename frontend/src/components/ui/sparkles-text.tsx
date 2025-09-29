"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SparklesCore } from '@/components/ui/sparkles';

interface SparklesTextProps {
  text: string;
  className?: string;
}

export function Sparkles({ text, className = '' }: SparklesTextProps) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {text}
      <SparklesCore
        id="sparkles-text"
        background="transparent"
        minSize={1}
        maxSize={2}
        particleDensity={30}
        className="absolute inset-0 pointer-events-none"
        particleColor="#ffffff"
      />
    </motion.span>
  );
}