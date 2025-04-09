import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Mail, Heart, ExternalLink, BookOpen, HelpCircle, Shield, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-10 mt-auto relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 opacity-70"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo and description */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2 space-y-4"
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
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950 dark:hover:border-blue-800 transition-all duration-300" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <Github className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9 hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-950 dark:hover:border-indigo-800 transition-all duration-300" asChild>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </a>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9 hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950 dark:hover:border-purple-800 transition-all duration-300" asChild>
                <a href="mailto:contact@example.com" aria-label="Email">
                  <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Resources */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="col-span-1 space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/documentation" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center group">
                  <span className="h-5 w-5 flex justify-center items-center mr-2 bg-blue-50 dark:bg-blue-900/20 rounded group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Documentation</span>
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center group">
                  <span className="h-5 w-5 flex justify-center items-center mr-2 bg-indigo-50 dark:bg-indigo-900/20 rounded group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                    <HelpCircle className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Help Center</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center group">
                  <span className="h-5 w-5 flex justify-center items-center mr-2 bg-purple-50 dark:bg-purple-900/20 rounded group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Blog</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="col-span-1 space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm group inline-block">
                  <span className="group-hover:translate-x-1 transition-transform inline-block">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm group inline-block">
                  <span className="group-hover:translate-x-1 transition-transform inline-block">Careers</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm group inline-block">
                  <span className="group-hover:translate-x-1 transition-transform inline-block">Contact</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="col-span-1 space-y-4"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm flex items-center group">
                  <span className="h-5 w-5 flex justify-center items-center mr-2 bg-blue-50 dark:bg-blue-900/20 rounded group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                    <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </span>
                  <span className="group-hover:translate-x-1 transition-transform">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm group inline-block ml-7">
                  <span className="group-hover:translate-x-1 transition-transform inline-block">Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm group inline-block ml-7">
                  <span className="group-hover:translate-x-1 transition-transform inline-block">Cookie Policy</span>
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>
        
        {/* Newsletter section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-sm font-semibold text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text">Stay updated with our newsletter</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Get the latest features and updates delivered to your inbox.</p>
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
        
        {/* Copyright */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
              Made with <motion.span
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              ><Heart className="h-3 w-3 mx-1 text-red-500" /></motion.span> using 
              <span className="ml-1 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent font-medium">Next.js</span> 
              <span className="mx-1">and</span> 
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-medium">Appwrite</span>
            </motion.span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer; 