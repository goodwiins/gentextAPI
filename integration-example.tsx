// integration-example.tsx
// Example showing how to integrate all UX improvements into your existing app

import React from 'react';
import { NotificationProvider } from '@/components/ui/notification-system';
import { useAuthFlow } from '@/hooks/useAuthFlow';
import { ProgressLoader } from '@/components/ui/progress-loader';
import EnhancedNavbar from '@/components/navigation/EnhancedNavbar';

// 1. WRAP YOUR APP WITH THE NOTIFICATION PROVIDER
// In your _app.tsx or main layout:
export function AppWithImprovedUX({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {/* Your existing app content */}
      <EnhancedNavbar />
      <main className="bg-gradient-app min-h-screen">
        {children}
      </main>
    </NotificationProvider>
  );
}

// 2. ENHANCED LOGIN COMPONENT EXAMPLE
// Replace your existing login component with this pattern:
export function ImprovedLoginForm() {
  const {
    flowState,
    login,
    getSavedCredentials,
    canAttemptAuth,
    getLoadingMessage,
    getProgress
  } = useAuthFlow();

  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Load saved credentials
  React.useEffect(() => {
    const saved = getSavedCredentials();
    setFormData(prev => ({
      ...prev,
      email: saved.email,
      rememberMe: saved.rememberMe,
    }));
  }, [getSavedCredentials]);

  // Show enhanced loading during authentication
  if (flowState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-app flex items-center justify-center">
        <ProgressLoader
          progress={getProgress()}
          message={getLoadingMessage()}
          variant="card"
          showPercentage
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAttemptAuth) return;

    await login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-app flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="glass p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gradient mb-6 text-center">
          Welcome Back
        </h1>
        
        {/* Enhanced error display */}
        {flowState.error && (
          <div className="mb-4 p-3 bg-red-50/80 border border-red-200 rounded-lg text-red-700 text-sm">
            {flowState.error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input-enhanced w-full"
              placeholder="Enter your email"
              disabled={flowState.isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="input-enhanced w-full"
              placeholder="Enter your password"
              disabled={flowState.isLoading}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={formData.rememberMe}
              onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="remember" className="text-sm">Remember me</label>
          </div>

          <button
            type="submit"
            disabled={flowState.isLoading || !canAttemptAuth}
            className="btn-primary w-full h-12 text-base font-semibold"
          >
            {flowState.isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {!canAttemptAuth && (
            <p className="text-sm text-center text-orange-600 bg-orange-50/80 p-3 rounded-lg">
              Too many attempts. Please wait 5 minutes.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

// 3. ENHANCED MAIN PAGE EXAMPLE
// Apply the new design system to your existing components:
export function ImprovedMainPage() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [text, setText] = React.useState('');

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      // Your existing quiz generation logic here
      await generateQuiz(text);
      
      // Use enhanced notifications
      import('@/components/ui/notification-system').then(({ enhancedToast }) => {
        enhancedToast.quizGenerated(5); // Shows: "Successfully created 5 questions!"
      });
    } catch (error) {
      import('@/components/ui/notification-system').then(({ enhancedToast }) => {
        enhancedToast.networkError(); // Shows error with retry button
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="section-padding">
      <div className="container-custom">
        {/* Enhanced card with glass effect */}
        <div className="card-enhanced p-8 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient mb-6 text-center">
            Create Your Quiz
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste your text here
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-enhanced w-full min-h-[200px] resize-y"
                placeholder="Paste the text you want to create quiz questions from..."
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || !text.trim()}
                className="btn-primary px-8 py-3 text-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  'Generate Quiz'
                )}
              </button>
            </div>

            {/* Loading state with skeleton */}
            {isGenerating && (
              <div className="space-y-4 mt-8">
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. STEP-BY-STEP INTEGRATION GUIDE

/*
STEP 1: Install the notification provider
========================
In your _app.tsx:

import { NotificationProvider } from '@/components/ui/notification-system';

export default function App({ Component, pageProps }) {
  return (
    <NotificationProvider>
      <Component {...pageProps} />
    </NotificationProvider>
  );
}

STEP 2: Replace your navbar
========================
In your layout component:

import EnhancedNavbar from '@/components/navigation/EnhancedNavbar';

// Replace your existing navbar with:
<EnhancedNavbar />

STEP 3: Update your login page
========================
Replace your existing login logic with:

import { useAuthFlow } from '@/hooks/useAuthFlow';

const { login, flowState, getProgress, getLoadingMessage } = useAuthFlow();

STEP 4: Apply the design system
========================
Replace existing CSS classes with:

// Old: className="bg-white p-4 rounded shadow"
// New: className="card-enhanced p-6"

// Old: className="bg-blue-600 text-white px-4 py-2 rounded"
// New: className="btn-primary px-6 py-3"

// Old: className="border rounded p-2"
// New: className="input-enhanced"

STEP 5: Add enhanced notifications
========================
Replace toast calls with:

import { enhancedToast } from '@/components/ui/notification-system';

// Old: toast.success("Success!")
// New: enhancedToast.authSuccess('login');

// Old: toast.error("Error occurred")
// New: enhancedToast.networkError(); // Includes retry button

STEP 6: Add loading states
========================
Import and use the new loading components:

import { ProgressLoader, LoadingDots } from '@/components/ui/progress-loader';

// For full-screen loading:
<ProgressLoader progress={75} message="Processing..." variant="card" />

// For inline loading:
<LoadingDots size="md" />
*/

// 5. EXPECTED RESULTS AFTER INTEGRATION

/*
✅ Users will see:
- Smooth animations throughout the app
- Clear progress indicators during loading
- Helpful error messages with actions
- Professional glassmorphism design
- Better mobile experience
- Faster perceived performance

✅ You will get:
- Reduced support tickets
- Higher user satisfaction
- Better conversion rates
- Improved security
- Easier maintenance
- Modern, professional appearance

✅ Technical improvements:
- Better accessibility scores
- Improved Core Web Vitals
- Enhanced security posture
- Optimized performance
- Cleaner code organization
*/