// frontend/src/components/submission.tsx
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChangeEvent, useState, useEffect } from "react";
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

export const Submission: React.FC<SubmissionProps> = ({ 
  onSubmit, 
  onTextChange,
  isLoading = false,
  text: externalText
}) => {
  const [text, setText] = useState<string>(externalText || "");
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [readabilityScore, setReadabilityScore] = useState<number | null>(null);

  const MAX_CHARS = 18000;
  const charPercentage = Math.min(100, (charCount / MAX_CHARS) * 100);

  useEffect(() => {
    if (externalText !== undefined) {
      setText(externalText);
      const words = externalText.trim().split(/\s+/);
      setWordCount(words[0] === "" ? 0 : words.length);
      setCharCount(externalText.length);
    }
  }, [externalText]);

  useEffect(() => {
    if (text.trim()) {
      calculateReadabilityScore(text);
    } else {
      setReadabilityScore(null);
    }
  }, [text]);

  const calculateReadabilityScore = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const syllables = countSyllables(text);
    
    if (words === 0 || sentences === 0) return;
    
    // Flesch Reading Ease score
    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    setReadabilityScore(Math.min(100, Math.max(0, Math.round(score))));
  };

  const countSyllables = (text: string): number => {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[^aeiouy]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length;
  };

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
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
  };

  const handleClearText = () => {
    if (isLoading) return;
    setText("");
    setWordCount(0);
    setCharCount(0);
    setReadabilityScore(null);
    onTextChange("");
    toast.success("Text cleared");
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

  const handleSubmit = () => {
    if (!termsAccepted) {
      toast.error("Please accept the terms of service");
      return;
    }
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }
    onSubmit();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-5 md:p-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-lg">
        {/* Header with readability and stats */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b dark:border-gray-700 pb-4 mb-5 gap-3">
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-md ${
                    readabilityScore ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-800/50'}`}>
                    <Info className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    <span className={`text-sm font-medium ${
                      readabilityScore ? getReadabilityColor(readabilityScore) : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {readabilityScore 
                        ? `Readability: ${getReadabilityLabel(readabilityScore)} (${readabilityScore})`
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
          </div>
          <div className="text-sm font-medium dark:text-gray-300 flex items-center space-x-4">
            <span className={charCount > MAX_CHARS * 0.9 ? 'text-red-500 font-bold flex items-center gap-1 animate-pulse' : 'flex items-center gap-1'}>
              {charCount > MAX_CHARS * 0.9 && <AlertCircle className="h-3.5 w-3.5" />}
              {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()} chars
            </span>
            <span className="h-4 w-px bg-gray-300 dark:bg-gray-700"></span>
            <span>{wordCount.toLocaleString()} words</span>
          </div>
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
          />
          {isLoading && (
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
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Character limit: {text.length}/18,000
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {charPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={charPercentage} 
            className="h-2 rounded-full overflow-hidden" 
            color={charPercentage > 90 ? 'bg-rose-500' : charPercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'} 
          />
        </div>
        
        {/* Terms */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 mb-6 gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 group"
          >
            <Checkbox 
              id="terms" 
              disabled={isLoading}
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 transition-all duration-200 hover:scale-110"
            />
            <label 
              className="text-sm dark:text-gray-300 cursor-pointer select-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200" 
              htmlFor="terms"
            >
              I agree to the terms of service
            </label>
          </motion.div>
          <div>
            <Button
              variant="outline"
              size="sm"
              className={`group flex items-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:scale-105'}`}
              onClick={isLoading ? undefined : handleClearText}
              disabled={isLoading || !text.trim()}
            >
              <RefreshCw className={`w-4 h-4 ${!isLoading && text.trim() ? 'group-hover:rotate-180 transition-transform duration-300' : ''}`} />
              Clear text
            </Button>
          </div>
        </div>
        
        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t dark:border-gray-700">
          <div className="w-full sm:w-auto">
            <Badge variant="secondary" className={`px-4 py-2 text-sm font-medium ${isLoading ? 'animate-pulse' : ''} w-full sm:w-auto flex justify-center items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 shadow-sm`}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> 
                  Processing...
                </>
              ) : text.trim() ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Ready to submit
                </>
              ) : (
                "Waiting for input"
              )}
            </Badge>
          </div>
          <div className="w-full sm:w-auto">
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className={`
                h-11 px-6 w-full sm:w-auto
                flex items-center justify-center gap-2
                transition-all duration-300
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                ${text.trim() && !isLoading ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 shadow-md hover:shadow-lg hover:scale-105' : ''}
              `}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};