/**
 * v0 by Vercel.
 * @see https://v0.dev/t/c6ZyZRxHeXu
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button"
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { JSX, SVGProps } from "react"

export default function Submission() {
  return (
    <div className="bg-white">
    <div className="max-w-4xl mx-auto p-12 bg-greey mt-12 rounded-lg shadow">
      <div className="flex justify-between border-b pb-4">
        <div className="flex space-x-4">
          <Button variant="outline">READABILITY</Button>
          <Select>
            <SelectTrigger id="readability-level">
              <SelectValue placeholder="University" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elementary">Elementary</SelectItem>
              <SelectItem value="highschool">High School</SelectItem>
              <SelectItem value="university">University</SelectItem>
              <SelectItem value="postgrad">Postgraduate</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">PURPOSE</Button>
          <Select>
            <SelectTrigger id="writing-purpose">
              <SelectValue placeholder="General Writing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Writing</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm">
          <span className="font-medium">0/15000 CHARS</span>~ 0 WORDS{"\n          "}
        </div>
      </div>
      <Textarea className="mt-4 h-40 border p-4" placeholder="PASTE YOUR TEXT HERE" />
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label className="text-sm" htmlFor="terms">
            I AGREE TO THE TERMS OF SERVICE 
          </label>
        </div>
        <div className="flex space-x-4">
          <Button variant="outline"></Button>
          <Button variant="outline"></Button>
          <Button variant="outline"></Button>
          <RefreshCwIcon className="text-lg" />
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">WAITING FOR YOUR INPUT</Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline"></Button>
          <Button variant="secondary"></Button>
        </div>
      </div>
    </div>
    </div>
  )
}

function RefreshCwIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
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
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}