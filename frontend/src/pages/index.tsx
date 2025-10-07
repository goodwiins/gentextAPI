// frontend/src/pages/index.tsx
import React from 'react';
import Head from 'next/head';
import { useRouter } from "next/router";
import { useEffect } from 'react';
import { useAuthContext } from "@/context/auth-context";
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { BackgroundLines } from "@/components/ui/background-lines";
import UserStatsDisplay from "@/components/UserStatsDisplay";
import { useUserStats } from "@/hooks/useUserStats";
import ErrorBoundary from "@/components/ErrorBoundary";
import { 
  ArrowRight, 
  Zap, 
  Brain, 
  Target, 
  Users,
  BookOpen,
  Sparkles,
  CheckCircle
} from 'lucide-react';

interface UserStats {
  quizzes: number;
  questions: number;
}

const Home: React.FC = () => {
  const [userStats] = React.useState<UserStats>({ quizzes: 5, questions: 25 });
  const router = useRouter();
  const { authState, refreshAuth } = useAuthContext();

  // Integrate our new user stats hook
  const { stats: realUserStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useUserStats({
    enabled: !!authState.user
  });

  // Handle OAuth callback on main page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth_success');
    const authError = urlParams.get('auth_error');

    if (authSuccess === 'true') {
      toast.loading('Completing authentication...');
      refreshAuth().then(() => {
        toast.dismiss();
        toast.success('Successfully logged in with Google!');
        router.replace('/', undefined, { shallow: true });
      }).catch(() => {
        toast.dismiss();
        toast.error('Failed to complete authentication. Please try again.');
        router.replace('/login');
      });
    } else if (authError === 'true') {
      toast.error('Authentication failed. Please try again.');
      router.replace('/login');
    }
  }, []);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI-Powered Generation",
      description: "Advanced AI analyzes your text and creates relevant, engaging quiz questions automatically."
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Instant Results",
      description: "Generate comprehensive quizzes in seconds, not hours. Perfect for busy educators and trainers."
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Customizable Options",
      description: "Tailor question difficulty, format, and focus areas to match your specific learning objectives."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Multiple Formats",
      description: "Support for various question types including multiple choice, true/false, and short answer."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Collaboration Ready",
      description: "Share quizzes with colleagues, students, or team members with easy export options."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "Smart Analytics",
      description: "Track quiz performance and get insights to improve your educational content."
    }
  ];

  const benefits = [
    "Save hours of manual question writing",
    "Improve student engagement with AI-generated content",
    "Create consistent, high-quality assessments",
    "Scale your educational content effortlessly"
  ];

  return (
    <>
      <Head>
        <title>GenText - AI-Powered Quiz Generator</title>
        <meta name="description" content="Transform any text into engaging quizzes with our AI-powered quiz generator. Perfect for educators, trainers, and content creators." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <ErrorBoundary>
        <div className="bg-background">
        <BackgroundLines className="absolute inset-0 pointer-events-none" svgOptions={{ duration: 20 }}>
            <></>
          </BackgroundLines>
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="py-20 px-6 pt-32" aria-labelledby="hero-heading">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  AI-Powered Quiz Generation
                </div>

                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                    Transform Text into
                    <span className="block text-primary">Engaging Quizzes</span>
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Create educational assessments in seconds with our AI-powered quiz generator. 
                    Perfect for educators, trainers, and content creators.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  {authState.user ? (
                    <Button 
                      size="lg" 
                      className="h-12 px-8 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => router.push('/generate')}
                      aria-describedby="hero-heading"
                    >
                      Create Quiz Now
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  ) : (
                    <>
                      <Button 
                        size="lg" 
                        className="h-12 px-8 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={() => router.push('/signup')}
                        aria-describedby="hero-heading"
                      >
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-12 px-8 text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={() => router.push('/login')}
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* User Stats Section */}
          {authState.user && (
            <section className="py-16 px-6 bg-muted/20">
              <div className="container mx-auto max-w-4xl">
                <ErrorBoundary>
                  <UserStatsDisplay
                    stats={realUserStats}
                    isLoading={statsLoading}
                    error={statsError}
                    onRetry={refetchStats}
                    compact={true}
                  />
                </ErrorBoundary>
              </div>
            </section>
          )}

          {/* Features Section with 3D Cards */}
          <section className="py-20 px-6 bg-muted/30" aria-labelledby="features-heading">
            <div className="container mx-auto max-w-7xl">
              <div className="text-center mb-16">
                <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Powerful Features for Modern Education
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to create engaging, effective quizzes that enhance learning outcomes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
                {features.map((feature, index) => (
                  <div key={index} role="listitem">
                    <CardContainer className="inter-var">
                      <CardBody className="bg-card relative group/card border-border/50 w-full h-auto rounded-xl p-6 border hover:shadow-2xl hover:shadow-primary/[0.1] transition-all duration-300 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <CardItem
                          translateZ="50"
                          className="mb-4"
                        >
                          <div className="p-3 rounded-lg bg-primary/10 w-fit" aria-hidden="true">
                            {feature.icon}
                          </div>
                        </CardItem>
                        
                        <CardItem
                          translateZ="60"
                          className="text-xl font-semibold text-foreground mb-2"
                          as="h3"
                        >
                          {feature.title}
                        </CardItem>
                        
                        <CardItem
                          translateZ="40"
                          className="text-muted-foreground text-sm leading-relaxed"
                          as="p"
                        >
                          {feature.description}
                        </CardItem>
                      </CardBody>
                    </CardContainer>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-20 px-6">
            <div className="container mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Why Choose GenText?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Join thousands of educators who trust GenText for their quiz generation needs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/50">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* User Stats Section (for authenticated users) */}
          {authState.user && (
            <section className="py-20 px-6 bg-muted/30">
              <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Your Quiz Statistics
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-3xl font-bold text-primary">
                        {userStats.quizzes}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">Quizzes Created</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-3xl font-bold text-primary">
                        {userStats.questions}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">Questions Generated</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-3xl font-bold text-primary">
                        {Math.round((userStats.questions / userStats.quizzes) * 10) / 10 || 0}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground">Avg Questions per Quiz</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="py-20 px-6 pb-32">
            <div className="container mx-auto max-w-4xl text-center">
              <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
                <CardContent className="p-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Ready to Transform Your Teaching?
                  </h2>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Start creating engaging quizzes in minutes. Join thousands of educators 
                    who have revolutionized their assessment process with GenText.
                  </p>
                  
                  {!authState.user && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        size="lg" 
                        className="h-12 px-8 text-base"
                        onClick={() => router.push('/signup')}
                      >
                        Start Creating Quizzes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="h-12 px-8 text-base"
                        onClick={() => router.push('/login')}
                      >
                        Sign In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
        </div>
      </ErrorBoundary>
    </>
  );
};

export default Home;