'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HomepageHero } from './HomepageHero';
import { FeatureCard } from './FeatureCard';
import { ProcessStep } from './ProcessStep';
import { TestimonialCard } from './TestimonialCard';
import { CtaSection } from './CtaSection';
import type { HomepageLayoutProps, AuthUser, ConversionAction } from '@/specs/001-homepage-saas/contracts/frontend-components';
import { 
  Brain, 
  Zap, 
  Shield, 
  Target, 
  BookOpen, 
  Users,
  ArrowRight,
  Upload,
  Settings,
  Sparkles
} from 'lucide-react';

export function HomepageLayout({ 
  children, 
  user, 
  performanceMode = 'standard',
  analyticsEnabled = true 
}: HomepageLayoutProps) {
  const handleCtaClick = (action: ConversionAction) => {
    // Handle CTA clicks - could navigate to different pages
    console.log('CTA clicked:', action);
    
    // Example navigation logic
    switch (action) {
      case 'signup_clicked':
        // Navigate to signup page
        break;
      case 'login_clicked':
        // Navigate to login page
        break;
      case 'generate_clicked':
        // Navigate to quiz generation page
        break;
      case 'learn_more_clicked':
        // Navigate to features page or scroll to features
        break;
      default:
        break;
    }
  };

  const handleFeatureView = (featureId: string) => {
    if (analyticsEnabled) {
      console.log('Feature viewed:', featureId);
    }
  };

  const handleFeatureInteraction = (featureId: string, interactionType: string) => {
    if (analyticsEnabled) {
      console.log('Feature interaction:', featureId, interactionType);
    }
  };

  // Feature data
  const features = [
    {
      id: 'ai-generation',
      title: 'AI-Powered Generation',
      description: 'Generate high-quality quiz questions using advanced GPT and transformer models',
      icon: Brain
    },
    {
      id: 'instant-results',
      title: 'Instant Results',
      description: 'Get your quizzes generated in seconds, not hours. Save valuable preparation time.',
      icon: Zap
    },
    {
      id: 'quality-assurance',
      title: 'Quality Assurance',
      description: 'Our AI ensures questions are accurate, educational, and age-appropriate.',
      icon: Shield
    },
    {
      id: 'customizable',
      title: 'Fully Customizable',
      description: 'Adjust difficulty, question types, and topics to match your specific needs.',
      icon: Settings
    }
  ];

  // Process steps
  const processSteps = [
    {
      stepNumber: 1,
      title: 'Upload Your Content',
      description: 'Simply paste your text, upload a document, or provide a topic',
      icon: Upload,
      animationDirection: 'left' as const
    },
    {
      stepNumber: 2,
      title: 'Configure Settings',
      description: 'Choose question types, difficulty level, and number of questions',
      icon: Settings,
      animationDirection: 'up' as const
    },
    {
      stepNumber: 3,
      title: 'Generate Quiz',
      description: 'Our AI creates engaging questions tailored to your content',
      icon: Sparkles,
      animationDirection: 'right' as const
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'High School Teacher',
      company: 'Lincoln High School',
      content: 'This tool has saved me hours of quiz preparation. The AI-generated questions are surprisingly accurate and engaging!',
      rating: 5,
      verified: true
    },
    {
      name: 'Dr. Michael Chen',
      role: 'University Professor',
      company: 'Stanford University',
      content: 'As an educator, I\'m impressed by the quality and pedagogical value of the generated quizzes. Highly recommended!',
      rating: 5,
      verified: true
    },
    {
      name: 'Emily Rodriguez',
      role: 'Content Creator',
      company: 'EduTech Solutions',
      content: 'The perfect tool for creating interactive content. My students love the quizzes, and engagement has skyrocketed!',
      rating: 5,
      verified: true
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HomepageHero 
        user={user}
        onCtaClick={handleCtaClick}
        performanceMode={performanceMode}
      />

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Education
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create engaging, professional quizzes in minutes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                animationDelay={index * 0.1}
                onView={handleFeatureView}
                onInteraction={handleFeatureInteraction}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Create your first quiz in three simple steps
            </p>
          </motion.div>

          <div className="relative">
            <ol className="space-y-12">
              {processSteps.map((step, index) => (
                <ProcessStep
                  key={step.stepNumber}
                  stepNumber={step.stepNumber}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  isLast={index === processSteps.length - 1}
                  animationDirection={step.animationDirection}
                />
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Educators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what teachers and professors are saying about our platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                role={testimonial.role}
                company={testimonial.company}
                content={testimonial.content}
                rating={testimonial.rating}
                verified={testimonial.verified}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CtaSection
        variant="primary"
        user={user}
        onCtaClick={handleCtaClick}
        showSocialProof={true}
        backgroundColor="gradient"
      />

      {/* Additional content */}
      {children}
    </div>
  );
}