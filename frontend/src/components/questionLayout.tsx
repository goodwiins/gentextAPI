import React from 'react';

type QuestionLayoutProps = {
  data: {
    original_sentence: string;
    partial_sentence: string;
    false_sentences: string[];
  };
};

export const QuestionLayout: React.FC<QuestionLayoutProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  const { original_sentence, partial_sentence, false_sentences } = data;

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Quiz Question</h1>
        <p className="text-gray-700 dark:text-gray-400 mb-6">
          {original_sentence}
        </p>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 rounded"
              id="option1"
              name="answer"
              type="radio"
            />
            <label className="ml-2 text-gray-700 dark:text-gray-400 font-medium" htmlFor="option1">
              {partial_sentence}
            </label>
          </div>
          {false_sentences && false_sentences.map((sentence: string, index: number) => (
            <div className="flex items-center" key={index}>
              <input
                className="h-4 w-4 text-gray-300 focus:ring-gray-500 border-gray-300 rounded"
                id={`option${index + 2}`}
                name="answer"
                type="radio"
              />
              <label className="ml-2 text-gray-700 dark:text-gray-400 font-medium" htmlFor={`option${index + 2}`}>
                {sentence}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};