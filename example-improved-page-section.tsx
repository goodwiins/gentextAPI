// Example: How to improve your existing main page with the new design system

// BEFORE (typical existing structure):
const OldQuizSection = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Create Your Quiz</h2>
          <textarea 
            className="w-full p-3 border rounded" 
            placeholder="Enter your text..."
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded mt-4">
            Generate Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

// AFTER (with new design system):
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuizState } from '@/hooks/useQuizState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDebounce } from '@/hooks/useDebounce';

const ImprovedQuizSection = () => {
  const { quizState, actions, refs } = useQuizState();
  const [draftText, setDraftText] = useLocalStorage('quiz-draft', '');
  const debouncedText = useDebounce(quizState.text, 500);

  // Auto-save draft to localStorage
  React.useEffect(() => {
    if (debouncedText) {
      setDraftText(debouncedText);
    }
  }, [debouncedText, setDraftText]);

  return (
    <section className="min-h-screen bg-gradient-app section-padding">
      <div className="container-custom">
        <motion.div 
          className="animate-fade-in"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="glass border-blue-200/50 p-8 max-w-4xl mx-auto">
            <motion.h2 
              className="text-3xl font-bold text-gradient mb-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Create Your Interactive Quiz
            </motion.h2>
            
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Textarea 
                className="input-enhanced min-h-[200px] text-lg"
                placeholder="Paste your text here to generate quiz questions..."
                value={quizState.text}
                onChange={(e) => actions.setText(e.target.value)}
              />
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="btn-primary px-8 py-3"
                  onClick={() => {/* generate quiz logic */}}
                  disabled={quizState.isLoading || !quizState.text.trim()}
                >
                  {quizState.isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icons.Rocket className="w-5 h-5 mr-2" />
                      Generate Quiz
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  className="glass border-blue-200/50 hover:bg-blue-50/50"
                  onClick={() => actions.setText(draftText)}
                  disabled={!draftText}
                >
                  Restore Draft
                </Button>
              </div>
            </motion.div>

            {/* Loading State with Skeleton */}
            {quizState.isLoading && (
              <motion.div 
                className="mt-8 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="skeleton h-6 w-3/4 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-5/6 rounded" />
              </motion.div>
            )}

            {/* Error State */}
            {quizState.error && (
              <motion.div 
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-red-600">{quizState.error}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={actions.clearErrors}
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

// Usage in your main page:
// Simply replace your existing component with the improved version
// and import the new hooks at the top of your file

/* 
Key improvements applied:
1. ✅ Glass morphism effects with backdrop blur
2. ✅ Smooth animations with Framer Motion
3. ✅ Better state management with custom hooks
4. ✅ Auto-save functionality with localStorage
5. ✅ Enhanced loading states with skeletons
6. ✅ Better error handling and user feedback
7. ✅ Responsive design with container utilities
8. ✅ Modern gradient backgrounds
9. ✅ Accessible button states and interactions
10. ✅ Professional typography and spacing
*/