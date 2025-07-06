import React from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from '@/components/Icons';

export interface UserStats {
  quizzes: number;
  questions: number;
}

interface UserStatsCardProps {
  stats: UserStats;
  isLoading?: boolean;
}

export const UserStatsCard: React.FC<UserStatsCardProps> = ({ stats, isLoading = false }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 backdrop-blur-sm bg-white/50 border-blue-200">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="p-6 backdrop-blur-sm bg-gradient-to-br from-white/80 to-blue-50/50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <motion.div variants={itemVariants} className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Your Progress
          </h3>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <Badge 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200 px-3 py-1 text-lg font-bold"
              >
                {stats.quizzes}
              </Badge>
              <span className="text-sm text-gray-600 font-medium">Quizzes</span>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex flex-col items-center space-y-2">
              <Badge 
                variant="secondary" 
                className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200 px-3 py-1 text-lg font-bold"
              >
                {stats.questions}
              </Badge>
              <span className="text-sm text-gray-600 font-medium">Questions</span>
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};