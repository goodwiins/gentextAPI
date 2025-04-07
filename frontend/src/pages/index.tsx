// frontend/src/pages/index.tsx
import { useEffect, useState, useRef } from 'react';
import { useRouter } from "next/router";
import { Submission } from "@/components/submission";
import QuizDisplay, { QuizQuestion } from '@/components/QuizDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useAuthContext } from "@/context/auth-context";
import { Icons } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ApiResponse {
  success: boolean;
  data: Array<{
    original_sentence: string;
    partial_sentence: string;
    false_sentences: string[];
  }>;
  generator_used?: string;
  generation_time?: number;
  message?: string;
}

// Define type for debugging info
interface DebugInfo {
  rawResponse?: string;
  parsedResponse?: unknown;
  timestamp?: string;
  processingApproach?: string;
  error?: string;
  errorStack?: string;
  [key: string]: any; // Allow other properties
}

// Define possible API response formats
type ApiResponseObject = {
  success?: boolean;
  data?: any[];
  [key: string]: any;
};

type ApiResponseData = ApiResponseObject | any[];

// Helper function to check response type
function isResponseArray(data: ApiResponseData): data is any[] {
  return Array.isArray(data);
}

function isResponseObject(data: ApiResponseData): data is ApiResponseObject {
  return !Array.isArray(data) && typeof data === 'object' && data !== null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://167.71.90.100:8000';
// DEBUG_MODE constant removed

const Home: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [responseData, setResponseData] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'input' | 'quiz'>('input');
  const [userStats, setUserStats] = useState({ quizzes: 0, questions: 0 });
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null); // Use the defined type
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { authState } = useAuthContext();
  
  // Determine if in development environment
  const isDevelopment = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    if (!authState.isLoading && !authState.user) {
      router.push("/login");
    } else if (authState.user) {
      // Fetch user stats if user is logged in
      fetchUserStats();
    }
  }, [authState, router]);

  const fetchUserStats = async () => {
    try {
      // Check if we have a valid session before making the API call
      if (!authState.session || !authState.session.$id) {
        console.warn('No valid session found, skipping stats fetch');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/v2/user/stats`, {
        headers: {
          'Authorization': `Bearer ${authState.session?.$id}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      } else {
        console.error('Failed to fetch user stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Removed parseExactFormat, parseDirectFormat, superSimpleParser, parseClaudeResponse, adaptApiResponse, extractQuestionsFromUnstructuredData

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to generate questions');
      return;
    }

    // Check if we have a valid session before proceeding
    if (!authState.user && !authState.session) {
      toast.error('Your session has expired. Please log in again.');
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo(null); // Reset debug info
      
      const requestBody = { 
        text,
        num_statements: 5 // You can adjust this number as needed
      };
      
      // Log request details only in development
      if (isDevelopment) {
        console.log('API Request:', `${API_BASE_URL}/generate/qa`, requestBody);
      }
      
      const response = await fetch(`${API_BASE_URL}/generate/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.$id}`
        },
        body: JSON.stringify(requestBody),
      });

      // Log response status only in development
      if (isDevelopment) {
        console.log('API Response Status:', response.status);
      }

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMessage = response.statusText || 'Failed to process text';
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            console.error('Server error response (JSON):', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
             console.error('Failed to parse error JSON, falling back to text.');
             const errorText = await response.text();
             console.error('Server error response (Text):', errorText);
             errorMessage = errorText || errorMessage;
          }
        } else {
          const errorText = await response.text();
          console.error('Server error response (Text):', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Get the raw response text first
      const responseText = await response.text();
      
      // Log raw response and save for debugging only in development
      if (isDevelopment) {
        console.log('Raw API Response Text:', responseText);
        setDebugInfo({
          rawResponse: responseText,
          timestamp: new Date().toISOString()
        });
      }
      
      // Detect if response is empty or whitespace
      if (!responseText.trim()) {
        console.error('Empty response received from server');
        throw new Error('Server returned an empty response');
      }
      
      // Attempt to parse the response text as JSON
      let parsedData: ApiResponseData;
      try {
        parsedData = JSON.parse(responseText);
        if (isDevelopment) {
            setDebugInfo((prev: DebugInfo | null) => ({
              ...prev || {},
              parsedResponse: parsedData,
            }));
        }
      } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        if (isDevelopment) {
            setDebugInfo((prev: DebugInfo | null) => ({
              ...prev || {},
              parseError: (parseError as Error).message,
              parseErrorStack: (parseError as Error).stack,
            }));
        }
        throw new Error('Invalid JSON response from server');
      }

      let questionsArray: any[] | null = null;
      let processingApproach = 'none';

      // Try to extract the questions array based on common structures
      if (isResponseObject(parsedData)) {
         // Approach 1: Standard format { success: true, data: [...] }
         if (parsedData.success === true && Array.isArray(parsedData.data)) {
            questionsArray = parsedData.data;
            processingApproach = 'standard_success_data';
         } 
         // Approach 2: Data array without success field
         else if (Array.isArray(parsedData.data)) {
             questionsArray = parsedData.data;
             processingApproach = 'object_data_array';
         }
         // Approach 3: Look for common array keys
         else {
             const commonKeys = ['questions', 'results', 'items', 'quiz', 'statements'];
             for (const key of commonKeys) {
                 if (Array.isArray(parsedData[key]) && parsedData[key].length > 0) {
                     questionsArray = parsedData[key];
                     processingApproach = `object_key_${key}`;
                     break;
                 }
             }
         }
      } 
      // Approach 4: Direct array response
      else if (isResponseArray(parsedData)) {
         questionsArray = parsedData;
         processingApproach = 'direct_array';
      }
      
      if (isDevelopment) {
           setDebugInfo((prev: DebugInfo | null) => ({
             ...prev || {},
             processingApproach: processingApproach,
             foundArrayLength: questionsArray?.length ?? 0,
           }));
      }

      if (!questionsArray) {
         console.error('Could not find a valid questions array in the response.', parsedData);
         throw new Error('Could not extract valid question data from response format.');
      }

      // Process the extracted array using the helper function
      const processedData = processQuestionsData(questionsArray);

      if (processedData.length === 0) {
        console.error('No valid questions could be processed from the data.', questionsArray);
        // Update debug info if needed
        if (isDevelopment) {
          setDebugInfo((prev: DebugInfo | null) => ({
             ...prev || {},
             processedDataLength: 0,
             finalProcessedData: [],
          }));
        }
        throw new Error('No valid questions found in the response data.');
      }
      
      // Log processed data only in development
      if (isDevelopment) {
        console.log('Processed Questions:', processedData);
        setDebugInfo((prev: DebugInfo | null) => ({
           ...prev || {},
           processedDataLength: processedData.length,
           finalProcessedData: processedData,
           finalProcessingApproach: processingApproach,
        }));
      }
      
      setResponseData(processedData);
      setActiveSection('quiz');
      toast.success(`Generated ${processedData.length} questions successfully!`);
      
      // Smooth scroll to quiz section
      quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error processing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Update debug info with error only in development
      if (isDevelopment) {
        setDebugInfo((prev: DebugInfo | null) => ({
          ...prev || {},
          error: errorMessage,
          errorStack: error instanceof Error ? error.stack : 'No stack trace',
          errorTime: new Date().toISOString()
        }));
      }
      
      toast.error('Failed to generate questions: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process question data regardless of source format
  // Keep console logs here as they are useful for diagnosing processing issues within this specific function
  const processQuestionsData = (data: any[]): QuizQuestion[] => {
    try {
      // Safety check
      if (!Array.isArray(data)) {
        console.error('processQuestionsData received non-array input:', data);
        return [];
      }
      
      if (data.length === 0) {
        console.log('processQuestionsData received empty data array');
        return [];
      }
      
      // Log the first item to help debugging if needed (conditionally)
      if (isDevelopment) {
         console.log('Processing data array (first item):', data[0]);
      }
      
      const processedQuestions = data.map((item, index) => {
        // Skip null or undefined items
        if (!item || typeof item !== 'object') {
          if (isDevelopment) console.log(`Item at index ${index} is invalid (null, undefined, or not an object)`);
          return null;
        }
        
        // Try to extract fields with various possible names
        let originalSentence = '';
        let partialSentence = '';
        let falseSentences: string[] = [];
        
        // Extract original sentence (answer)
        const origKeys = ['original_sentence', 'fullSentence', 'sentence', 'answer', 'correctAnswer', 'correct_answer', 'right_answer', 'text'];
        for (const key of origKeys) {
            if (typeof item[key] === 'string') {
                originalSentence = item[key];
                break;
            }
        }
        
        // Extract partial sentence (question/prompt)
        const partialKeys = ['partial_sentence', 'partialSentence', 'question', 'prompt', 'stem', 'text']; // Allow 'text' again as fallback
         for (const key of partialKeys) {
            if (typeof item[key] === 'string') {
                partialSentence = item[key];
                break; // Use the first match found
            }
        }
        
        // If still no partial sentence, attempt fallback using original
        if (!partialSentence && originalSentence) {
          partialSentence = originalSentence.substring(0, Math.floor(originalSentence.length / 2)).trim() + '...';
          if (isDevelopment) console.log(`Generated fallback partial sentence for item ${index}`);
        }
        
        // Extract false sentences (distractors/options)
        const falseKeys = ['false_sentences', 'falseSentences', 'falseStatements', 'options', 'choices', 'incorrect_answers', 'wrongAnswers', 'distractors'];
        for (const key of falseKeys) {
           if (Array.isArray(item[key])) {
               falseSentences = item[key];
               break;
           }
        }

        // Clean up the data
        const cleanOrigSentence = originalSentence?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';
        const cleanPartialSentence = partialSentence?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';
        // Filter out the correct answer from options if necessary, ensure strings, and remove empty ones
        const cleanFalseSentences = falseSentences
          .filter(s => s !== null && s !== undefined && s !== cleanOrigSentence) 
          .map(s => s?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
          .filter(s => s && s.length > 0); // Remove empty strings after cleaning

        // For debugging (conditional)
        if (isDevelopment && (cleanOrigSentence || cleanPartialSentence)) {
            console.log(`Processed item ${index}:`, {
              original: cleanOrigSentence,
              partial: cleanPartialSentence,
              falseCount: cleanFalseSentences.length
            });
        }
        
        // Only return valid questions (must have original and partial sentence)
        if (cleanOrigSentence && cleanPartialSentence) {
          return {
            original_sentence: cleanOrigSentence,
            partial_sentence: cleanPartialSentence,
            false_sentences: cleanFalseSentences
          };
        } else {
           if (isDevelopment) console.warn(`Skipping item ${index} due to missing original or partial sentence after processing.`);
           return null;
        }
      }).filter(q => q !== null) as QuizQuestion[]; // Filter out null results
      
      console.log(`Successfully processed ${processedQuestions.length} valid questions out of ${data.length} items`);
      return processedQuestions;
    } catch (error) {
      console.error('Error during processQuestionsData:', error);
      return [];
    }
  };

  // Removed adaptApiResponse and parseClaudeResponse

  const handleQuizSubmit = async (answers: {[key: number]: string}) => {
    try {
      toast.loading('Submitting your answers...');
      
      const response = await fetch(`${API_BASE_URL}/api/v2/submit_quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.$id}`
        },
        body: JSON.stringify({
          text,
          answers,
          questions: responseData // Send the processed questions
        }),
      });

      if (!response.ok) {
        toast.dismiss();
        // Try to get more specific error message
        let submitError = 'Failed to submit quiz';
        try {
           const errorData = await response.json();
           submitError = errorData.message || errorData.error || submitError;
        } catch (e) {
           // Ignore if response is not JSON
        }
        console.error('Error submitting quiz:', response.statusText, submitError);
        throw new Error(submitError);
      }

      // const result = await response.json(); // Result might not be needed
      await response.json(); // Consume response body
      toast.dismiss();
      toast.success('Quiz submitted successfully!');
      
      // Reset state for a new quiz
      setActiveSection('input');
      setText('');
      setResponseData(null); // Clear previous quiz data
      
      // Update user stats
      fetchUserStats();
      
      // Smooth scroll back to input section
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.dismiss();
      console.error('Error submitting quiz:', error);
      toast.error(`Failed to submit quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Optionally trigger handleSubmit again or clear input
    // For now, just clear the error message
  };

  const handleCreateNew = () => {
    setActiveSection('input');
    setText('');
    setResponseData(null);
    setError(null); // Also clear any previous errors
    setDebugInfo(null); // Clear debug info
    
    // Smooth scroll to input section
    inputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Removed testApiResponse, testApiConnectivity, testWithMockEndpoint, testWithMinimalistFetch, testSimpleEndpoint
  // Removed extractQuestionsFromUnstructuredData

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative">
        {/* Debug info display section - only visible in development */}
        {isDevelopment && debugInfo && (
          <Card className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 overflow-auto max-h-[500px]">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Dev Debug Information</h3>
            <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))}
                className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
              >
                Copy Debug Info
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDebugInfo(null)}
                className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
              >
                Hide Debug Info
              </Button>
            </div>
          </Card>
        )}
        
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 md:mb-24 text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
          <div className="relative py-12 md:py-16">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Icons.Rocket className="h-10 w-10 md:h-14 md:w-14 text-blue-600 dark:text-blue-400 animate-float" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                genText AI
              </h1>
            </div>
            
            <p className="mt-6 md:mt-8 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Generate interactive quizzes instantly from any text to boost your learning.
            </p>
            
            <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-4 md:gap-6">
              {authState.user && (
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                  <Badge variant="outline" className="px-5 py-2.5 text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border-blue-200 dark:border-blue-800">
                    <Icons.PlusCircle className="h-4 w-4 mr-2.5 text-blue-500" />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{userStats.quizzes}</span> Quizzes
                  </Badge>
                  <Badge variant="outline" className="px-5 py-2.5 text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 border-indigo-200 dark:border-indigo-800">
                    <Icons.Moon className="h-4 w-4 mr-2.5 text-indigo-500" />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{userStats.questions}</span> Questions
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section 
          id="input-section"
          ref={inputSectionRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`transition-all duration-500 relative mb-20 md:mb-32 ${activeSection === 'quiz' && responseData ? 'opacity-80 hover:opacity-100 filter hover:blur-none blur-[1px]' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
          <div className="relative p-4 md:p-6 lg:p-8">
            <div className="mb-8 md:mb-10 flex flex-col space-y-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                  <Icons.PlusCircle className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">Enter your text</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-base md:text-lg">
                    Paste any text content below to generate quiz questions
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 md:gap-4 mt-6 md:mt-8 justify-center">
                <Badge className="px-4 py-2 md:px-5 md:py-2.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <Icons.Rocket className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-2.5" />
                  Educational content
                </Badge>
                <Badge className="px-4 py-2 md:px-5 md:py-2.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <Icons.AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-2.5" />
                  Maximum 18,000 characters
                </Badge>
                <Badge className="px-4 py-2 md:px-5 md:py-2.5 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                  <Icons.Shield className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2 md:mr-2.5" />
                  Private & secure
                </Badge>
              </div>
            </div>
            
            <div className="mx-auto max-w-4xl">
              <Submission 
                onSubmit={handleSubmit} 
                onTextChange={setText}
                text={text}
                isLoading={isLoading}
              />
              
              <div className="mt-6 md:mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto italic">
                  Enter text from notes, articles, textbooks, or study materials to generate relevant quiz questions.
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="my-16 md:my-24 flex flex-col items-center justify-center relative"
              >
                <LoadingSpinner message="Processing your text..." />
                <p className="mt-8 md:mt-10 text-gray-500 dark:text-gray-400 text-sm max-w-lg text-center">
                  This may take a few moments depending on the length of your text. 
                  We're analyzing your content to generate relevant questions.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="my-12 md:my-16 p-6 md:p-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-md relative max-w-3xl mx-auto"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <Icons.AlertCircle className="h-7 w-7 md:h-8 md:w-8 text-red-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Error Generating Quiz</h3>
                    <p className="mt-2 md:mt-4 text-red-700 dark:text-red-300">{error}</p>
                    <div className="mt-6 md:mt-8">
                      <Button
                        onClick={handleRetry}
                        variant="destructive"
                        className="flex items-center px-6 py-3 h-auto transition-all duration-300 hover:scale-105"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <AnimatePresence>
          {!isLoading && responseData && Array.isArray(responseData) && responseData.length > 0 ? (
            <motion.section
              id="quiz-section" 
              ref={quizSectionRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`mt-8 md:mt-10 transition-all duration-500 relative mb-20 md:mb-32 ${activeSection === 'input' ? 'opacity-80 hover:opacity-100 filter hover:blur-none blur-[1px]' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
              <div className="relative p-4 md:p-6 lg:p-8">
                <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">Take your quiz</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto transform transition-all duration-500 hover:shadow-2xl">
                  <div className="p-6 md:p-10 bg-gradient-to-r from-blue-600 to-indigo-600 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                      <Icons.AlertCircle className="h-6 w-6 md:h-7 md:w-7 mr-3 md:mr-5" />
                      Your Quiz ({responseData.length} questions)
                    </h2>
                    <Button
                      onClick={handleCreateNew}
                      variant="secondary"
                      className="flex items-center px-5 md:px-7 py-2.5 md:py-3 h-auto w-full md:w-auto transition-all duration-300 hover:scale-105"
                    >
                      <Icons.PlusCircle className="h-4 w-4 mr-2 md:mr-3" />
                      Create New Quiz
                    </Button>
                  </div>
                  <QuizDisplay 
                    questions={responseData} 
                    originalText={text} 
                    onSubmit={handleQuizSubmit} 
                  />
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-20 md:mt-32 grid gap-6 md:gap-8 lg:gap-12 md:grid-cols-1 lg:grid-cols-3 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
          
          <div className="relative">
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
              className="p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
            >
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6 md:mb-8 shadow-md">
                <Icons.Rocket className="h-7 w-7 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-5 text-gray-900 dark:text-white">AI-Powered Quizzes</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
                Our advanced AI technology generates relevant questions instantly from any text you provide.
              </p>
            </motion.div>
          </div>
          
          <div className="relative">
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
              className="p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
            >
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 md:mb-8 shadow-md">
                <Icons.Shield className="h-7 w-7 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-5 text-gray-900 dark:text-white">Secure & Private</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
                Your data is encrypted and protected. We prioritize your privacy and security.
              </p>
            </motion.div>
          </div>
          
          <div className="relative">
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
              className="p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
            >
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6 md:mb-8 shadow-md">
                <Icons.Settings className="h-7 w-7 md:h-8 md:w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-5 text-gray-900 dark:text-white">Track Progress</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
                Monitor your learning progress and review your quiz history to improve over time. (Coming Soon!)
              </p>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Home;