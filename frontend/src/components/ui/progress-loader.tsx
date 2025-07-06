import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface ProgressLoaderProps {
  progress: number;
  message: string;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
  showPercentage?: boolean;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  progress,
  message,
  className = '',
  variant = 'default',
  showPercentage = false
}) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`space-y-4 ${className}`}
    >
      <div className="text-center space-y-2">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          {message}
        </motion.div>
        {showPercentage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground/70"
          >
            {Math.round(progress)}%
          </motion.div>
        )}
      </div>
      
      <div className="relative">
        <Progress 
          value={progress} 
          className="h-2 bg-muted/30"
        />
        <motion.div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );

  if (variant === 'card') {
    return (
      <Card className="glass p-6 max-w-sm mx-auto">
        {content}
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="max-w-xs mx-auto">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="glass p-8 max-w-sm mx-auto">
        {content}
      </Card>
    </div>
  );
};

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'currentColor'
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className="flex space-x-1 items-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeClasses[size]} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

interface PulseLoaderProps {
  size?: number;
  color?: string;
  text?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 40,
  color = '#3b82f6',
  text
}) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <motion.div
          className="rounded-full border-2 border-transparent"
          style={{ 
            width: size, 
            height: size,
            borderTopColor: color,
            borderRightColor: color,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full"
          style={{ backgroundColor: `${color}20` }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      {text && (
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};