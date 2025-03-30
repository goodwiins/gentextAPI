// frontend/src/components/submission.tsx
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChangeEvent, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

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
    setText("");
    setWordCount(0);
    setCharCount(0);
    setReadabilityScore(null);
    onTextChange("");
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="max-w-4xl mx-auto p-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex justify-between items-center border-b dark:border-gray-700 pb-5 mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline"
              className={`px-5 py-2.5 h-auto ${readabilityScore ? 'bg-opacity-90' : 'opacity-50'}`}
            >
              {readabilityScore 
                ? `READABILITY: ${getReadabilityLabel(readabilityScore)} (${readabilityScore})`
                : 'READABILITY: N/A'
              }
            </Button>
          </div>
          <div className="text-sm font-medium dark:text-gray-300 flex items-center space-x-4">
            <span className={charCount > MAX_CHARS * 0.9 ? 'text-red-500 font-bold' : ''}>
              {charCount}/{MAX_CHARS} CHARS
            </span>
            <span className="h-4 w-px bg-gray-300 dark:bg-gray-700"></span>
            <span>{wordCount} WORDS</span>
          </div>
        </div>
        
        <Textarea
          className="mt-6 h-56 border dark:border-gray-700 p-5 text-base resize-none focus:ring-2 focus:ring-primary rounded-lg"
          placeholder="PASTE YOUR TEXT HERE..."
          value={text}
          onChange={handleTextChange}
          disabled={isLoading}
        />
        
        <div className="flex items-center justify-between mt-6 mb-6">
          <div className="flex items-center space-x-3">
            <Checkbox 
              id="terms" 
              disabled={isLoading}
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              className="h-5 w-5"
            />
            <label 
              className="text-sm dark:text-gray-300 cursor-pointer font-medium" 
              htmlFor="terms"
            >
              I AGREE TO THE TERMS OF SERVICE
            </label>
          </div>
          <div className="flex space-x-4">
            <RefreshCwIcon 
              className={`w-6 h-6 cursor-pointer hover:text-primary transition-colors
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={isLoading ? undefined : handleClearText} 
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center">
            <Badge variant="secondary" className={`px-4 py-2 text-sm font-medium ${isLoading ? 'animate-pulse' : ''}`}>
              {isLoading ? "PROCESSING..." : text.trim() ? "READY TO SUBMIT" : "WAITING FOR INPUT"}
            </Badge>
          </div>
          <div>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className={`
                h-11 px-6
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                ${text.trim() && termsAccepted ? 'bg-primary hover:bg-primary/90' : ''}
              `}
            >
              {isLoading ? "Processing..." : "Generate Quiz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function RefreshCwIcon(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="cursor-pointer"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}