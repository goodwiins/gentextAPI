/**
 * Enhanced Quiz Display Component with 3D Card Animations
 * Implements interactive 3D cards, progress tracking, and accessibility features
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { SparklesCore } from '@/components/ui/sparkles';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import usePerformanceMonitor from '@/hooks/usePerformanceMonitor';
import { useIntersectionAnimation, announceAnimationState } from '@/lib/animations';
import { 
  EnhancedQuizDisplayProps, 
  QuizQuestion, 
  QuizCardAnimationProps 
} from '@/types/aceternity';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (answerIndex: number) => void;
  isAnswered: boolean;
  selectedAnswer?: number;
  showCorrectAnswer: boolean;
  enableAnimations: boolean;
  className?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer,
  showCorrectAnswer,
  enableAnimations,
  className,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  const handleAnswer = useCallback((answerIndex: number) => {
    if (isAnswered) return;
    
    startMonitoring();
    onAnswer(answerIndex);
    
    // Show sparkles for correct answers
    if (answerIndex === question.correctAnswer) {
      setShowSparkles(true);
      announceAnimationState('running', 'Success sparkles');
      
      setTimeout(() => {
        setShowSparkles(false);
        announceAnimationState('finished', 'Success sparkles');
      }, 2000);
    }
    
    stopMonitoring();
  }, [isAnswered, onAnswer, question.correctAnswer, startMonitoring, stopMonitoring]);

  const handleFlip = useCallback(() => {
    if (!enableAnimations || prefersReducedMotion) return;
    
    startMonitoring();
    setIsFlipped(!isFlipped);
    announceAnimationState(isFlipped ? 'finished' : 'running', 'Card flip');
    
    setTimeout(() => {
      stopMonitoring();
    }, 600);
  }, [isFlipped, enableAnimations, prefersReducedMotion, startMonitoring, stopMonitoring]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAnswerButtonClass = (index: number) => {
    const baseClass = 'w-full p-4 text-left rounded-lg transition-all duration-200 border-2';
    
    if (!isAnswered) {
      return cn(
        baseClass,
        'border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950'
      );
    }
    
    if (showCorrectAnswer && index === question.correctAnswer) {
      return cn(baseClass, 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200');
    }
    
    if (selectedAnswer === index) {
      const isCorrect = index === question.correctAnswer;
      return cn(
        baseClass,
        isCorrect 
          ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
          : 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
      );
    }
    
    return cn(baseClass, 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900');
  };

  return (
    <div className={cn('relative', className)}>
      {/* Sparkles effect for correct answers */}
      {showSparkles && enableAnimations && (
        <div className="absolute inset-0 pointer-events-none">
          <SparklesCore
            id={`sparkles-${question.id}`}
            background="transparent"
            minSize={0.4}
            maxSize={1.0}
            particleDensity={120}
            className="w-full h-full"
            particleColor="#FFD700"
          />
        </div>
      )}
      
      <CardContainer className="inter-var w-full">
        <CardBody 
          className={cn(
            'bg-gray-50 relative group/card dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border',
            isFlipped && 'transform-gpu',
            className
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: enableAnimations && !prefersReducedMotion ? 'transform 0.6s ease-in-out' : 'none',
          }}
        >
          {/* Front of card - Question */}
          <div 
            className={cn(
              'w-full',
              isFlipped && 'opacity-0'
            )}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
            }}
          >
            {/* Question header */}
            <div className="flex items-center justify-between mb-4">
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
              {question.category && (
                <Badge variant="outline">
                  {question.category}
                </Badge>
              )}
            </div>

            {/* Question text */}
            <CardItem
              translateZ="50"
              className="text-xl font-bold text-neutral-600 dark:text-white mb-6"
            >
              {question.question}
            </CardItem>

            {/* Answer options */}
            <CardItem translateZ="100" className="w-full space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={isAnswered}
                  className={getAnswerButtonClass(index)}
                  aria-describedby={`question-${question.id}-explanation`}
                >
                  <span className="font-medium mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
            </CardItem>

            {/* Flip button */}
            {question.explanation && (
              <CardItem translateZ="20" className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFlip}
                  disabled={!enableAnimations || prefersReducedMotion}
                  className="w-full"
                >
                  {isFlipped ? 'Show Question' : 'Show Explanation'}
                </Button>
              </CardItem>
            )}
          </div>

          {/* Back of card - Explanation */}
          {question.explanation && (
            <div
              className={cn(
                'absolute inset-0 w-full p-6',
                !isFlipped && 'opacity-0'
              )}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <CardItem
                translateZ="50"
                className="text-lg font-semibold text-neutral-600 dark:text-white mb-4"
              >
                Explanation
              </CardItem>
              
              <CardItem
                translateZ="100"
                className="text-neutral-500 dark:text-neutral-300 mb-4"
                id={`question-${question.id}-explanation`}
              >
                {question.explanation}
              </CardItem>

              <CardItem translateZ="20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFlip}
                  className="w-full"
                >
                  Back to Question
                </Button>
              </CardItem>
            </div>
          )}
        </CardBody>
      </CardContainer>
    </div>
  );
};

const QuizProgress: React.FC<{
  current: number;
  total: number;
  accuracy?: number;
  enableAnimations: boolean;
  className?: string;
}> = ({ current, total, accuracy, enableAnimations, className }) => {
  const progress = (current / total) * 100;
  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  useEffect(() => {
    if (enableAnimations) {
      startMonitoring();
      const timer = setTimeout(() => {
        stopMonitoring();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [current, enableAnimations, startMonitoring, stopMonitoring]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Question {current} of {total}</span>
        {accuracy !== undefined && (
          <span>Accuracy: {Math.round(accuracy)}%</span>
        )}
      </div>
      
      <Progress 
        value={progress}
        className="w-full h-2"
        style={{
          transition: enableAnimations ? 'all 0.3s ease-in-out' : 'none',
        }}
      />
    </div>
  );
};

export const EnhancedQuizDisplay: React.FC<EnhancedQuizDisplayProps> = ({
  questions,
  currentIndex,
  totalQuestions,
  onAnswer,
  onNext,
  onPrevious,
  showProgress,
  enableAnimations,
  className,
}) => {
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  
  const { ref, isVisible } = useIntersectionAnimation({
    threshold: 0.1,
    animation: { duration: 600, easing: 'ease-out' },
  });

  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  const currentQuestion = questions[currentIndex];
  const accuracy = useMemo(() => {
    if (answeredQuestions.size === 0) return 0;
    
    const correctAnswers = Array.from(answeredQuestions).filter(questionId => {
      const question = questions.find(q => q.id === questionId);
      return question && selectedAnswers[questionId] === question.correctAnswer;
    }).length;
    
    return (correctAnswers / answeredQuestions.size) * 100;
  }, [answeredQuestions, selectedAnswers, questions]);

  const handleAnswer = useCallback((questionId: string, answerIndex: number) => {
    startMonitoring();
    
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    onAnswer(questionId, answerIndex);
    
    // Auto-advance to next question after a delay
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        onNext();
      }
      stopMonitoring();
    }, 1500);
  }, [currentIndex, totalQuestions, onAnswer, onNext, startMonitoring, stopMonitoring]);

  const toggleCorrectAnswers = useCallback(() => {
    setShowCorrectAnswers(!showCorrectAnswers);
  }, [showCorrectAnswers]);

  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    );
  }

  return (
    <div 
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        'max-w-4xl mx-auto space-y-6',
        'transition-opacity duration-600',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {/* Progress indicator */}
      {showProgress && (
        <QuizProgress
          current={currentIndex + 1}
          total={totalQuestions}
          accuracy={accuracy}
          enableAnimations={enableAnimations}
        />
      )}

      {/* Quiz card */}
      <QuizCard
        question={currentQuestion}
        onAnswer={(answerIndex) => handleAnswer(currentQuestion.id, answerIndex)}
        isAnswered={answeredQuestions.has(currentQuestion.id)}
        selectedAnswer={selectedAnswers[currentQuestion.id]}
        showCorrectAnswer={showCorrectAnswers}
        enableAnimations={enableAnimations}
      />

      {/* Navigation controls */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCorrectAnswers}
          >
            {showCorrectAnswers ? 'Hide' : 'Show'} Answers
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        <Button
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
        >
          {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>

      {/* Accessibility announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {answeredQuestions.has(currentQuestion.id) && (
          `Question ${currentIndex + 1} answered. ${
            accuracy > 0 ? `Current accuracy: ${Math.round(accuracy)}%` : ''
          }`
        )}
      </div>
    </div>
  );
};

export default EnhancedQuizDisplay;