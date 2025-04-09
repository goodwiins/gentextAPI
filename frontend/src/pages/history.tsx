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
        throw new Error("Missing Appwrite configuration. Please check your environment variables.");
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
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quiz History</h1>
        <Button
          onClick={() => router.push('/')}
          className="hidden md:flex"
        >
          <Icons.PlusCircle className="mr-2 h-4 w-4" />
          Create New Quiz
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Saved Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && !initialized ? (
            <LoadingSpinner message="Loading your quiz history..." />
          ) : error ? (
            <ErrorMessage 
              title="Error loading quiz history"
              message={error}
              description="This might be happening because of a database configuration issue or missing fields in the Appwrite collection."
              actions={[
                {
                  label: "Go to Setup Page",
                  onClick: () => router.push('/setup'),
                  variant: "default"
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
          ) : quizzes.length === 0 ? (
            <div className="py-8 space-y-4 text-center">
              <Icons.FileQuestion className="h-16 w-16 mx-auto text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">You haven't created any quizzes yet.</p>
              <Button onClick={() => router.push('/')}>
                Create Your First Quiz
              </Button>
            </div>
          ) : (
            <QuizHistoryTable 
              quizzes={quizzes}
              onDeleteSuccess={handleQuizDeleted}
              onRefresh={refreshQuizzes}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}