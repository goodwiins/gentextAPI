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
import { Models } from "appwrite";

// Define response types with proper TypeScript patterns
interface QuizItem {
  original_sentence: string;
  partial_sentence: string;
  false_sentences: string[];
}

interface ApiResponse {
  success: boolean;
  data: QuizItem[];
  generator_used?: string;
  generation_time?: number;
  message?: string;
}

interface UserStats {
  quizzes: number;
  questions: number;
}

interface DebugInfo {
  rawResponse?: string;
  parsedResponse?: unknown;
  timestamp?: string;
  processingApproach?: string;
  error?: string;
  errorStack?: string;
  [key: string]: unknown;
}

// Define API response formats with better typing
type ApiResponseObject = {
  success?: boolean;
  data?: QuizItem[] | unknown[];
  questions?: QuizItem[] | unknown[];
  results?: QuizItem[] | unknown[];
  items?: QuizItem[] | unknown[];
  quiz?: QuizItem[] | unknown[];
  statements?: QuizItem[] | unknown[];
  [key: string]: unknown;
};

type ApiResponseData = ApiResponseObject | unknown[];

// Type guards with clearer naming
function isArrayResponse(data: ApiResponseData): data is unknown[] {
  return Array.isArray(data);
}

function isObjectResponse(data: ApiResponseData): data is ApiResponseObject {
  return !Array.isArray(data) && typeof data === 'object' && data !== null;
}

// Add a type for saving quizzes
interface SaveQuizRequest {
  title?: string;
  text: string;
  questions: QuizQuestion[];
  userId?: string;
  createdAt?: string;
}

// Use the Next.js API proxy to avoid CORS issues
const API_BASE_URL = '/api';
// DEBUG_MODE constant removed

// API utility functions
const api = {
  /**
   * Makes an authenticated API request
   */
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    authToken?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Create headers object with proper type
    const headers = new Headers(options.headers || {});
    
    // Set content type and conditionally add auth header
    headers.set('Content-Type', 'application/json');
    
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    };
    
    const response = await fetch(url, config);
    
    // Handle non-2xx responses
    if (!response.ok) {
      return api.handleErrorResponse(response);
    }
    
    // Parse JSON response
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response received');
    }
    
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from server');
    }
  },
  
  /**
   * Handles error responses from the API
   */
  async handleErrorResponse(response: Response): Promise<never> {
    const contentType = response.headers.get('content-type') || '';
    let errorMessage = response.statusText || 'Request failed';
    
    if (contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Fallback to text if JSON parsing fails
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
    } else {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    }
    
    throw new Error(errorMessage);
  },
  
  /**
   * Fetches user statistics
   */
  async getUserStats(authToken?: string): Promise<UserStats> {
    if (!authToken) {
      return { quizzes: 0, questions: 0 };
    }
    
    try {
      return await api.request<UserStats>(
        '/api/v2/user/stats', // Ensure this path matches your API's actual endpoint
        { method: 'GET' },
        authToken
      );
    } catch (error) {
      // Handle 404 or other errors gracefully for stats
      console.warn('Failed to fetch user stats:', error);
      // Return default stats instead of throwing
      return { quizzes: 0, questions: 0 };
    }
  },
  
  /**
   * Generates quiz questions from text
   */
  async generateQuiz(
    text: string, 
    numStatements: number, 
    authToken?: string
  ): Promise<ApiResponseData> {
    return api.request<ApiResponseData>(
      '/generate/qa',
      {
        method: 'POST',
        body: JSON.stringify({ text, num_statements: numStatements }),
      },
      authToken
    );
  },
  
  /**
   * Submits quiz answers
   */
  async submitQuiz(
    text: string,
    answers: Record<number, string>,
    questions: QuizQuestion[],
    authToken?: string
  ): Promise<unknown> {
    return api.request(
      '/api/v2/submit_quiz',
      {
        method: 'POST',
        body: JSON.stringify({ text, answers, questions }),
      },
      authToken
    );
  },
  
  /**
   * Saves a generated quiz to the database
   */
  async saveQuiz(
    quiz: SaveQuizRequest,
    authToken?: string
  ): Promise<{ id: string; success: boolean }> {
    return api.request<{ id: string; success: boolean }>(
      '/api/v2/quizzes',
      {
        method: 'POST',
        body: JSON.stringify({
          ...quiz,
          createdAt: new Date().toISOString(),
        }),
      },
      authToken
    );
  },
};

const Home: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [responseData, setResponseData] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'input' | 'quiz'>('input');
  const [userStats, setUserStats] = useState<UserStats>({ quizzes: 0, questions: 0 });
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { authState } = useAuthContext();
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
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
      
      const stats = await api.getUserStats(authState.session.$id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

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
      // Reset state
      setIsLoading(true);
      setError(null);
      setDebugInfo(null);
      
      // Set up request parameters
      const numStatements = 5; // Could be made configurable
      const authToken = authState.session?.$id;
      
      // Log request in development
      if (isDevelopment) {
        console.log('Generating quiz with text length:', text.length);
        setDebugInfo({
          timestamp: new Date().toISOString(),
          requestDetails: { 
            textLength: text.length,
            numStatements
          }
        });
      }
      
      // Make API request
      const responseData = await api.generateQuiz(text, numStatements, authToken);
      
      // Log response in development
      if (isDevelopment) {
        setDebugInfo(prev => ({
          ...prev || {},
          parsedResponse: responseData,
          responseTimestamp: new Date().toISOString()
        }));
      }
      
      // Extract questions array from response
      const questionsArray = extractQuestionsArray(responseData, isDevelopment);
      
      if (isDevelopment) {
        setDebugInfo(prev => ({
          ...prev || {},
          foundArrayType: questionsArray ? typeof questionsArray : 'null',
          foundArrayLength: questionsArray?.length ?? 0
        }));
      }
      
      if (!questionsArray) {
        throw new Error('Could not extract valid question data from response format');
      }
      
      // Process the questions data
      const processedData = processQuestionsData(questionsArray, isDevelopment);
      
      if (processedData.length === 0) {
        throw new Error('No valid questions found in the response data');
      }
      
      // Log processed data in development
      if (isDevelopment) {
        console.log('Final processed questions:', processedData);
        setDebugInfo(prev => ({
          ...prev || {},
          processedDataLength: processedData.length,
          finalProcessedData: processedData
        }));
      }
      
      // Update state with processed data
      setResponseData(processedData);
      setActiveSection('quiz');
      toast.success(`Generated ${processedData.length} questions successfully!`);
      
      // Smooth scroll to quiz section
      quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      
      // Save the quiz data to the database
      if (processedData.length > 0 && authState.session?.$id && authState.user) {
        try {
          setIsSaving(true);
          setSaveError(null);
          
          // Create a default title based on the first few words of the text
          const defaultTitle = text.trim().split(' ').slice(0, 5).join(' ') + '...';
          
          // Get user ID from the Appwrite user object
          const userId = (authState.user as Models.User<Models.Preferences>).$id;
          
          const quizData: SaveQuizRequest = {
            title: quizTitle || defaultTitle,
            text,
            questions: processedData,
            userId
          };
          
          const result = await api.saveQuiz(quizData, authState.session.$id);
          
          if (result.success) {
            toast.success('Quiz saved successfully!');
            // Refresh user stats after saving
            fetchUserStats();
          }
        } catch (error) {
          console.error('Error saving quiz:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          setSaveError(errorMessage);
          toast.error('Failed to save quiz: ' + errorMessage);
        } finally {
          setIsSaving(false);
        }
      }
    } catch (error) {
      console.error('Error processing text:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Log error in development
      if (isDevelopment) {
        setDebugInfo(prev => ({
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

  /**
   * Extracts questions from API response data in different formats
   */
  const extractQuestionsArray = (data: ApiResponseData, isDevelopment: boolean): unknown[] | null => {
    if (isArrayResponse(data)) {
      if (isDevelopment) console.log('Processing direct array response');
      return data;
    }
    
    if (isObjectResponse(data)) {
      // Standard format: { success: true, data: [...] }
      if (data.success === true && Array.isArray(data.data)) {
        if (isDevelopment) console.log('Processing standard success/data response');
        return data.data;
      }
      
      // Data array without success field
      if (Array.isArray(data.data)) {
        if (isDevelopment) console.log('Processing object with data array');
        return data.data;
      }
      
      // Check common keys that might contain the questions array
      const commonKeys = ['questions', 'results', 'items', 'quiz', 'statements'] as const;
      for (const key of commonKeys) {
        const possibleArray = data[key];
        if (Array.isArray(possibleArray) && possibleArray.length > 0) {
          if (isDevelopment) console.log(`Processing object with ${key} array`);
          return possibleArray;
        }
      }
    }
    
    return null;
  };

  /**
   * Processes questions data from various formats into a standardized QuizQuestion array
   */
  const processQuestionsData = (data: unknown[], isDevelopment: boolean): QuizQuestion[] => {
    // Safety checks
    if (!Array.isArray(data)) {
      console.error('processQuestionsData: Expected array input, received:', typeof data);
      return [];
    }
    
    if (data.length === 0) {
      console.log('processQuestionsData: Received empty data array');
      return [];
    }
    
    // Log first item in development to help with debugging
    if (isDevelopment) {
      console.log('Processing data array sample:', data[0]);
    }
    
    // Define key mapping for different field names
    const fieldMappings = {
      originalSentence: ['original_sentence', 'fullSentence', 'sentence', 'answer', 
                        'correctAnswer', 'correct_answer', 'right_answer', 'text'],
      partialSentence: ['partial_sentence', 'partialSentence', 'question', 'prompt', 
                       'stem', 'text'],
      falseSentences: ['false_sentences', 'falseSentences', 'falseStatements', 'options', 
                      'choices', 'incorrect_answers', 'wrongAnswers', 'distractors']
    };
    
    // Process each question item
    const processedQuestions = data
      .map((item, index) => {
        // Skip invalid items
        if (!item || typeof item !== 'object') {
          if (isDevelopment) console.log(`Item at index ${index} is invalid (null, undefined, or not an object)`);
          return null;
        }
        
        const itemObj = item as Record<string, unknown>;
        
        // Extract fields using property mappings
        const findValue = (keys: string[], isArray = false): string | string[] | undefined => {
          for (const key of keys) {
            const value = itemObj[key];
            if (isArray) {
              if (Array.isArray(value)) return value;
            } else {
              if (typeof value === 'string') return value;
            }
          }
          return isArray ? [] : undefined;
        };
        
        // Get values with appropriate fallbacks
        const originalSentence = findValue(fieldMappings.originalSentence) as string || '';
        let partialSentence = findValue(fieldMappings.partialSentence) as string || '';
        const falseSentences = findValue(fieldMappings.falseSentences, true) as string[] || [];
        
        // Generate partial sentence as fallback if missing
        if (!partialSentence && originalSentence) {
          partialSentence = originalSentence.substring(0, Math.floor(originalSentence.length / 2)) + '...';
          if (isDevelopment) console.log(`Generated fallback partial sentence for item ${index}`);
        }
        
        // Clean up text data
        const cleanText = (text: string): string => 
          text?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';
        
        const cleanOrigSentence = cleanText(originalSentence);
        const cleanPartialSentence = cleanText(partialSentence);
        
        // Clean and filter false sentences
        const cleanFalseSentences = falseSentences
          .filter(s => s !== null && s !== undefined && s !== cleanOrigSentence)
          .map(cleanText)
          .filter(Boolean);
        
        // Log processed item in development mode
        if (isDevelopment && (cleanOrigSentence || cleanPartialSentence)) {
          console.log(`Processed item ${index}:`, {
            original: cleanOrigSentence,
            partial: cleanPartialSentence,
            falseCount: cleanFalseSentences.length
          });
        }
        
        // Only return valid questions
        if (cleanOrigSentence && cleanPartialSentence) {
          return {
            original_sentence: cleanOrigSentence,
            partial_sentence: cleanPartialSentence,
            false_sentences: cleanFalseSentences
          };
        }
        
        if (isDevelopment) {
          console.warn(`Skipping item ${index} due to missing original or partial sentence`);
        }
        return null;
      })
      .filter((q): q is QuizQuestion => q !== null);
    
    console.log(`Successfully processed ${processedQuestions.length} valid questions from ${data.length} items`);
    return processedQuestions;
  };

  const handleQuizSubmit = async (answers: Record<number, string>) => {
    try {
      toast.loading('Submitting your answers...');
      
      // Check for valid session
      if (!authState.session?.$id) {
        toast.dismiss();
        toast.error('Your session has expired. Please log in again.');
        router.push('/login');
        return;
      }
      
      // Check for valid quiz data
      if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
        toast.dismiss();
        toast.error('Quiz data is invalid. Please try generating a new quiz.');
        return;
      }
      
      // Submit the quiz
      await api.submitQuiz(
        text,
        answers,
        responseData,
        authState.session?.$id
      );
      
      toast.dismiss();
      toast.success('Quiz submitted successfully!');
      
      // Reset UI state
      setActiveSection('input');
      setText('');
      setResponseData(null);
      setDebugInfo(null);
      
      // Update user stats
      fetchUserStats();
      
      // Smooth scroll back to input section
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.dismiss();
      console.error('Error submitting quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to submit quiz: ${errorMessage}`);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Option to resubmit could be added here if needed
  };

  const handleCreateNew = () => {
    setActiveSection('input');
    setText('');
    setResponseData(null);
    setError(null);
    setDebugInfo(null);
    
    // Smooth scroll to input section
    inputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // UI Components
  const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    color: 'blue' | 'indigo' | 'purple';
  }> = ({ icon, title, description, color }) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400'
      },
      indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-600 dark:text-indigo-400'
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400'
      }
    };
    
    return (
      <div className="relative">
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
          transition={{ duration: 0.2 }}
          className="p-6 md:p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
        >
          <div className={`h-14 w-14 md:h-16 md:w-16 rounded-full ${colorMap[color].bg} flex items-center justify-center mb-6 md:mb-8 shadow-md`}>
            {icon}
          </div>
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-5 text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>
    );
  };
  
  const DebugPanel: React.FC<{
    debugInfo: DebugInfo;
    onCopy: () => void;
    onHide: () => void;
  }> = ({ debugInfo, onCopy, onHide }) => (
    <Card className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 overflow-auto max-h-[500px]">
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Dev Debug Information</h3>
      <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      <div className="mt-4 flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCopy}
          className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
        >
          Copy Debug Info
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onHide}
          className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
        >
          Hide Debug Info
        </Button>
      </div>
    </Card>
  );
  
  const ErrorDisplay: React.FC<{
    error: string;
    onRetry: () => void;
  }> = ({ error, onRetry }) => (
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
              onClick={onRetry}
              variant="destructive"
              className="flex items-center px-6 py-3 h-auto transition-all duration-300 hover:scale-105"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Add a title input component for the quiz section
  const QuizTitleInput: React.FC = () => (
    <div className="mb-4">
      <input
        type="text"
        value={quizTitle}
        onChange={(e) => setQuizTitle(e.target.value)}
        placeholder="Enter a title for your quiz (optional)"
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16 relative">
        {/* Debug info display section - only visible in development */}
        {isDevelopment && debugInfo && (
          <DebugPanel 
            debugInfo={debugInfo}
            onCopy={() => navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))}
            onHide={() => setDebugInfo(null)}
          />
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
            {error && <ErrorDisplay error={error} onRetry={handleRetry} />}
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
                  
                  {/* Add quiz title input */}
                  <div className="px-6 md:px-8 pt-6">
                    <QuizTitleInput />
                    {isSaving && <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">Saving quiz...</p>}
                    {saveError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">Error saving: {saveError}</p>}
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
          
          <FeatureCard 
            icon={<Icons.Rocket className="h-7 w-7 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />}
            title="AI-Powered Quizzes"
            description="Our advanced AI technology generates relevant questions instantly from any text you provide."
            color="blue"
          />
          
          <FeatureCard
            icon={<Icons.Shield className="h-7 w-7 md:h-8 md:w-8 text-indigo-600 dark:text-indigo-400" />}
            title="Secure & Private"
            description="Your data is encrypted and protected. We prioritize your privacy and security."
            color="indigo"
          />
          
          <FeatureCard
            icon={<Icons.Settings className="h-7 w-7 md:h-8 md:w-8 text-purple-600 dark:text-purple-400" />}
            title="Track Progress"
            description="Monitor your learning progress and review your quiz history to improve over time. (Coming Soon!)"
            color="purple"
          />
        </motion.section>
      </main>
    </div>
  );
};

export default Home;