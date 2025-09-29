// frontend/src/pages/history.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useAuthContext } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import { useDebounce } from "@/hooks/useDebounce";
import QuizHistoryTable from "@/components/quiz/QuizHistoryTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { EnhancedHistory } from "@/components/aceternity";
import { QuizItem, quizService } from "@/lib/quizService";

export default function History() {
  const router = useRouter();
  const { authState } = useAuthContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [initialized, setInitialized] = useState(false);
  
  const pageSize = 20;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Function to fetch quizzes with pagination and search
  const fetchQuizzes = useCallback(async (page = 1, search = '') => {
    if (!authState.user) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Check if Appwrite config is valid
      if (!quizService.validateConfig()) {
        throw new Error("Missing Appwrite configuration. Please create a .env.local file with NEXT_PUBLIC_APPWRITE_DATABASE_ID and NEXT_PUBLIC_APPWRITE_COLLECTION_ID environment variables. See the setup guide for details.");
      }
      
      const offset = (page - 1) * pageSize;
      
      const fetchedQuizzes = await quizService.fetchUserQuizzes({
        userId: authState.user.$id,
        limit: pageSize,
        offset,
        searchTerm: search,
      });
      
      setQuizzes(fetchedQuizzes);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setError(`Failed to load your quiz history. ${quizService.getErrorMessage(error)}`);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [authState.user]);

  // Initial fetch and auth check
  useEffect(() => {
    if (!authState.isLoading) {
      if (!authState.user) {
        router.push("/login");
      } else if (!initialized) {
        fetchQuizzes();
      }
    }
  }, [authState, router, initialized, fetchQuizzes]);

  // Handle search term changes
  useEffect(() => {
    if (initialized) {
      fetchQuizzes(1, debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, initialized, fetchQuizzes]);

  // Handle quiz deletion
  const handleQuizDeleted = useCallback((id: string) => {
    setQuizzes(prev => prev.filter(quiz => quiz.$id !== id));
  }, []);

  // Refresh quiz list
  const refreshQuizzes = useCallback(() => {
    fetchQuizzes(currentPage, debouncedSearchTerm);
  }, [currentPage, debouncedSearchTerm, fetchQuizzes]);

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <LoadingSpinner size="md" message="Loading account information..." />
      </div>
    );
  }

  // Not authenticated
  if (!authState.user) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">Please log in to view your quiz history.</p>
            <Button className="mt-4" onClick={() => router.push('/login')}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto py-10">
        {/* Enhanced History Component */}
        {isLoading && !initialized ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner message="Loading your quiz history..." />
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto">
            <ErrorMessage 
              title="Error loading quiz history"
              message={error}
              description="This might be happening because of missing environment variables, database configuration issues, or missing fields in the Appwrite collection."
              actions={[
                {
                  label: "View Setup Guide",
                  onClick: () => window.open('/appwrite-setup.md', '_blank'),
                  variant: "default"
                },
                {
                  label: "Go to Setup Page",
                  onClick: () => router.push('/setup'),
                  variant: "outline"
                },
                {
                  label: "Debug Connection",
                  onClick: () => router.push('/debug'),
                  variant: "outline",
                  icon: <Icons.Bug className="h-4 w-4" />
                },
                {
                  label: "Try Again",
                  onClick: refreshQuizzes,
                  variant: "secondary",
                  icon: <Icons.RefreshCw className="h-4 w-4" />
                }
              ]}
            />
          </div>
        ) : (
          <EnhancedHistory
            quizzes={quizzes}
            onViewQuiz={(quiz) => router.push(`/quiz/${quiz.$id}`)}
            onDeleteQuiz={handleQuizDeleted}
            onRefresh={refreshQuizzes}
            enableAnimations={true}
          />
        )}
      </div>
    </div>
  );
}