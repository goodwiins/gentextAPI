// frontend/src/components/QuizDisplay.tsx
import React, { useState } from 'react';

export interface QuizQuestion {
  original_sentence: string;
  partial_sentence: string;
  false_sentences: string[];
}

interface QuizDisplayProps {
  questions: QuizQuestion[];
  originalText?: string; // Make this optional
  onSubmit?: (answers: {[key: number]: string}) => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ 
  questions, 
  originalText = "", // Default value
  onSubmit 
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({});

  const handleAnswerSelection = (questionIndex: number, value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleQuizSubmit = () => {
    if (onSubmit) {
      onSubmit(selectedAnswers);
    } else {
      console.log('Quiz answers submitted:', selectedAnswers);
    }
  };

  // Function to format correct answers by replacing pronouns with subject names
  const formatCorrectAnswer = (question: QuizQuestion): string => {
    // First, check if originalText exists and is a non-empty string
    if (!originalText || typeof originalText !== 'string' || originalText.trim() === '') {
      return question.original_sentence; // Return the original sentence if originalText is missing
    }

    // Check if the original sentence starts with "It is" or similar pronouns
    if (question.original_sentence.match(/^(It|This|That|They)\s+is/i)) {
      try {
        // Extract the subject name from the original text (in this case "My Sweet Charlie")
        const subjectMatch = originalText.match(/^([^.!?]+?)(?=\s+is|\s+was|\s+has)/i);
        
        if (subjectMatch && subjectMatch[1]) {
          const subject = subjectMatch[1].trim();
          // Replace the pronoun with the proper subject
          return question.original_sentence.replace(/^(It|This|That|They)\s+/i, `${subject} `);
        }
      } catch (error) {
        console.error("Error formatting correct answer:", error);
        // Fall back to the original sentence if there's an error
        return question.original_sentence;
      }
    }
    
    // Return the original sentence if no replacement was made
    return question.original_sentence;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Quiz Questions</h1>
      <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Question {questionIndex + 1}
            </h2>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              Select the correct statement about: <span className="font-semibold">{question.partial_sentence}</span>
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-green-500 focus:ring-green-500 border-gray-300 rounded"
                  id={`q${questionIndex}-correct`}
                  name={`question-${questionIndex}`}
                  type="radio"
                  value="correct"
                  checked={selectedAnswers[questionIndex] === "correct"}
                  onChange={() => handleAnswerSelection(questionIndex, "correct")}
                />
                <label 
                  className="ml-2 text-gray-700 dark:text-gray-400 font-medium" 
                  htmlFor={`q${questionIndex}-correct`}
                >
                  {question.original_sentence}
                </label>
              </div>
              
              {question.false_sentences && question.false_sentences.map((sentence, optionIndex) => (
                <div className="flex items-center" key={optionIndex}>
                  <input
                    className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 rounded"
                    id={`q${questionIndex}-option-${optionIndex}`}
                    name={`question-${questionIndex}`}
                    type="radio"
                    value={`option-${optionIndex}`}
                    checked={selectedAnswers[questionIndex] === `option-${optionIndex}`}
                    onChange={() => handleAnswerSelection(questionIndex, `option-${optionIndex}`)}
                  />
                  <label 
                    className="ml-2 text-gray-700 dark:text-gray-400 font-medium" 
                    htmlFor={`q${questionIndex}-option-${optionIndex}`}
                  >
                    {sentence}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex justify-center mt-8">
          <button 
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-lg"
            onClick={handleQuizSubmit}
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;