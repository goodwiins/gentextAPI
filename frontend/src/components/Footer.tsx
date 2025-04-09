import React, { memo } from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail, Heart, ExternalLink, BookOpen, HelpCircle, Shield, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Animation variants for reuse
const fadeInUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Memoized sub-components
const SocialButton = memo<{ href: string; icon: React.ReactNode; label: string; hoverColor: string }>(
  ({ href, icon, label, hoverColor }) => (
    <Button 
      variant="outline" 
      size="icon" 
      className={`rounded-full h-9 w-9 hover:bg-${hoverColor}-50 hover:border-${hoverColor}-200 dark:hover:bg-${hoverColor}-950 dark:hover:border-${hoverColor}-800 transition-all duration-300`} 
      asChild
    >
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
        {icon}
      </a>
    </Button>
  )
);
SocialButton.displayName = 'SocialButton';

const FooterLink = memo<{ href: string; icon?: React.ReactNode; label: string; className?: string }>(
  ({ href, icon, label, className = '' }) => (
    <Link 
      href={href} 
      className={`text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center group ${className}`}
    >
      {icon && (
        <span className="h-5 w-5 flex justify-center items-center mr-2 bg-blue-50 dark:bg-blue-900/20 rounded group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
          {icon}
        </span>
      )}
      <span className="group-hover:translate-x-1 transition-transform">{label}</span>
    </Link>
  )
);
FooterLink.displayName = 'FooterLink';

const FooterSection = memo<{ title: string; gradient: string; children: React.ReactNode; delay?: number }>(
  ({ title, gradient, children, delay = 0 }) => (
    <motion.div 
      variants={fadeInUpVariant}
      initial="hidden"
      whileInView="visible"
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="col-span-1 space-y-4"
    >
      <h3 className={`text-sm font-semibold uppercase tracking-wider text-transparent bg-gradient-to-r ${gradient} bg-clip-text`}>
        {title}
      </h3>
      {children}
    </motion.div>
  )
);
FooterSection.displayName = 'FooterSection';

const Newsletter = memo(() => (
  <motion.div 
    variants={fadeInUpVariant}
    initial="hidden"
    whileInView="visible"
    transition={{ duration: 0.5, delay: 0.4 }}
    viewport={{ once: true }}
    className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8"
  >
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div className="mb-4 md:mb-0">
        <h3 className="text-sm font-semibold text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text">
          Stay updated with our newsletter
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Get the latest features and updates delivered to your inbox.
        </p>
      </div>
      <div className="flex w-full md:w-auto">
        <div className="relative w-full md:w-64 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 rounded-md opacity-30 group-hover:opacity-100 blur-sm transition-all duration-300"></div>
          <div className="relative flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="py-2 px-4 w-full rounded-l-md border-0 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            />
            <Button 
              className="rounded-l-none bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500 hover:shadow-lg transition-all duration-300"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
));
Newsletter.displayName = 'Newsletter';

const Copyright = memo(() => {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.div 
      variants={fadeInUpVariant}
      initial="hidden"
      whileInView="visible"
      transition={{ duration: 0.5, delay: 0.5 }}
      viewport={{ once: true }}
      className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400">
        © {currentYear} genText AI. All rights reserved.
      </p>
      <div className="mt-4 md:mt-0 flex items-center">
        <motion.span 
          className="text-xs text-gray-400 dark:text-gray-500 flex items-center"
          whileHover={{ scale: 1.05 }}
        >
          Made with 
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          >
            <Heart className="h-3 w-3 mx-1 text-red-500" />
          </motion.span> 
          using 
          <span className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent font-medium">
            Next.js
          </span> 
          <span className="mx-1">and</span> 
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-medium">
            Appwrite
          </span>
        </motion.span>
      </div>
    </motion.div>
  );
});
Copyright.displayName = 'Copyright';

const Footer = memo(() => {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-10 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 opacity-70"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo and description */}
          <FooterSection 
            title="" 
            gradient=""
            delay={0}
          >
            <Link href="/" className="flex items-center group">
              <Rocket className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-blue-600 dark:group-hover:from-indigo-400 dark:group-hover:via-purple-400 dark:group-hover:to-blue-400 transition-all duration-300">
                genText AI
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              Transform any text into engaging quizzes with our advanced AI technology. 
              Perfect for educators, students, and learning enthusiasts.
            </p>
            <div className="flex space-x-3 mt-4">
              <SocialButton 
                href="https://github.com"
                icon={<Github className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                label="GitHub"
                hoverColor="blue"
              />
              <SocialButton 
                href="https://twitter.com"
                icon={<Twitter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
                label="Twitter"
                hoverColor="indigo"
              />
              <SocialButton 
                href="mailto:contact@example.com"
                icon={<Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                label="Email"
                hoverColor="purple"
              />
            </div>
          </FooterSection>

          {/* Resources */}
          <FooterSection 
            title="Resources" 
            gradient="from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400"
            delay={0.1}
          >
            <ul className="space-y-3">
              <li>
                <FooterLink 
                  href="/documentation"
                  icon={<BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                  label="Documentation"
                />
              </li>
              <li>
                <FooterLink 
                  href="/help"
                  icon={<HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                  label="Help Center"
                />
              </li>
              <li>
                <FooterLink 
                  href="/blog"
                  icon={<ExternalLink className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                  label="Blog"
                />
              </li>
            </ul>
          </FooterSection>

          {/* Company */}
          <FooterSection 
            title="Company" 
            gradient="from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
            delay={0.2}
          >
            <ul className="space-y-3">
              <li>
                <FooterLink href="/about" label="About Us" className="group inline-block" />
              </li>
              <li>
                <FooterLink href="/careers" label="Careers" className="group inline-block" />
              </li>
              <li>
                <FooterLink href="/contact" label="Contact" className="group inline-block" />
              </li>
            </ul>
          </FooterSection>

          {/* Legal */}
          <FooterSection 
            title="Legal" 
            gradient="from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400"
            delay={0.3}
          >
            <ul className="space-y-3">
              <li>
                <FooterLink 
                  href="/privacy"
                  icon={<Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                  label="Privacy Policy"
                />
              </li>
              <li>
                <FooterLink 
                  href="/terms" 
                  label="Terms of Service" 
                  className="group inline-block ml-7" 
                />
              </li>
              <li>
                <FooterLink 
                  href="/cookies" 
                  label="Cookie Policy" 
                  className="group inline-block ml-7" 
                />
              </li>
            </ul>
          </FooterSection>
        </div>
        
        <Newsletter />
        <Copyright />
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer; 