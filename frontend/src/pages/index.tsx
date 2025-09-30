// frontend/src/pages/index.tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from "next/router";
import { HomepageLayout } from "@/components/home/HomepageLayout";
import { useAuthContext } from "@/context/auth-context";
import type { AuthUser, ConversionAction } from '@/types/analytics';

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
    <>
      <Head>
        {/* Primary SEO Meta Tags */}
        <title>GenText - AI-Powered Quiz Generator | Create Educational Quizzes Instantly</title>
        <meta name="title" content="GenText - AI-Powered Quiz Generator | Create Educational Quizzes Instantly" />
        <meta name="description" content="Transform any text into engaging quizzes with our AI-powered quiz generator. Perfect for educators, trainers, and content creators. Generate multiple-choice questions instantly from your content." />
        <meta name="keywords" content="AI quiz generator, educational technology, quiz maker, question generator, e-learning tools, educational assessment, online quizzes, teaching tools, content creation, automated quiz generation" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://gentext.app" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gentext.app" />
        <meta property="og:title" content="GenText - AI-Powered Quiz Generator | Create Educational Quizzes Instantly" />
        <meta property="og:description" content="Transform any text into engaging quizzes with our AI-powered quiz generator. Perfect for educators, trainers, and content creators." />
        <meta property="og:image" content="https://gentext.app/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="GenText" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://gentext.app" />
        <meta property="twitter:title" content="GenText - AI-Powered Quiz Generator" />
        <meta property="twitter:description" content="Transform any text into engaging quizzes with our AI-powered quiz generator. Perfect for educators and content creators." />
        <meta property="twitter:image" content="https://gentext.app/twitter-image.jpg" />
        <meta property="twitter:creator" content="@gentextapp" />
        <meta property="twitter:site" content="@gentextapp" />
        
        {/* Additional Meta Tags */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="author" content="GenText Team" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        
        {/* Favicon and Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GenText",
              "url": "https://gentext.app",
              "logo": "https://gentext.app/logo.png",
              "description": "AI-powered quiz generator for educational content creation",
              "sameAs": [
                "https://twitter.com/gentextapp",
                "https://linkedin.com/company/gentext"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@gentext.app"
              }
            })
          }}
        />
        
        {/* Structured Data - WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "GenText Quiz Generator",
              "url": "https://gentext.app",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "description": "AI-powered quiz generator that transforms any text into engaging educational quizzes",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Free tier available"
              },
              "featureList": [
                "AI-powered question generation",
                "Multiple choice quiz creation",
                "Text analysis and processing",
                "Educational content optimization",
                "Real-time quiz generation"
              ],
              "screenshot": "https://gentext.app/screenshot.jpg",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "127",
                "bestRating": "5"
              }
            })
          }}
        />
        
        {/* Structured Data - Service */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "serviceType": "Educational Technology",
              "provider": {
                "@type": "Organization",
                "name": "GenText"
              },
              "description": "AI-powered quiz generation service for educators and content creators",
              "areaServed": "Worldwide",
              "availableChannel": {
                "@type": "ServiceChannel",
                "serviceUrl": "https://gentext.app",
                "serviceType": "Online"
              }
            })
          }}
        />
        
        {/* Structured Data - FAQ (if we have common questions) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How does the AI quiz generator work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our AI analyzes your text content and automatically generates relevant multiple-choice questions with distractors, making it easy to create engaging quizzes in seconds."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What types of content can I use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can use any text content including articles, textbooks, documentation, training materials, and educational content to generate quizzes."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is GenText free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, GenText offers a free tier that allows you to generate quizzes from your content. Premium features are available for advanced users."
                  }
                }
              ]
            })
          }}
        />
        
        {/* Performance and Loading Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </Head>
      
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
    </>
  );
};

export default Home;