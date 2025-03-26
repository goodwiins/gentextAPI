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

interface ApiResponse {
  questions: QuizQuestion[];
  message?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const Home: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [responseData, setResponseData] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'input' | 'quiz'>('input');
  const [userStats, setUserStats] = useState({ quizzes: 0, questions: 0 });
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

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to generate questions');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/v2/process_text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.$id}`
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || response.statusText || 'Failed to process text');
      }

      const data: ApiResponse = await response.json();
      setResponseData(data.questions);
      setActiveSection('quiz');
      toast.success('Questions generated successfully!');
      
      // Smooth scroll to quiz section
      quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error processing text:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      toast.error('Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10" />
      <main className="container mx-auto px-6 py-16 relative">
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