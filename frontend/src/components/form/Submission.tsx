import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChangeEvent, useState, useEffect, useCallback, useMemo, memo, forwardRef } from "react";
import { toast } from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, RefreshCw, Info, Sparkles, Send } from "lucide-react";
import { motion } from "framer-motion";

type SubmissionProps = {
  onSubmit: () => void;
  onTextChange: (text: string) => void;
  isLoading?: boolean;
  text?: string;
};

// Move constants outside component
const MAX_CHARS = 18000;
const READABILITY_DEBOUNCE_MS = 500;

// Memoize utility functions
const countSyllables = (text: string): number => {
  return text.toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/[^aeiouy]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
};

const getReadabilityLabel = (score: number): string => {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Difficult";
};

const getReadabilityColor = (score: number): string => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

// Memoized sub-components
const ReadabilityDisplay = memo(function ReadabilityDisplay({ score }: { score: number | null }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-md ${
            score ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800/50'}`}>
            <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span className={`text-sm font-medium ${
              score ? getReadabilityColor(score) : 'text-gray-500 dark:text-gray-400'
            }`}>
              {score 
                ? `Readability: ${getReadabilityLabel(score)} (${score})`
                : 'Readability: N/A'
              }
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-indigo-50 dark:bg-indigo-900/90 border-indigo-200 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 p-3 shadow-lg">
          <p className="text-sm max-w-xs">Flesch Reading Ease score measures how easy your text is to read. Higher scores mean easier readability.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

const StatsDisplay = memo(function StatsDisplay({ 
  wordCount, 
  charCount, 
  maxChars 
}: { 
  wordCount: number;
  charCount: number;
  maxChars: number;
}) {
  return (
    <div className="text-sm font-medium dark:text-gray-300 flex items-center space-x-4">
      <span className={charCount > maxChars * 0.9 ? 'text-red-500 font-bold flex items-center gap-1 animate-pulse' : 'flex items-center gap-1'}>
        {charCount > maxChars * 0.9 && <AlertCircle className="h-3.5 w-3.5" />}
        {charCount.toLocaleString()}/{maxChars.toLocaleString()} chars
      </span>
      <span className="h-4 w-px bg-gray-300 dark:bg-gray-700"></span>
      <span>{wordCount.toLocaleString()} words</span>
    </div>
  );
});

const ProgressDisplay = memo(function ProgressDisplay({ 
  charCount, 
  maxChars 
}: { 
  charCount: number;
  maxChars: number;
}) {
  const charPercentage = useMemo(() => 
    Math.min(100, (charCount / maxChars) * 100),
    [charCount, maxChars]
  );

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Character limit: {charCount}/{maxChars}
        </span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {charPercentage.toFixed(0)}%
        </span>
      </div>
      <Progress 
        value={charPercentage} 
        className={`h-1.5 ${
          charPercentage > 90 
            ? 'bg-red-200 dark:bg-red-900/30' 
            : 'bg-gray-100 dark:bg-gray-700'
        }`}
        indicatorClassName={`${
          charPercentage > 90 
            ? 'bg-red-500' 
            : charPercentage > 70 
              ? 'bg-amber-500' 
              : 'bg-blue-500'
        }`}
      />
    </div>
  );
});

const LoadingOverlay = memo(function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  
  return (
    <div className="absolute inset-0 bg-black/5 dark:bg-black/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-xl animate-pulse border border-indigo-200 dark:border-indigo-800 flex items-center gap-3"
      >
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="font-medium">Processing...</span>
      </motion.div>
    </div>
  );
});

export const Submission = memo(forwardRef<HTMLTextAreaElement, SubmissionProps>(function Submission(
  { 
    onSubmit, 
    onTextChange,
    isLoading = false,
    text: externalText
  }, 
  ref
) {
  const [text, setText] = useState<string>(externalText || "");
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [readabilityScore, setReadabilityScore] = useState<number | null>(null);

  // Memoize derived values
  const charPercentage = useMemo(() => 
    Math.min(100, (charCount / MAX_CHARS) * 100),
    [charCount]
  );

  // Memoize handlers
  const handleTextChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    if (newText.length > MAX_CHARS) {
      toast.error(`Text cannot exceed ${MAX_CHARS} characters`);
      return;
    }
    
    const words = newText.trim().split(/\s+/);
    setWordCount(words[0] === "" ? 0 : words.length);
    setCharCount(newText.length);
    setText(newText);
    onTextChange(newText);
  }, [onTextChange]);

  const handleClearText = useCallback(() => {
    if (isLoading) return;
    setText("");
    setWordCount(0);
    setCharCount(0);
    setReadabilityScore(null);
    onTextChange("");
    toast.success("Text cleared");
  }, [isLoading, onTextChange]);

  const handleSubmit = useCallback(() => {
    if (!termsAccepted) {
      toast.error("Please accept the terms of service");
      return;
    }
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }
    onSubmit();
  }, [termsAccepted, text, onSubmit]);

  // Optimize readability calculation with debouncing
  useEffect(() => {
    if (!text.trim()) {
      setReadabilityScore(null);
      return;
    }

    const calculateReadabilityScore = () => {
      const sentences = text.split(/[.!?]+/).filter(Boolean).length;
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const syllables = countSyllables(text);
      
      if (words === 0 || sentences === 0) return;
      
      const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
      setReadabilityScore(Math.min(100, Math.max(0, Math.round(score))));
    };

    const timeoutId = setTimeout(calculateReadabilityScore, READABILITY_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [text]);

  // Sync with external text
  useEffect(() => {
    if (externalText !== undefined) {
      setText(externalText);
      const words = externalText.trim().split(/\s+/);
      setWordCount(words[0] === "" ? 0 : words.length);
      setCharCount(externalText.length);
    }
  }, [externalText]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-5 md:p-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg">
        {/* Header with readability and stats */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b dark:border-gray-700 pb-4 mb-5 gap-3">
          <div className="flex items-center">
            <ReadabilityDisplay score={readabilityScore} />
          </div>
          <StatsDisplay wordCount={wordCount} charCount={charCount} maxChars={MAX_CHARS} />
        </div>
        
        {/* Textarea */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-lg opacity-30 dark:opacity-40 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          
          <Textarea
            className="mt-4 h-64 md:h-72 border dark:border-gray-700 p-5 text-base resize-none focus:ring-2 focus:ring-indigo-500 rounded-lg shadow-sm relative backdrop-blur-sm transition-all duration-300 group-hover:shadow-md"
            placeholder="Paste your text here..."
            value={text}
            onChange={handleTextChange}
            disabled={isLoading}
            ref={ref}
          />
          <LoadingOverlay isLoading={isLoading} />
        </div>
        
        <ProgressDisplay charCount={charCount} maxChars={MAX_CHARS} />
        
        {/* Terms checkbox */}
        <div className="mt-6 flex items-start space-x-2">
          <Checkbox 
            id="terms" 
            className="mt-0.5"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            disabled={isLoading}
          />
          <label 
            htmlFor="terms" 
            className="text-sm text-gray-600 dark:text-gray-400 leading-tight cursor-pointer"
          >
            I understand that the generated quiz is for educational purposes only and may not be 100% accurate. By using this service, I agree to the <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>.
          </label>
        </div>
        
        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !text.trim() || !termsAccepted}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Quiz
          </Button>
          <Button
            onClick={handleClearText}
            disabled={isLoading || !text.trim()}
            variant="outline"
            className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Clear Text
          </Button>
        </div>
      </div>
    </div>
  );
})); 