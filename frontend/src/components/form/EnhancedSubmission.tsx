/**
 * Enhanced Submission Component with Animated Interface
 * Implements animated textarea, moving border buttons, and dynamic placeholders
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useReducedMotion } from 'framer-motion';
import { useIntersectionAnimation } from '@/lib/animations';
import { 
  EnhancedSubmissionProps, 
  SubmissionFormData, 
  AnimatedTextareaProps,
  MovingBorderButtonProps,
  PlaceholdersAndVanishInputProps 
} from '@/types/aceternity';

// Animated Character Counter Component
const AnimatedCharacterCounter: React.FC<{
  current: number;
  max: number;
  enableAnimation: boolean;
  className?: string;
}> = ({ current, max, enableAnimation, className }) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = current > max;
  
  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      <span 
        className={cn(
          'transition-colors duration-200',
          isOverLimit 
            ? 'text-red-500 font-medium' 
            : isNearLimit 
            ? 'text-yellow-500' 
            : 'text-muted-foreground'
        )}
      >
        {current.toLocaleString()} / {max.toLocaleString()}
      </span>
      
      {/* Visual progress indicator */}
      <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-300 ease-out',
            isOverLimit 
              ? 'bg-red-500' 
              : isNearLimit 
              ? 'bg-yellow-500' 
              : 'bg-blue-500'
          )}
          style={{
            width: `${Math.min(percentage, 100)}%`,
            transform: enableAnimation ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin: 'left',
          }}
        />
      </div>
    </div>
  );
};

// Placeholders and Vanish Input Component
const PlaceholdersAndVanishInput: React.FC<PlaceholdersAndVanishInputProps> = ({
  placeholders,
  value,
  onChange,
  onSubmit,
  className,
  animationDuration = 3000,
}) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (prefersReducedMotion || !isAnimating) return;

    intervalRef.current = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, animationDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [placeholders.length, animationDuration, prefersReducedMotion, isAnimating]);

  const handleFocus = () => {
    setIsAnimating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleBlur = () => {
    if (!value) {
      setIsAnimating(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && onSubmit) {
      onSubmit(value);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholders[currentPlaceholderIndex]}
        className={cn(
          'w-full min-h-[120px] p-4 border rounded-lg resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-all duration-200',
          'placeholder:transition-all placeholder:duration-500',
          'dark:bg-gray-900 dark:border-gray-700 dark:text-white'
        )}
      />
      
      {/* Animated placeholder overlay for better visual effect */}
      {!value && isAnimating && (
        <div 
          className="absolute top-4 left-4 pointer-events-none text-gray-400 transition-opacity duration-500"
          style={{
            opacity: prefersReducedMotion ? 1 : 0.7,
          }}
        >
          {placeholders[currentPlaceholderIndex]}
        </div>
      )}
    </div>
  );
};

// Moving Border Button Component
const MovingBorderButton: React.FC<MovingBorderButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className,
  borderRadius = '8px',
  duration = 2000,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-400';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-400';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-400';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-900 border-gray-300 dark:hover:bg-gray-800 dark:text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-400';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative overflow-hidden font-medium rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
      style={{ borderRadius }}
    >
      {/* Moving border effect */}
      {!prefersReducedMotion && isHovered && !disabled && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
            backgroundSize: '200% 100%',
            animation: `movingBorder ${duration}ms linear infinite`,
            borderRadius,
          }}
        />
      )}
      
      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center">
        {isLoading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </span>
    </button>
  );
};

// Animated Textarea Component
const AnimatedTextarea: React.FC<AnimatedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  maxLength = 5000,
  rows = 6,
  enableAnimation,
  showCharacterCount,
  className,
  error,
  required,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={cn(
            'w-full p-4 border rounded-lg resize-none overflow-hidden',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            'dark:bg-gray-900 dark:border-gray-700 dark:text-white',
            enableAnimation && !prefersReducedMotion && 'transition-all duration-300',
            error && 'border-red-500 focus:ring-red-500',
            isFocused && enableAnimation && 'shadow-lg scale-[1.02]'
          )}
          style={{
            minHeight: `${rows * 1.5}rem`,
            transform: enableAnimation && !prefersReducedMotion && isFocused 
              ? 'scale(1.02)' 
              : 'scale(1)',
          }}
        />
        
        {/* Animated border glow effect */}
        {enableAnimation && !prefersReducedMotion && isFocused && (
          <div 
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 -z-10 animate-pulse"
            style={{
              transform: 'scale(1.05)',
            }}
          />
        )}
      </div>

      {/* Character count and error message */}
      <div className="flex items-center justify-between">
        {showCharacterCount && (
          <AnimatedCharacterCounter
            current={value.length}
            max={maxLength}
            enableAnimation={enableAnimation}
          />
        )}
        
        {error && (
          <span className="text-sm text-red-500 ml-auto">
            {error}
          </span>
        )}
      </div>
    </div>
  );
};

// Main Enhanced Submission Component
export const EnhancedSubmission: React.FC<EnhancedSubmissionProps> = ({
  onSubmit,
  isLoading,
  defaultText = '',
  maxLength = 5000,
  enableAnimations,
  showCharacterCount,
  className,
}) => {
  const [formData, setFormData] = useState<SubmissionFormData>({
    text: defaultText,
    difficulty: 'medium',
    questionCount: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { ref, isVisible } = useIntersectionAnimation({
    threshold: 0.1,
    animation: { duration: 600, easing: 'ease-out' },
  });

  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  const placeholders = useMemo(() => [
    "Enter your text here to generate quiz questions...",
    "Paste an article, essay, or study material...",
    "Copy content from textbooks, papers, or documents...",
    "Add lecture notes or educational content...",
    "Insert any text you'd like to turn into a quiz...",
  ], []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.text.trim()) {
      newErrors.text = 'Please enter some text to generate questions from';
    } else if (formData.text.length < 50) {
      newErrors.text = 'Please provide at least 50 characters for better question generation';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.text]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: 'Failed to generate quiz. Please try again.' });
    }
  }, [formData, validateForm, onSubmit]);

  const handleTextChange = useCallback((text: string) => {
    setFormData(prev => ({ ...prev, text }));
    
    // Clear text error when user starts typing
    if (errors.text && text.trim()) {
      setErrors(prev => ({ ...prev, text: '' }));
    }
  }, [errors.text]);

  const isFormValid = formData.text.trim().length >= 50;
  const wordCount = formData.text.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <Card 
      ref={ref as any}
      className={cn(
        'w-full max-w-4xl mx-auto transition-all duration-600',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Generate Quiz Questions
        </CardTitle>
        <p className="text-muted-foreground text-center">
          Paste your text below and we&apos;ll create engaging quiz questions for you
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text input with dynamic placeholders */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Text Content {formData.text.trim() && (
                <Badge variant="outline" className="ml-2">
                  {wordCount} words
                </Badge>
              )}
            </label>
            
            {enableAnimations ? (
              <PlaceholdersAndVanishInput
                placeholders={placeholders}
                value={formData.text}
                onChange={handleTextChange}
                onSubmit={() => isFormValid && handleSubmit}
                className="w-full"
              />
            ) : (
              <AnimatedTextarea
                value={formData.text}
                onChange={handleTextChange}
                placeholder={placeholders[0]}
                maxLength={maxLength}
                enableAnimation={enableAnimations}
                showCharacterCount={showCharacterCount}
                error={errors.text}
                required
              />
            )}
          </div>

          {/* Quiz settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Questions</label>
              <Select 
                value={formData.questionCount?.toString() || '5'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, questionCount: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions</SelectItem>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error messages */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Submit button */}
          <MovingBorderButton
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            isLoading={isLoading}
            disabled={!isFormValid}
            variant="primary"
            size="lg"
            className="w-full"
            borderRadius="8px"
          >
            {isLoading ? 'Generating Questions...' : 'Generate Quiz Questions'}
          </MovingBorderButton>
        </form>
      </CardContent>
    </Card>
  );
};

// Add keyframes for moving border animation
const styles = `
@keyframes movingBorder {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default EnhancedSubmission;