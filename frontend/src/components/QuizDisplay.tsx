// frontend/src/components/QuizDisplay.tsx
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
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
          No valid questions available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't find any valid questions to display. 
          Please try generating questions again or contact support if the issue persists.
        </p>
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">
                Question {currentQuestionIndex + 1} of {validQuestions.length}
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <CheckCircle className="h-5 w-5" />
              <span>{Object.keys(selectedAnswers).length} of {validQuestions.length} answered</span>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>

        {/* Question Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Question:
            </h3>
            <p className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
              {currentQuestion.partial_sentence || "Question not available"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Correct Answer */}
            <label className={`block relative rounded-lg border-2 p-4 cursor-pointer transition-all
              ${selectedAnswers[currentQuestionIndex] === "correct" 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
              <div className="flex items-center">
                <input
                  type="radio"
                  className="sr-only"
                  name={`question-${currentQuestionIndex}`}
                  value="correct"
                  checked={selectedAnswers[currentQuestionIndex] === "correct"}
                  onChange={() => handleAnswerSelection(currentQuestionIndex, "correct")}
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                  ${selectedAnswers[currentQuestionIndex] === "correct"
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300 dark:border-gray-600"}`}>
                  {selectedAnswers[currentQuestionIndex] === "correct" && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-gray-900 dark:text-gray-100">
                  {currentQuestion.original_sentence || "No answer available"}
                </span>
              </div>
            </label>

            {/* False Answers */}
            {hasFalseSentences ? (
              currentQuestion.false_sentences.map((sentence, optionIndex) => (
                <label key={optionIndex} className={`block relative rounded-lg border-2 p-4 cursor-pointer transition-all
                  ${selectedAnswers[currentQuestionIndex] === `option-${optionIndex}`
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      className="sr-only"
                      name={`question-${currentQuestionIndex}`}
                      value={`option-${optionIndex}`}
                      checked={selectedAnswers[currentQuestionIndex] === `option-${optionIndex}`}
                      onChange={() => handleAnswerSelection(currentQuestionIndex, `option-${optionIndex}`)}
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center
                      ${selectedAnswers[currentQuestionIndex] === `option-${optionIndex}`
                        ? "border-red-500 bg-red-500"
                        : "border-gray-300 dark:border-gray-600"}`}>
                      {selectedAnswers[currentQuestionIndex] === `option-${optionIndex}` && (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-gray-100">
                      {sentence || "No answer available"}
                    </span>
                  </div>
                </label>
              ))
            ) : (
              <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
                  <span className="text-yellow-800 dark:text-yellow-300">
                    No alternative answers available for this question
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              {currentQuestionIndex === validQuestions.length - 1 ? (
                <Button
                  onClick={handleQuizSubmit}
                  disabled={!canSubmit}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Quiz</span>
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!selectedAnswers[currentQuestionIndex]}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;