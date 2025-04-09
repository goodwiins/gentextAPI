import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export interface QuizQuestion {
  original_sentence: string;
  partial_sentence: string;
  false_sentences: string[];
}

interface QuizDisplayProps {
  questions: QuizQuestion[];
  originalText?: string;
  onSubmit?: (answers: {[key: number]: string}) => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ 
  questions, 
  originalText = "",
  onSubmit 
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validQuestions, setValidQuestions] = useState<QuizQuestion[]>([]);

  // Validate questions on component mount
  useEffect(() => {
    // Filter out invalid questions
    const filtered = questions.filter(q => 
      q && 
      typeof q === 'object' && 
      q.original_sentence && 
      q.partial_sentence && 
      Array.isArray(q.false_sentences)
    );
    
    setValidQuestions(filtered);
    
    // Reset selected answers when questions change
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  }, [questions]);

  const handleAnswerSelection = (questionIndex: number, value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleQuizSubmit = () => {
    if (onSubmit) {
      onSubmit(selectedAnswers);
    }
  };

  // If no valid questions, show a message
  if (!validQuestions.length) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-5">
            <AlertTriangle className="h-10 w-10 text-yellow-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
            No valid questions available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t find any valid questions to display. 
            Please try generating questions again or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const progress = (Object.keys(selectedAnswers).length / validQuestions.length) * 100;
  const currentQuestion = validQuestions[currentQuestionIndex] || { 
    original_sentence: "No answer available", 
    partial_sentence: "No question available", 
    false_sentences: [] 
  };
  const canSubmit = Object.keys(selectedAnswers).length === validQuestions.length;

  const handleNext = () => {
    if (currentQuestionIndex < validQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Check if we have false sentences to display
  const hasFalseSentences = currentQuestion.false_sentences && 
                             Array.isArray(currentQuestion.false_sentences) && 
                             currentQuestion.false_sentences.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Question {currentQuestionIndex + 1} of {validQuestions.length}
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-300" />
              <span className="font-medium">{Object.keys(selectedAnswers).length} of {validQuestions.length} answered</span>
            </div>
          </div>
          
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/80 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-4">
              {validQuestions.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${
                    idx === currentQuestionIndex
                      ? "bg-white scale-125" 
                      : idx in selectedAnswers 
                        ? "bg-green-300" 
                        : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Complete this sentence:
            </h3>
            <p className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-relaxed border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r-md">
              {currentQuestion.partial_sentence || "Question not available"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Correct Answer */}
            <label 
              className={`block relative rounded-lg border-2 p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md
                ${selectedAnswers[currentQuestionIndex] === "correct" 
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"}`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  className="sr-only"
                  name={`question-${currentQuestionIndex}`}
                  value="correct"
                  checked={selectedAnswers[currentQuestionIndex] === "correct"}
                  onChange={() => handleAnswerSelection(currentQuestionIndex, "correct")}
                />
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300
                  ${selectedAnswers[currentQuestionIndex] === "correct"
                    ? "border-green-500 bg-green-500 scale-110"
                    : "border-gray-300 dark:border-gray-600"}`}
                >
                  {selectedAnswers[currentQuestionIndex] === "correct" && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-lg text-gray-900 dark:text-gray-100">
                  {currentQuestion.original_sentence || "No answer available"}
                </span>
              </div>
            </label>

            {/* False Sentences */}
            {hasFalseSentences && currentQuestion.false_sentences.map((sentence, idx) => (
              <label
                key={idx}
                className={`block relative rounded-lg border-2 p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md
                  ${selectedAnswers[currentQuestionIndex] === `false_${idx}` 
                    ? "border-red-400 bg-red-50 dark:bg-red-900/10" 
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"}`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    className="sr-only"
                    name={`question-${currentQuestionIndex}`}
                    value={`false_${idx}`}
                    checked={selectedAnswers[currentQuestionIndex] === `false_${idx}`}
                    onChange={() => handleAnswerSelection(currentQuestionIndex, `false_${idx}`)}
                  />
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-300
                    ${selectedAnswers[currentQuestionIndex] === `false_${idx}`
                      ? "border-red-400 bg-red-400 scale-110"
                      : "border-gray-300 dark:border-gray-600"}`}
                  >
                    {selectedAnswers[currentQuestionIndex] === `false_${idx}` && (
                      <X className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-lg text-gray-900 dark:text-gray-100">
                    {sentence}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="flex items-center space-x-2 h-12 px-6"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </Button>

            {currentQuestionIndex === validQuestions.length - 1 ? (
              <Button
                onClick={handleQuizSubmit}
                disabled={!canSubmit}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Submit Quiz</span>
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 h-12 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          {!canSubmit && currentQuestionIndex === validQuestions.length - 1 && (
            <div className="mt-4 text-sm text-center text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md">
              Please answer all questions before submitting the quiz
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay; 