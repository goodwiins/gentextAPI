// frontend/src/pages/index.tsx
import { useEffect, useState } from 'react';
import { fetchUserId } from '../utils/auth';
import { useRouter } from "next/router";
import { Submission } from "@/components/submission";
import QuizDisplay, { QuizQuestion } from '@/components/QuizDisplay';

const Home: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [responseData, setResponseData] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const getUserId = async () => {
      const id = await fetchUserId();
      setUserId(id);
    };

    getUserId();
  }, []);

  const handleSubmit = async () => {
    try {
      setIsLoading(true); // Set loading to true when starting the request
      const token = sessionStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:8000/api/v2/process_text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResponseData(data);
      console.log(data);
    } catch (error) {
      console.error('There has been a problem with your fetch operation: ', error);
    } finally {
      setIsLoading(false); // Set loading to false when request completes
    }
  };

  const handleQuizSubmit = (answers: {[key: number]: string}) => {
    console.log('Quiz submitted with answers:', answers);
    // You can send these answers to your backend here
  };

  return (
    <>
      <div className="ml-auto flex gap-2"></div>
      <section className="w-full py-24 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Welcome to genText Inc</h1>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              We generate test quizzes as flashcards to help you improve your grades.
            </p>
          </div>
        </div>
      </section>

      <Submission 
        onSubmit={handleSubmit} 
        onTextChange={setText} 
        isLoading={isLoading}
      />

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
          <p className="ml-4 text-xl font-semibold text-gray-700">Processing your text...</p>
        </div>
      )}

      {!isLoading && responseData && Array.isArray(responseData) && responseData.length > 0 ? (
        <QuizDisplay 
          questions={responseData} 
          originalText={text} 
          onSubmit={handleQuizSubmit} 
        />
      ) : null}

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <RocketIcon className="h-12 w-12" />
              <h2 className="text-2xl font-bold">Fast Delivery</h2>
              <p className="text-gray-500 dark:text-gray-400">We ensure quick delivery of our products.</p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <ShieldIcon className="h-12 w-12" />
              <h2 className="text-2xl font-bold">Secure Payment</h2>
              <p className="text-gray-500 dark:text-gray-400">We provide secure payment options for our customers.</p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <SettingsIcon className="h-12 w-12" />
              <h2 className="text-2xl font-bold">24/7 Support</h2>
              <p className="text-gray-500 dark:text-gray-400">We provide 24/7 support to all our customers.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

// SVG icon components
function RocketIcon(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

function SettingsIcon(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ShieldIcon(props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

export default Home;