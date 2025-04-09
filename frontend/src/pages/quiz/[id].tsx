import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Client, Databases } from 'appwrite';
import { useAuthContext } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Environment variables with fallbacks
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || '';

interface Question {
  question: string;
  options: string[];
  answer: string;
}

interface Quiz {
  $id: string;
  title: string;
  text: string;
  questions: Question[];
  createdAt: string;
  userId: string;
}

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query;
  const { authState } = useAuthContext();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize Appwrite client
        const client = new Client()
          .setEndpoint(APPWRITE_ENDPOINT)
          .setProject(APPWRITE_PROJECT_ID);
        
        const databases = new Databases(client);
        
        // Fetch the quiz document from Appwrite
        const response = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          id as string
        );
        
        // Parse the questions JSON string
        let parsedQuestions: Question[] = [];
        try {
          const rawQuestions = JSON.parse(response.questions);
          
          // Handle different possible data structures
          if (Array.isArray(rawQuestions)) {
            parsedQuestions = rawQuestions.map(q => {
              // Handle different question formats
              if (typeof q === 'object') {
                // Check if it already matches our Question interface
                if (q.question && Array.isArray(q.options) && q.answer) {
                  return q as Question;
                }
                
                // Try to map from different formats
                return {
                  question: q.question || q.partial_sentence || q.text || 'Question',
                  options: Array.isArray(q.options) ? q.options : 
                          Array.isArray(q.false_sentences) ? [...q.false_sentences, q.original_sentence] : 
                          [q.original_sentence || 'Option'],
                  answer: q.answer || q.original_sentence || q.correct_answer || 'Answer'
                };
              }
              
              // If it's not an object, create a simple question
              return {
                question: String(q),
                options: ['Option 1', 'Option 2'],
                answer: 'Option 1'
              };
            });
          } else if (typeof rawQuestions === 'object') {
            // Handle case where it's an object but not an array
            parsedQuestions = [{
              question: rawQuestions.question || 'Question',
              options: Array.isArray(rawQuestions.options) ? rawQuestions.options : ['Option 1', 'Option 2'],
              answer: rawQuestions.answer || 'Option 1'
            }];
          }
          
          // Ensure we have at least one question
          if (parsedQuestions.length === 0) {
            parsedQuestions = [{
              question: 'Sample Question',
              options: ['Option 1', 'Option 2'],
              answer: 'Option 1'
            }];
          }
        } catch (e) {
          console.error('Failed to parse questions:', e);
          // Create a default question instead of an empty array
          parsedQuestions = [{
            question: 'Sample Question',
            options: ['Option 1', 'Option 2'],
            answer: 'Option 1'
          }];
        }
        
        setQuiz({
          $id: response.$id,
          title: response.title,
          text: response.text,
          questions: parsedQuestions,
          createdAt: response.createdAt,
          userId: response.userId
        });
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
        setError('Failed to load quiz. ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleBack = () => {
    router.push('/history');
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct++;
      }
    });
    
    return correct;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="w-10 h-10 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={handleBack}>
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested quiz could not be found.</p>
            <Button className="mt-4" onClick={handleBack}>
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{quiz.title || 'Untitled Quiz'}</CardTitle>
            <Button variant="outline" onClick={handleBack}>
              Back to History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Source Text</h3>
            <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{quiz.text}</p>
          </div>

          <Separator />
          
          <div className="space-y-8">
            <h3 className="text-lg font-medium">Quiz Questions</h3>
            
            {quiz.questions.length === 0 ? (
              <p className="text-gray-500">No questions available for this quiz.</p>
            ) : (
              quiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-lg mb-3">
                    Question {qIndex + 1}: {question.question}
                  </h4>
                  
                  <div className="space-y-2 mt-2">
                    {question.options.map((option, oIndex) => (
                      <div 
                        key={oIndex} 
                        className={`
                          p-3 border rounded-md cursor-pointer
                          ${selectedAnswers[qIndex] === option ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                          ${showResults && option === question.answer ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                          ${showResults && selectedAnswers[qIndex] === option && option !== question.answer 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : ''}
                        `}
                        onClick={() => !showResults && handleSelectAnswer(qIndex, option)}
                      >
                        {option}
                        
                        {showResults && option === question.answer && (
                          <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                            (Correct Answer)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Created on {new Date(quiz.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="flex space-x-4">
            {showResults && (
              <div className="flex items-center mr-4">
                <span className="font-medium">
                  Score: {calculateScore()} / {quiz.questions.length}
                </span>
              </div>
            )}
            
            {!showResults && quiz.questions.length > 0 && (
              <Button onClick={handleSubmit}>
                Submit Answers
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 