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

// Define types for debugging and API responses
interface DebugInfo {
  rawResponse?: string;
  parsedResponse?: unknown;
  timestamp?: string;
  responseStructure?: object;
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
const DEBUG_MODE = true; // Set to true to enable enhanced debugging

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
      const response = await fetch(`${API_BASE_URL}/api/v2/user/stats`, {
        headers: {
          'Authorization': `Bearer ${authState.session?.$id}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Define specialized parser for the exact response format
  const parseExactFormat = (rawData: any): QuizQuestion[] | null => {
    // Check if the response matches the exact format we're receiving
    if (
      rawData && 
      typeof rawData === 'object' &&
      rawData.success === true && 
      Array.isArray(rawData.data) &&
      rawData.data.length > 0 &&
      rawData.data[0].original_sentence &&
      rawData.data[0].partial_sentence &&
      Array.isArray(rawData.data[0].false_sentences)
    ) {
      console.log('Detected exact API response format, processing data directly');
      return rawData.data;
    }
    return null;
  };

  // Define even more direct parser for the specific format
  const parseDirectFormat = (responseText: string): QuizQuestion[] | null => {
    console.log('===== DIRECT PARSER START =====');
    console.log('Attempting direct string parsing');
    try {
      // Try to parse as JSON
      const data = JSON.parse(responseText);
      console.log('Direct parser - parsed JSON successfully', data);
      
      // Safety check the exact structure
      if (!data || typeof data !== 'object') {
        console.log('Direct parser - not an object');
        return null;
      }
      
      if (data.success !== true) {
        console.log('Direct parser - success not true, actual value:', data.success);
        return null;
      }
      
      if (!Array.isArray(data.data)) {
        console.log('Direct parser - data not an array, actual type:', typeof data.data);
        return null;
      }
      
      if (data.data.length === 0) {
        console.log('Direct parser - data array empty');
        return null;
      }

      console.log('Direct parser - first question in data:', data.data[0]);
      
      const isValidFormat = data.data.every((item: any) => {
        console.log('Validating item:', item);
        const result = item && 
          typeof item === 'object' &&
          typeof item.original_sentence === 'string' && 
          typeof item.partial_sentence === 'string' && 
          Array.isArray(item.false_sentences);
        
        if (!result) {
          console.log('Item validation failed:',
            'item exists:', !!item,
            'is object:', typeof item === 'object',
            'has original_sentence string:', item && typeof item.original_sentence === 'string',
            'has partial_sentence string:', item && typeof item.partial_sentence === 'string',
            'has false_sentences array:', item && Array.isArray(item.false_sentences)
          );
        }
        return result;
      });
      
      if (!isValidFormat) {
        console.log('Direct parser - some items have invalid format');
        return null;
      }
      
      // Structure is valid, return the data as QuizQuestion[]
      console.log('Direct parser - format valid, returning questions');
      console.log('===== DIRECT PARSER END =====');
      return data.data as QuizQuestion[];
    } catch (error) {
      console.error('Direct parser - failed to parse:', error);
      console.log('===== DIRECT PARSER ERROR =====');
      return null;
    }
  };

  // Add a super simple parser with minimal validation and clear error reporting
  const superSimpleParser = (responseText: string): QuizQuestion[] | null => {
    console.log('Running super simple parser');

    try {
      // Basic parsing
      const data = JSON.parse(responseText);
      
      // Check basic structure with detailed messages
      if (typeof data !== 'object') {
        console.error('Response is not an object:', typeof data);
        return null;
      }
      
      if (!('success' in data)) {
        console.error('Response missing success field');
        return null;
      }
      
      if (!('data' in data)) {
        console.error('Response missing data field');
        return null;
      }
      
      if (!Array.isArray(data.data)) {
        console.error('Data is not an array:', typeof data.data);
        return null;
      }
      
      // If the array is empty, just return empty result
      if (data.data.length === 0) {
        console.log('Data array is empty');
        return [];
      }
      
      // Transform to required format with very lenient checking
      const result = data.data.map((item: any) => {
        // Provide defaults for missing properties
        return {
          original_sentence: item.original_sentence || item.answer || 'Unknown answer',
          partial_sentence: item.partial_sentence || item.question || 'Unknown question',
          false_sentences: Array.isArray(item.false_sentences) ? item.false_sentences : []
        };
      });
      
      console.log('Super simple parser successful:', result);
      return result;
      
    } catch (error) {
      console.error('Super simple parser error:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to generate questions');
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
      
      // Log request details if in debug mode
      if (DEBUG_MODE) {
        console.log('API Request URL:', `${API_BASE_URL}/generate/qa`);
        console.log('API Request Body:', requestBody);
        console.log('API Request Headers:', {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.$id || 'no-token'}`
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/generate/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.$id}`
        },
        body: JSON.stringify(requestBody),
      });

      // Log response status and headers if in debug mode
      if (DEBUG_MODE) {
        console.log('API Response Status:', response.status);
        console.log('API Response Status Text:', response.statusText);
        console.log('API Response Headers:', Object.fromEntries([...response.headers.entries()]));
      }

      // Check for content type header to see what kind of response we got
      const contentType = response.headers.get('content-type') || '';
      console.log('Response Content-Type:', contentType);

      if (!response.ok) {
        // Handle error response
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.message || errorData.error || response.statusText || 'Failed to process text');
        } else {
          const errorText = await response.text();
          console.error('Server error text:', errorText);
          throw new Error(errorText || response.statusText || 'Failed to process text');
        }
      }

      // Get the raw response text first to inspect it
      const responseText = await response.text();
      console.log('Raw API Response Text:', responseText);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      // Try to log the request that was sent
      console.log('Request URL:', `${API_BASE_URL}/generate/qa`);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.session?.$id || 'no-token'}`
      });
      console.log('Request body:', JSON.stringify({ 
        text,
        num_statements: 5
      }));
      
      // Save raw response for debugging
      if (DEBUG_MODE) {
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
      
      // After getting the response text
      if (responseText.trim()) {
        // Try with super simple parser first
        const simpleResult = superSimpleParser(responseText);
        if (simpleResult && simpleResult.length > 0) {
          console.log('Successfully parsed with super simple parser!');
          setResponseData(simpleResult);
          setActiveSection('quiz');
          toast.success(`Generated ${simpleResult.length} questions successfully!`);
          
          // Smooth scroll to quiz section
          quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        
        // If simple parser failed, continue with other parsers
        console.log('Simple parser failed, trying other approaches...');
        
        // Pre-process response text to handle any special formatting issues
        const processedText = responseText.trim()
          // Remove any UTF-8 BOM characters
          .replace(/^\uFEFF/, '')
          // Ensure proper JSON format for unquoted keys
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          // Fix any trailing commas in arrays or objects
          .replace(/,\s*([\]}])/g, '$1');
        
        console.log('Processed response text:', processedText);
        
        // Try the direct parser first on the raw text and processed text
        let directQuestions = parseDirectFormat(responseText);
        if (!directQuestions || directQuestions.length === 0) {
          console.log('Trying with processed text');
          directQuestions = parseDirectFormat(processedText);
        }
        
        if (directQuestions && directQuestions.length > 0) {
          console.log('Successfully processed using direct parser:', directQuestions);
          setResponseData(directQuestions);
          setActiveSection('quiz');
          toast.success(`Generated ${directQuestions.length} questions successfully!`);
          
          // Smooth scroll to quiz section
          quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      
      // Try parsing as a Claude response first
      const claudeQuestions = parseClaudeResponse(responseText);
      if (claudeQuestions.length > 0) {
        console.log('Successfully parsed response as Claude format:', claudeQuestions);
        setResponseData(claudeQuestions);
        setActiveSection('quiz');
        toast.success(`Generated ${claudeQuestions.length} questions successfully!`);
        
        // Smooth scroll to quiz section
        quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      
      // Continue with regular JSON parsing if direct parser fails
      let rawData: ApiResponseData;
      try {
        rawData = JSON.parse(responseText);
        console.log('Parsed API Response:', rawData);
        
        // Try the exact format parser first
        const exactFormatQuestions = parseExactFormat(rawData);
        if (exactFormatQuestions && exactFormatQuestions.length > 0) {
          console.log('Successfully processed using exact format parser:', exactFormatQuestions);
          setResponseData(exactFormatQuestions);
          setActiveSection('quiz');
          toast.success(`Generated ${exactFormatQuestions.length} questions successfully!`);
          
          // Smooth scroll to quiz section
          quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        
        // Update debug info with parsed data
        if (DEBUG_MODE) {
          setDebugInfo((prev: DebugInfo | null) => ({
            ...prev || {},
            parsedResponse: rawData
          }));
        }
      } catch (err) {
        const parseError = err as Error;
        console.error('Failed to parse API response as JSON:', parseError);
        console.log('Response was:', responseText);
        
        // Update debug info with parse error
        if (DEBUG_MODE) {
          setDebugInfo((prev: DebugInfo | null) => ({
            ...prev || {},
            parseError: parseError.message,
            parseErrorStack: parseError.stack
          }));
        }
        
        throw new Error('Invalid JSON response from server');
      }
      
      // Check if the raw response is null or undefined
      if (!rawData) {
        console.error('API returned null or undefined response');
        throw new Error('API returned empty response');
      }
      
      let processedData: QuizQuestion[] = [];
      let processingApproach = 'none';
      
      // Try multiple approaches to extract valid data from potentially different response formats
      if (rawData && typeof rawData === 'object') {
        // Log the structure of the response to help with debugging
        const responseStructure = {
          hasSuccessField: isResponseObject(rawData) && 'success' in rawData,
          successValue: isResponseObject(rawData) && rawData.success,
          hasDataField: isResponseObject(rawData) && 'data' in rawData,
          dataType: isResponseObject(rawData) && rawData.data ? typeof rawData.data : 'undefined/null',
          isDataArray: isResponseObject(rawData) && rawData.data ? Array.isArray(rawData.data) : false,
          dataLength: isResponseObject(rawData) && rawData.data && Array.isArray(rawData.data) ? rawData.data.length : 0,
          responseKeys: isResponseObject(rawData) ? Object.keys(rawData) : []
        };
        
        console.log('Response structure:', responseStructure);
        
        // Update debug info with response structure
        if (DEBUG_MODE) {
          setDebugInfo((prev: DebugInfo | null) => ({
            ...prev || {},
            responseStructure
          }));
        }
        
        // Approach 1: Standard format with success and data array
        if (isResponseObject(rawData) && rawData.success === true && Array.isArray(rawData.data)) {
          console.log('Processing using Approach 1 (standard format)');
          processedData = processQuestionsData(rawData.data);
          processingApproach = 'approach1';
        } 
        // Approach 2: Direct array response
        else if (isResponseArray(rawData)) {
          console.log('Processing using Approach 2 (direct array)');
          processedData = processQuestionsData(rawData);
          processingApproach = 'approach2';
        }
        // Approach 3: Nested data structure
        else if (isResponseObject(rawData) && rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)) {
          console.log('Processing using Approach 3 (nested object)');
          const potentialArrays = Object.values(rawData.data).filter(val => Array.isArray(val));
          if (potentialArrays.length > 0) {
            processedData = processQuestionsData(potentialArrays[0] as any[]);
            processingApproach = 'approach3';
          }
        }
        // Approach 4: Special case - handle null success with data
        else if (isResponseObject(rawData) && rawData.data && Array.isArray(rawData.data)) {
          console.log('Processing using Approach 4 (data array without success)');
          processedData = processQuestionsData(rawData.data);
          processingApproach = 'approach4';
        }
        // Approach 5: Try to find any array in the response
        else {
          console.log('Processing using Approach 5 (searching for arrays)');
          if (isResponseObject(rawData)) {
            for (const key in rawData) {
              const value = rawData[key];
              if (Array.isArray(value) && value.length > 0) {
                console.log(`Found array in field: ${key}`);
                processedData = processQuestionsData(value);
                if (processedData.length > 0) {
                  processingApproach = `approach5_${key}`;
                  break;
                }
              }
            }
          }
        }
        
        // Approach 6: Try to handle common API response formats with different naming conventions
        if (processedData.length === 0) {
          console.log('Processing using Approach 6 (alternative field names)');
          
          // Check for 'questions', 'results', 'items' or other common field names
          const commonFieldNames = ['questions', 'results', 'items', 'quiz', 'statements'];
          if (isResponseObject(rawData)) {
            for (const fieldName of commonFieldNames) {
              const value = rawData[fieldName];
              if (value && Array.isArray(value)) {
                console.log(`Found array in field: ${fieldName}`);
                processedData = processQuestionsData(value);
                if (processedData.length > 0) {
                  processingApproach = `approach6_${fieldName}`;
                  break;
                }
              }
            }
          }
        }
        
        // Approach 7: Try to adapt if the structure is completely different but has the necessary data
        if (processedData.length === 0) {
          console.log('Processing using Approach 7 (adapting to different structure)');
          try {
            // Create questions from any structure with identifiable correct answers and questions
            const adaptedData = adaptApiResponse(rawData);
            if (adaptedData.length > 0) {
              processedData = adaptedData;
              processingApproach = 'approach7';
            }
          } catch (adaptError) {
            console.error('Error adapting response:', adaptError);
            
            // Update debug info with adaptation error
            if (DEBUG_MODE) {
              setDebugInfo((prev: DebugInfo | null) => ({
                ...prev || {},
                adaptError: (adaptError as Error).message,
                adaptErrorStack: (adaptError as Error).stack
              }));
            }
          }
        }
      }
      
      // If we still have no valid data and the response is a string, try to parse it
      if (processedData.length === 0 && typeof rawData === 'string') {
        try {
          console.log('Attempting to parse string response');
          const parsedData = JSON.parse(rawData);
          if (parsedData && typeof parsedData === 'object') {
            if (Array.isArray(parsedData)) {
              processedData = processQuestionsData(parsedData);
              processingApproach = 'string_array';
            } else if (parsedData.data && Array.isArray(parsedData.data)) {
              processedData = processQuestionsData(parsedData.data);
              processingApproach = 'string_data_array';
            }
          }
        } catch (parseError) {
          console.error('Failed to parse string response:', parseError);
          
          // Update debug info with string parse error
          if (DEBUG_MODE) {
            setDebugInfo((prev: DebugInfo | null) => ({
              ...prev || {},
              stringParseError: (parseError as Error).message,
              stringParseErrorStack: (parseError as Error).stack
            }));
          }
        }
      }
      
      // Update debug info with processing results
      if (DEBUG_MODE) {
        setDebugInfo((prev: DebugInfo | null) => ({
          ...prev || {},
          processingApproach,
          processedDataLength: processedData.length,
          processedDataSample: processedData.length > 0 ? processedData[0] : null
        }));
      }
      
      // Last resort: try to extract anything useful from the response
      if (processedData.length === 0) {
        console.log('Attempting last resort extraction from any text in the response');
        const lastResortData = extractQuestionsFromUnstructuredData(rawData);
        if (lastResortData.length > 0) {
          processedData = lastResortData;
          processingApproach = 'last_resort';
          
          // Update debug info with last resort data
          if (DEBUG_MODE) {
            setDebugInfo((prev: DebugInfo | null) => ({
              ...prev || {},
              lastResortExtraction: true,
              lastResortDataLength: lastResortData.length
            }));
          }
        }
      }
      
      // If we still have no valid data, throw an error
      if (processedData.length === 0) {
        console.error('Could not extract valid question data from response.', rawData);
        
        // Create a more detailed error for debugging
        const detailedError = `Invalid response format from server. Response type: ${typeof rawData}, Keys: ${
          typeof rawData === 'object' && rawData !== null ? Object.keys(rawData).join(', ') : 'N/A'
        }`;
        
        throw new Error(detailedError);
      }
      
      console.log('Processed Questions:', processedData);
      console.log('Total questions extracted:', processedData.length);
      console.log('Processing approach used:', processingApproach);
      
      // Final update to debug info
      if (DEBUG_MODE) {
        setDebugInfo((prev: DebugInfo | null) => ({
          ...prev || {},
          finalProcessedData: processedData,
          finalProcessingApproach: processingApproach
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
      
      // Update debug info with error
      if (DEBUG_MODE) {
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
  const processQuestionsData = (data: any[]): QuizQuestion[] => {
    try {
      console.log('Processing data array with length:', data.length);
      
      // Safety check
      if (!Array.isArray(data)) {
        console.error('processQuestionsData received non-array input:', data);
        return [];
      }
      
      if (data.length === 0) {
        console.log('Received empty data array');
        return [];
      }
      
      // Log the first item to help debugging
      console.log('First item in data array:', data[0]);
      
      const processedQuestions = data.map((item, index) => {
        // Skip null or undefined items
        if (!item) {
          console.log(`Item at index ${index} is null or undefined`);
          return null;
        }
        
        // Try to extract fields with various possible names
        let originalSentence = '';
        let partialSentence = '';
        let falseSentences: string[] = [];
        
        // For debugging: log all keys in this item
        console.log(`Item ${index} keys:`, Object.keys(item));
        
        // Extract original sentence
        if (typeof item.original_sentence === 'string') {
          originalSentence = item.original_sentence;
        } else if (typeof item.fullSentence === 'string') {
          originalSentence = item.fullSentence;
        } else if (typeof item.sentence === 'string') {
          originalSentence = item.sentence;
        } else if (typeof item.text === 'string') {
          originalSentence = item.text;
        } else if (typeof item.answer === 'string') {
          originalSentence = item.answer;
        } else if (typeof item.correctAnswer === 'string') {
          originalSentence = item.correctAnswer;
        }
        
        // Extract partial sentence / question
        if (typeof item.partial_sentence === 'string') {
          partialSentence = item.partial_sentence;
        } else if (typeof item.partialSentence === 'string') {
          partialSentence = item.partialSentence;
        } else if (typeof item.question === 'string') {
          partialSentence = item.question;
        } else if (typeof item.prompt === 'string') {
          partialSentence = item.prompt;
        }
        
        // If still no partial sentence, use first half of original
        if (!partialSentence && originalSentence) {
          partialSentence = originalSentence.substring(0, originalSentence.length / 2);
        }
        
        // Extract false sentences / options
        if (Array.isArray(item.false_sentences)) {
          falseSentences = item.false_sentences;
        } else if (Array.isArray(item.falseSentences)) {
          falseSentences = item.falseSentences;
        } else if (Array.isArray(item.falseStatements)) {
          falseSentences = item.falseStatements;
        } else if (Array.isArray(item.options)) {
          // Filter out the correct answer if it's in the options
          falseSentences = item.options.filter((opt: string) => opt !== originalSentence);
        } else if (Array.isArray(item.choices)) {
          // Filter out the correct answer if it's in the choices
          falseSentences = item.choices.filter((opt: string) => opt !== originalSentence);
        }
        
        // Clean up the data
        const cleanOrigSentence = originalSentence?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';
        const cleanPartialSentence = partialSentence?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() || '';
        const cleanFalseSentences = falseSentences
          .filter(s => s !== null && s !== undefined)
          .map(s => s?.toString().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
          .filter(s => s.length > 0); // Remove empty strings
        
        // For debugging
        console.log(`Processed item ${index}:`, {
          original: cleanOrigSentence,
          partial: cleanPartialSentence,
          falseCount: cleanFalseSentences.length
        });
        
        // Only return valid questions
        if (cleanOrigSentence && cleanPartialSentence) {
          return {
            original_sentence: cleanOrigSentence,
            partial_sentence: cleanPartialSentence,
            false_sentences: cleanFalseSentences
          };
        }
        
        return null;
      }).filter(q => q !== null) as QuizQuestion[]; // Filter out null results
      
      console.log(`Successfully processed ${processedQuestions.length} out of ${data.length} items`);
      return processedQuestions;
    } catch (error) {
      console.error('Error processing question data:', error);
      return [];
    }
  };

  // New helper function to adapt various API response formats
  const adaptApiResponse = (data: any): QuizQuestion[] => {
    console.log('Attempting to adapt API response format:', data);
    
    // Handle cases where the data might be structured differently
    const adaptedQuestions: QuizQuestion[] = [];
    
    // Case 1: Structure might have questions and answers in separate arrays or objects
    if (data.questions && data.answers && Array.isArray(data.questions)) {
      console.log('Found questions and answers in separate arrays');
      data.questions.forEach((question: any, index: number) => {
        const questionText = typeof question === 'string' ? question : question.text || question.question;
        const correctAnswer = data.answers[index] && (
          data.answers[index].correct || 
          data.answers[index].correctAnswer || 
          data.answers[index].answer
        );
        const options = data.answers[index] && (
          data.answers[index].options || 
          data.answers[index].choices || 
          data.answers[index].distractors || 
          []
        );
        
        if (questionText && correctAnswer) {
          adaptedQuestions.push({
            original_sentence: correctAnswer,
            partial_sentence: questionText,
            false_sentences: Array.isArray(options) ? options.filter((o: string) => o !== correctAnswer) : []
          });
        }
      });
    }
    
    // Case 2: Format might be like [{ question, correct_answer, incorrect_answers }]
    if (adaptedQuestions.length === 0 && Array.isArray(data)) {
      console.log('Trying to adapt array of question objects');
      data.forEach((item: any) => {
        // Check for various field naming patterns
        const questionText = item.question || item.prompt || item.stem || item.text;
        const correctAnswer = item.correct_answer || item.correctAnswer || item.answer || item.right_answer;
        const incorrectAnswers = item.incorrect_answers || item.wrongAnswers || item.distractors || item.false_sentences || [];
        
        if (questionText && correctAnswer) {
          adaptedQuestions.push({
            original_sentence: correctAnswer,
            partial_sentence: questionText,
            false_sentences: Array.isArray(incorrectAnswers) ? incorrectAnswers : []
          });
        }
      });
    }
    
    // Case 3: Direct response from API with different field names
    if (adaptedQuestions.length === 0 && !Array.isArray(data)) {
      console.log('Trying to adapt from custom API response structure');
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          // Try to identify question-answer pairs
          const item = data[key];
          const questionText = item.question || item.prompt || item.text;
          const correctAnswer = item.answer || item.correct || item.correctAnswer;
          const options = item.options || item.choices || item.distractors || [];
          
          if (questionText && correctAnswer) {
            adaptedQuestions.push({
              original_sentence: correctAnswer,
              partial_sentence: questionText,
              false_sentences: Array.isArray(options) ? options.filter(o => o !== correctAnswer) : []
            });
          }
        }
      });
    }
    
    console.log(`Adapted ${adaptedQuestions.length} questions from custom format`);
    return adaptedQuestions;
  };

  // Add specialized parser for Claude responses
  const parseClaudeResponse = (data: any): QuizQuestion[] => {
    console.log("Trying to parse Claude-specific response format");
    
    // If we have a string response, try to extract JSON from it
    if (typeof data === 'string') {
      try {
        // Claude sometimes returns response wrapped in ```json ... ``` or just directly
        const jsonMatch = data.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, data];
        data = JSON.parse(jsonMatch[1].trim());
        console.log("Extracted JSON from string response:", data);
      } catch (err) {
        console.log("Failed to extract JSON from string response");
        return [];
      }
    }
    
    // Case 1: Array of question objects directly
    if (Array.isArray(data)) {
      console.log("Detected array of questions");
      return data.map(item => {
        const question = item.question || item.prompt || item.partial_sentence || '';
        const answer = item.answer || item.correct_answer || item.original_sentence || '';
        const options = item.options || item.incorrect_answers || item.false_sentences || [];
        
        return {
          original_sentence: answer,
          partial_sentence: question,
          false_sentences: Array.isArray(options) ? options : []
        };
      }).filter(q => q.original_sentence && q.partial_sentence);
    }
    
    // Case 2: Claude format with questions in specific fields
    if (isResponseObject(data)) {
      console.log("Trying to find question fields in object response");
      
      // Look for common field names that might contain questions array
      const commonContainerFields = ['questions', 'data', 'results', 'items', 'content'];
      for (const field of commonContainerFields) {
        if (data[field] && Array.isArray(data[field])) {
          console.log(`Found questions array in field: ${field}`);
          return parseClaudeResponse(data[field]); // Recursively process the array
        }
      }
      
      // Case 3: Questions might be enumerated as fields (question1, question2)
      const questionEntries = Object.entries(data).filter(([key]) => 
        key.match(/^(question|q)\d+$/i) || key.match(/^(item|result)\d+$/i)
      );
      
      if (questionEntries.length > 0) {
        console.log("Found enumerated questions as fields");
        return questionEntries.map(([_, value]) => {
          if (typeof value === 'string') {
            // Simple string value format
            return {
              original_sentence: value,
              partial_sentence: value.split(' ').slice(0, 5).join(' ') + '...',
              false_sentences: []
            };
          } else if (typeof value === 'object' && value !== null) {
            // Object with question details
            const question = value.question || value.prompt || value.partial_sentence || '';
            const answer = value.answer || value.correct_answer || value.original_sentence || '';
            const options = value.options || value.incorrect_answers || value.false_sentences || [];
            
            return {
              original_sentence: answer,
              partial_sentence: question,
              false_sentences: Array.isArray(options) ? options : []
            };
          }
          return null;
        }).filter(Boolean) as QuizQuestion[];
      }
    }
    
    return [];
  };

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
          questions: responseData
        }),
      });

      if (!response.ok) {
        toast.dismiss();
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      toast.dismiss();
      toast.success('Quiz submitted successfully!');
      
      // Show option to create a new quiz
      setActiveSection('input');
      setText('');
      
      // Update user stats
      fetchUserStats();
      
      // Smooth scroll back to input section
      inputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.dismiss();
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const handleRetry = () => {
    setError(null);
  };

  const handleCreateNew = () => {
    setActiveSection('input');
    setText('');
    setResponseData(null);
    
    // Smooth scroll to input section
    inputSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Test function to directly test the API response format
  const testApiResponse = () => {
    // Sample response format based on the actual API response
    const testResponse = {
      "success": true,
      "data": [
        {
            "original_sentence": "Lamont Johnson",
            "partial_sentence": "Who directed the film 'My Sweet Charlie'?",
            "false_sentences": [
                "Richard Levinson",
                "David Westheimer"
            ]
        },
        {
            "original_sentence": "January 20, 1970",
            "partial_sentence": "When was 'My Sweet Charlie' first broadcast?",
            "false_sentences": [
                "December 15, 1970",
                "March 8, 1970"
            ]
        },
        {
            "original_sentence": "David Westheimer",
            "partial_sentence": "Who wrote the novel that 'My Sweet Charlie' was based on?",
            "false_sentences": [
                "William Link",
                "Lamont Johnson"
            ]
        },
        {
            "original_sentence": "Port Bolivar, Texas",
            "partial_sentence": "Where was 'My Sweet Charlie' filmed?",
            "false_sentences": [
                "Port Arthur, Texas",
                "Galveston, Texas"
            ]
        },
        {
            "original_sentence": "Universal Television",
            "partial_sentence": "Which company produced 'My Sweet Charlie'?",
            "false_sentences": [
                "NBC Productions",
                "Paramount Television"
            ]
        }
      ],
      "generator_used": "claude",
      "generation_time": 5.985682725906372
    };

    try {
      console.log('Testing with actual API response format:', testResponse);
      
      // Process the test response
      let processedData: QuizQuestion[] = [];
      
      if (testResponse && typeof testResponse === 'object') {
        if (testResponse.success === true && Array.isArray(testResponse.data)) {
          processedData = processQuestionsData(testResponse.data);
        } else if (Array.isArray(testResponse)) {
          processedData = processQuestionsData(testResponse);
        }
      }
      
      if (processedData.length === 0) {
        console.error('Could not extract valid question data from test response:', testResponse);
        toast.error('Test failed: Could not process test data');
        return;
      }
      
      console.log('Processed test questions:', processedData);
      setResponseData(processedData);
      setActiveSection('quiz');
      toast.success(`Test loaded with ${processedData.length} questions successfully!`);
      
      // Smooth scroll to quiz section
      quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error processing test response:', error);
      toast.error('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Function to test API connectivity
  const testApiConnectivity = async () => {
    try {
      toast.loading('Testing API connection...');
      
      // Test the health endpoint first
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      console.log('Health API Response Status:', healthResponse.status);
      const healthData = await healthResponse.json();
      console.log('Health API Response:', healthData);
      
      toast.dismiss();
      
      if (healthResponse.ok) {
        toast.success(`API connection successful: ${healthData.status}`);
      } else {
        toast.error(`API connection failed: ${healthResponse.statusText}`);
      }
    } catch (error) {
      toast.dismiss();
      console.error('API connectivity test failed:', error);
      toast.error(`API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // New function to try to extract questions from unstructured data
  const extractQuestionsFromUnstructuredData = (data: any): QuizQuestion[] => {
    console.log('Attempting to extract questions from unstructured data');
    const extractedQuestions: QuizQuestion[] = [];
    
    // Convert to string if not already
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Look for patterns that might indicate questions and answers
    try {
      // Try to find question-answer pairs using regex
      const qaPairs = dataString.match(/["']?(?:question|prompt|text)["']?\s*[:=]\s*["']([^"']+)["'].*?["']?(?:answer|correct|original)["']?\s*[:=]\s*["']([^"']+)["']/gi);
      
      if (qaPairs && qaPairs.length > 0) {
        console.log('Found potential question-answer pairs:', qaPairs.length);
        
        qaPairs.forEach((pair, index) => {
          // Extract question and answer
          const questionMatch = pair.match(/["']?(?:question|prompt|text)["']?\s*[:=]\s*["']([^"']+)["']/i);
          const answerMatch = pair.match(/["']?(?:answer|correct|original)["']?\s*[:=]\s*["']([^"']+)["']/i);
          
          if (questionMatch && questionMatch[1] && answerMatch && answerMatch[1]) {
            extractedQuestions.push({
              original_sentence: answerMatch[1],
              partial_sentence: questionMatch[1],
              false_sentences: [`Option ${index + 1}`, `Option ${index + 2}`] // Generate some dummy options
            });
          }
        });
      }
    } catch (e) {
      console.error('Error extracting from unstructured data:', e);
    }
    
    console.log(`Extracted ${extractedQuestions.length} questions from unstructured data`);
    return extractedQuestions;
  };

  // Function to test with the hardcoded API response
  const testWithMockEndpoint = async () => {
    try {
      toast.loading('Testing with mock endpoint...');
      
      // Call the test endpoint that returns the hardcoded response
      const response = await fetch(`${API_BASE_URL}/test/qa`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.$id}`
        },
      });

      console.log('Test endpoint response status:', response.status);
      
      if (!response.ok) {
        toast.dismiss();
        throw new Error(`Test endpoint failed with status: ${response.status}`);
      }

      // Get the raw response text
      const responseText = await response.text();
      console.log('Test endpoint raw response:', responseText);
      
      // Try to parse the response
      try {
        const data = JSON.parse(responseText);
        console.log('Test endpoint parsed data:', data);
        
        if (data && data.success === true && Array.isArray(data.data) && data.data.length > 0) {
          // Use our direct parser
          const directQuestions = parseDirectFormat(responseText);
          if (directQuestions && directQuestions.length > 0) {
            toast.dismiss();
            console.log('Successfully parsed test response:', directQuestions);
            setResponseData(directQuestions);
            setActiveSection('quiz');
            toast.success(`Generated ${directQuestions.length} test questions`);
            return;
          } else {
            console.error('Direct format parser failed on test data');
          }
        } else {
          console.error('Test response does not have expected format');
        }
      } catch (parseError) {
        console.error('Failed to parse test response as JSON:', parseError);
      }
      
      toast.dismiss();
      toast.error('Test failed - see console for details');
    } catch (error) {
      toast.dismiss();
      console.error('Test endpoint error:', error);
      toast.error('Test endpoint failed');
    }
  };

  // Function to directly test with minimalist code
  const testWithMinimalistFetch = async () => {
    try {
      toast.loading('Testing with minimalist fetch...');
      
      // The simplest fetch possible
      const response = await fetch(`${API_BASE_URL}/test/qa`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      console.log('Simple test response status:', response.status);
      
      // Get the raw text
      const rawText = await response.text();
      console.log('Raw response text:', rawText);
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(rawText);
        console.log('Parsed response:', data);
        
        // If data has the right structure, use it directly
        if (data && data.success === true && Array.isArray(data.data)) {
          toast.dismiss();
          toast.success(`Got ${data.data.length} questions directly!`);
          
          // Set the data without any additional processing
          setResponseData(data.data);
          setActiveSection('quiz');
          return;
        }
      } catch (err) {
        console.error('JSON parse error:', err);
      }
      
      toast.dismiss();
      toast.error('Direct test failed - check console');
    } catch (error) {
      toast.dismiss();
      console.error('Minimalist test error:', error);
      toast.error('Minimalist test failed');
    }
  };

  // Function to test the simple-qa endpoint
  const testSimpleEndpoint = async () => {
    try {
      toast.loading('Testing simple endpoint...');
      
      // Simple GET request
      const response = await fetch(`${API_BASE_URL}/generate/simple-qa`, {
        method: 'GET'
      });

      console.log('Simple endpoint status:', response.status);
      
      if (!response.ok) {
        toast.dismiss();
        toast.error(`Simple endpoint failed: ${response.status}`);
        return;
      }
      
      // Get response as text for debugging
      const text = await response.text();
      console.log('Simple endpoint response text:', text);
      
      try {
        // Parse the response
        const data = JSON.parse(text);
        console.log('Simple endpoint parsed data:', data);
        
        if (data && data.success === true && Array.isArray(data.data) && data.data.length > 0) {
          setResponseData(data.data);
          setActiveSection('quiz');
          toast.dismiss();
          toast.success(`Loaded ${data.data.length} questions from simple endpoint`);
          
          // Scroll to quiz section
          quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      } catch (err) {
        console.error('Error parsing simple endpoint response:', err);
      }
      
      toast.dismiss();
      toast.error('Simple endpoint test failed');
    } catch (error) {
      toast.dismiss();
      console.error('Simple endpoint error:', error);
      toast.error('Simple endpoint test failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      <main className="container mx-auto px-6 py-16 relative">
        {/* Debug info display section */}
        {DEBUG_MODE && debugInfo && (
          <Card className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 overflow-auto max-h-[500px]">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Debug Information</h3>
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
        
        {/* Debug section - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p>API Base URL: {API_BASE_URL}</p>
              <p>Response Data: {responseData ? `${responseData.length} questions loaded` : 'No data'}</p>
              <p>Error: {error || 'None'}</p>
              <p>Active Section: {activeSection}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testApiResponse}
                className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
              >
                Test API Response
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testApiConnectivity}
                className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
              >
                Test API Connection
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testWithMockEndpoint}
                className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
              >
                Test Mock Endpoint
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testWithMinimalistFetch}
                className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
              >
                Test Minimalist Fetch
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testSimpleEndpoint}
                className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
              >
                Test Simple Endpoint
              </Button>
            </div>
          </Card>
        )}
        
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-24 text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
          <div className="relative py-16">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Icons.Rocket className="h-14 w-14 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                genText AI
              </h1>
            </div>
            
            <p className="mt-8 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-300">
              Generate interactive quizzes instantly from any text to boost your learning.
            </p>
            
            <div className="mt-10 flex flex-wrap justify-center gap-6">
              {authState.user && (
                <div className="flex gap-6">
                  <Badge variant="outline" className="px-6 py-3 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <Icons.PlusCircle className="h-4 w-4 mr-3 text-blue-500" />
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{userStats.quizzes}</span> Quizzes
                  </Badge>
                  <Badge variant="outline" className="px-6 py-3 text-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <Icons.Moon className="h-4 w-4 mr-3 text-indigo-500" />
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
          className={`transition-all duration-300 relative mb-32 ${activeSection === 'quiz' && responseData ? 'opacity-80 hover:opacity-100 filter hover:blur-none blur-[1px]' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
          <div className="relative p-6">
            <div className="mb-10 flex flex-col space-y-6">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white flex items-center justify-center mr-6 shadow-md">
                  <Icons.PlusCircle className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Enter your text</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                    Paste any text content below to generate quiz questions
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-8 justify-center">
                <Badge className="px-5 py-2.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  <Icons.Rocket className="h-4 w-4 mr-2.5" />
                  Educational content
                </Badge>
                <Badge className="px-5 py-2.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Icons.AlertCircle className="h-4 w-4 mr-2.5" />
                  Maximum 18,000 characters
                </Badge>
                <Badge className="px-5 py-2.5 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                  <Icons.Shield className="h-4 w-4 mr-2.5" />
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
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
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
                className="my-24 flex flex-col items-center justify-center relative"
              >
                <LoadingSpinner message="Processing your text..." />
                <p className="mt-10 text-gray-500 dark:text-gray-400 text-sm max-w-lg text-center">
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
                className="my-16 p-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-sm relative max-w-3xl mx-auto"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icons.AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Error</h3>
                    <p className="mt-4 text-red-700 dark:text-red-300">{error}</p>
                    <div className="mt-8">
                      <Button
                        onClick={handleRetry}
                        variant="destructive"
                        className="flex items-center px-7 py-3.5 h-auto"
                      >
                        <Icons.Moon className="h-4 w-4 mr-3" />
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
              className={`mt-10 transition-all duration-300 relative mb-32 ${activeSection === 'input' ? 'opacity-80 hover:opacity-100 filter hover:blur-none blur-[1px]' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
              <div className="relative p-6">
                <div className="mb-12 flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-600 text-white flex items-center justify-center mr-6 shadow-md">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Take your quiz</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
                  <div className="p-10 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <Icons.AlertCircle className="h-7 w-7 mr-5" />
                      Your Quiz ({responseData.length} questions)
                    </h2>
                    <Button
                      onClick={handleCreateNew}
                      variant="secondary"
                      className="flex items-center px-7 py-3 h-auto"
                    >
                      <Icons.PlusCircle className="h-4 w-4 mr-3" />
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
          className="mt-32 grid gap-12 md:grid-cols-3 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-3xl blur-3xl" />
          
          <div className="relative">
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
              className="p-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
            >
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-8 shadow-sm">
                <Icons.Rocket className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold mb-5 text-gray-900 dark:text-white">AI-Powered Quizzes</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Our advanced AI technology generates relevant questions instantly from any text you provide.
              </p>
            </motion.div>
          </div>
          
          <div className="relative">
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
              className="p-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
            >
              <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-8 shadow-sm">
                <Icons.Shield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-semibold mb-5 text-gray-900 dark:text-white">Secure & Private</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Your data is encrypted and protected with industry-standard security measures.
              </p>
            </motion.div>
          </div>
          
          <div className="relative">
            <motion.div 
              whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              transition={{ duration: 0.2 }}
              className="p-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200 h-full"
            >
              <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-8 shadow-sm">
                <Icons.Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold mb-5 text-gray-900 dark:text-white">Track Progress</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Monitor your learning progress and review your quiz history to improve over time.
              </p>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Home;