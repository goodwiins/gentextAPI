// frontend/src/components/submission.tsx
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChangeEvent, useState } from "react";

type SubmissionProps = {
  onSubmit: () => void;
  onTextChange: (text: string) => void;
  isLoading?: boolean; // Add this prop
};

export const Submission: React.FC<SubmissionProps> = ({ 
  onSubmit, 
  onTextChange,
  isLoading = false // Default to false
}) => {
  const [text, setText] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [charCount, setCharCount] = useState<number>(0);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    const words = newText.trim().split(/\s+/);
    setWordCount(words[0] === "" ? 0 : words.length);
    setCharCount(newText.length);
    setText(newText);
    onTextChange(newText); // Call the parent's onTextChange method
  };

  const handleClearText = () => {
    setText("");
    setWordCount(0);
    setCharCount(0);
    onTextChange(""); // Clear the text in the parent component as well
  };

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto p-12 bg-gray-100 mt-12 rounded-lg shadow">
        <div className="flex justify-between border-b pb-4">
          <div className="flex space-x-4">
            <Button variant="outline">READABILITY</Button>
          </div>
          <div className="text-sm">
            <span className="font-medium">{charCount}/18000 CHARS</span> ~ {wordCount} WORDS
          </div>
        </div>
        <Textarea
          className="mt-4 h-40 border p-4"
          placeholder="PASTE YOUR TEXT HERE"
          value={text}
          onChange={handleTextChange}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" disabled={isLoading} />
            <label className="text-sm" htmlFor="terms">
              I AGREE TO THE TERMS OF SERVICE
            </label>
          </div>
          <div className="flex space-x-4">
            <RefreshCwIcon 
              className={`text-lg cursor-pointer ${isLoading ? 'opacity-50' : ''}`} 
              onClick={isLoading ? undefined : handleClearText} 
            />
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {isLoading ? "PROCESSING..." : "WAITING FOR YOUR INPUT"}
            </Badge>
          </div>
          <div className="flex space-x-4">
            <Button 
              onClick={onSubmit} 
              disabled={isLoading || !text.trim()} 
              className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isLoading ? "Processing..." : "Submit"}
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