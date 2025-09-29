/**
 * Enhanced History Component with Infinite Moving Cards
 * Displays quiz history in an animated card carousel with Aceternity UI effects
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { SparklesCore } from '@/components/ui/sparkles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Meteors } from '@/components/ui/meteors';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useReducedMotion } from 'framer-motion';
import { useIntersectionAnimation } from '@/lib/animations';
import { QuizItem } from '@/lib/quizService';
import { Icons } from '@/components/Icons';
import { formatDistanceToNow } from 'date-fns';

interface QuizHistoryCardProps {
  quiz: QuizItem;
  onView: (quiz: QuizItem) => void;
  onDelete: (id: string) => void;
  enableAnimations: boolean;
  index: number;
}

const QuizHistoryCard: React.FC<QuizHistoryCardProps> = ({
  quiz,
  onView,
  onDelete,
  enableAnimations,
  index,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    
    try {
      await onDelete(quiz.$id);
    } finally {
      setIsDeleting(false);
    }
  }, [quiz.$id, onDelete]);

  const handleView = useCallback(() => {
    onView(quiz);
  }, [onView, quiz]);

  const formatDate = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  }, [quiz.createdAt]);

  const getQuestionCount = useMemo(() => {
    try {
      return quiz.questions ? JSON.parse(quiz.questions).length : 0;
    } catch {
      return 0;
    }
  }, [quiz.questions]);

  const getCardColor = (index: number) => {
    const colors = [
      'from-blue-500/20 to-purple-500/20',
      'from-purple-500/20 to-pink-500/20',
      'from-green-500/20 to-blue-500/20',
      'from-orange-500/20 to-red-500/20',
      'from-indigo-500/20 to-purple-500/20',
    ];
    return colors[index % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className={cn(
            'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-30 group-hover:opacity-50 transition-opacity duration-300',
            getCardColor(index)
          )}
        />
        {enableAnimations && !prefersReducedMotion && (
          <Meteors number={8} className="absolute inset-0" />
        )}
      </div>

      <CardContainer 
        className="w-full h-full inter-var"
        containerClassName="group/card"
      >
        <CardBody 
          className={cn(
            'relative h-full p-6 rounded-2xl border border-white/20 dark:border-gray-700/50',
            'bg-white/10 dark:bg-black/20 backdrop-blur-xl',
            'hover:shadow-2xl transition-all duration-300',
            'cursor-pointer overflow-hidden'
          )}
        >
          {/* Card content */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <CardItem
                  translateZ="50"
                  className="text-xl font-bold text-white mb-2 line-clamp-2"
                >
                  {quiz.title || 'Untitled Quiz'}
                </CardItem>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Icons.FileQuestion className="w-3 h-3 mr-1" />
                    {getQuestionCount} questions
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Icons.Clock className="w-3 h-3 mr-1" />
                    {formatDate}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div 
                className={cn(
                  'flex items-center gap-1 ml-2 transition-all duration-200',
                  showActions ? 'opacity-100' : 'opacity-0'
                )}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleView}
                  disabled={isDeleting}
                >
                  <Icons.Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/20"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Icons.Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.Trash className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Content preview */}
            <CardItem 
              translateZ="30"
              className="flex-1 text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4"
            >
              {quiz.text || 'No content available'}
            </CardItem>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <CardItem translateZ="20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400">Ready to play</span>
                </div>
              </CardItem>
              
              <CardItem translateZ="40">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-white/20 hover:bg-white/10 text-white"
                  onClick={handleView}
                >
                  Start Quiz
                  <Icons.Rocket className="w-3 h-3 ml-1" />
                </Button>
              </CardItem>
            </div>
          </div>

          {/* Sparkles effect */}
          {enableAnimations && !prefersReducedMotion && (
            <div className="absolute inset-0 pointer-events-none">
              <SparklesCore
                id={`sparkles-${quiz.$id}`}
                background="transparent"
                minSize={0.3}
                maxSize={0.8}
                particleDensity={40}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />
            </div>
          )}
        </CardBody>
      </CardContainer>
    </motion.div>
  );
};

interface EnhancedHistoryProps {
  quizzes: QuizItem[];
  onViewQuiz: (quiz: QuizItem) => void;
  onDeleteQuiz: (id: string) => void;
  onRefresh: () => void;
  enableAnimations?: boolean;
  className?: string;
}

export const EnhancedHistory: React.FC<EnhancedHistoryProps> = ({
  quizzes,
  onViewQuiz,
  onDeleteQuiz,
  onRefresh,
  enableAnimations = true,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'infinite'>('cards');
  const [filteredQuizzes, setFilteredQuizzes] = useState(quizzes);
  const { ref, isVisible } = useIntersectionAnimation({
    threshold: 0.1,
    animation: { duration: 800, easing: 'ease-out' },
  });

  const { startMonitoring, stopMonitoring } = usePerformanceMonitor();

  // Prepare data for infinite moving cards
  const infiniteCardsData = useMemo(() => {
    return quizzes.map(quiz => ({
      quote: quiz.text || 'No content available',
      name: quiz.title || 'Untitled Quiz',
      title: `${quiz.questions ? JSON.parse(quiz.questions).length : 0} questions • ${new Date(quiz.createdAt).toLocaleDateString()}`,
    }));
  }, [quizzes]);

  const handleViewQuiz = useCallback((quiz: QuizItem) => {
    onViewQuiz(quiz);
  }, [onViewQuiz]);

  const handleDeleteQuiz = useCallback(async (id: string) => {
    await onDeleteQuiz(id);
  }, [onDeleteQuiz]);

  const handleRefresh = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'cards' ? 'infinite' : 'cards');
  }, []);

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <Icons.FileQuestion className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No quizzes yet</h3>
        <p className="text-gray-500 mb-6">Create your first quiz to get started!</p>
        <Button onClick={() => onViewQuiz({} as QuizItem)}>
          <Icons.PlusCircle className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={ref as any}
      className={cn('relative w-full', className)}
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <BackgroundBeams />
      </div>

      {/* Header with controls */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Quiz History</h2>
            <p className="text-gray-400">
              {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} created
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {viewMode === 'cards' ? (
                <>
                  <Icons.Gallery className="mr-2 h-4 w-4" />
                  Infinite View
                </>
              ) : (
                <>
                  <Icons.Grid className="mr-2 h-4 w-4" />
                  Grid View
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Icons.RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content based on view mode */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {viewMode === 'cards' ? (
            /* Grid view with 3D cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz, index) => (
                <QuizHistoryCard
                  key={quiz.$id}
                  quiz={quiz}
                  onView={handleViewQuiz}
                  onDelete={handleDeleteQuiz}
                  enableAnimations={enableAnimations}
                  index={index}
                />
              ))}
            </div>
          ) : (
            /* Infinite moving cards view */
            <div className="h-[600px] relative">
              <InfiniteMovingCards
                items={infiniteCardsData}
                direction="left"
                speed="slow"
                pauseOnHover={true}
                className="w-full"
              />
              
              {/* Overlay with action buttons */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Infinite Quiz Stream</h3>
                  <p className="text-gray-400 mb-4">Watch your quizzes flow by</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleViewMode}
                    className="pointer-events-auto border-white/20 text-white hover:bg-white/10"
                  >
                    <Icons.Grid className="mr-2 h-4 w-4" />
                    Switch to Grid
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EnhancedHistory;