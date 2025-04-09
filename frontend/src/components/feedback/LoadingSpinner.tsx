import { memo } from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16'
};

const LoadingSpinner = memo<LoadingSpinnerProps>(({ 
  message = 'Loading...',
  size = 'md',
  className = ''
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      <div className="relative">
        <motion.div 
          className={`${sizeClasses[size]} rounded-full border-t-4 border-b-4 border-primary`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} rounded-full border-t-4 border-b-4 border-primary opacity-30`} />
      </div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300"
      >
        {message}
      </motion.p>
    </motion.div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 