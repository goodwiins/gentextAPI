// frontend/src/pages/index.tsx
import React from 'react';
import { useRouter } from "next/router";
import { HomepageLayout } from "@/components/home/HomepageLayout";
import { useAuthContext } from "@/context/auth-context";
import type { AuthUser, ConversionAction } from '@/specs/001-homepage-saas/contracts/frontend-components';

interface UserStats {
  quizzes: number;
  questions: number;
}

const Home: React.FC = () => {
  const [userStats, setUserStats] = React.useState<UserStats>({ quizzes: 0, questions: 0 });
  const router = useRouter();
  const { authState } = useAuthContext();

  // Memoize the fetchUserStats function
  const fetchUserStats = React.useCallback(async () => {
    try {
      if (!authState.session?.$id) {
        console.warn('No valid session found, skipping stats fetch');
        return;
      }
      
      const mockStats: UserStats = {
        quizzes: 5, 
        questions: 25
      };
      
      setUserStats(mockStats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [authState.session]);

  // Effect for fetching user stats
  React.useEffect(() => {
    if (authState.user) {
      fetchUserStats();
    }
  }, [authState, fetchUserStats]);

  // Handle CTA clicks
  const handleCtaClick = (action: ConversionAction) => {
    switch (action) {
      case 'signup_clicked':
        router.push('/signup');
        break;
      case 'login_clicked':
        router.push('/login');
        break;
      case 'generate_clicked':
        router.push('/generate');
        break;
      case 'learn_more_clicked':
        // Scroll to features section or navigate to features page
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
          featuresSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          router.push('/features');
        }
        break;
      default:
        break;
    }
  };

  // Convert authState user to AuthUser format
  const getAuthUser = (): AuthUser | null => {
    if (!authState.user) return null;
    
    return {
      $id: authState.user.$id,
      name: authState.user.name || '',
      email: authState.user.email,
      prefs: authState.user.prefs || {}
    };
  };

  return (
    <HomepageLayout 
      user={getAuthUser()}
      onCtaClick={handleCtaClick}
      performanceMode="standard"
      analyticsEnabled={true}
    >
      {/* Additional content can be added here if needed */}
      {/* User stats display for authenticated users */}
      {authState.user && (
        <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Your Quiz Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {userStats.quizzes}
                  </div>
                  <div className="text-gray-600">Quizzes Created</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {userStats.questions}
                  </div>
                  <div className="text-gray-600">Questions Generated</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round((userStats.questions / userStats.quizzes) * 10) / 10 || 0}
                  </div>
                  <div className="text-gray-600">Average Questions per Quiz</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </HomepageLayout>
  );
};

export default Home;