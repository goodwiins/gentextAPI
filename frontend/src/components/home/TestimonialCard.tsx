'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { TestimonialCardProps } from '@/types/analytics';
import { Star, Quote, CheckCircle } from 'lucide-react';

export function TestimonialCard({ 
  name, 
  role, 
  company, 
  content, 
  avatar, 
  rating = 5,
  verified = false 
}: TestimonialCardProps) {
  const [ref, { isIntersecting }] = useIntersectionObserver<HTMLElement>({
    threshold: 0.3,
    triggerOnce: true
  });

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <motion.article
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { duration: 0.6, ease: "easeOut" }
        },
        hover: { 
          y: -8,
          scale: 1.02,
          transition: { duration: 0.3 }
        }
      }}
      initial="hidden"
      animate={isIntersecting ? "visible" : "hidden"}
      whileHover="hover"
      className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group"
    >
      {/* Quote icon */}
      <div className="absolute top-6 right-6 text-blue-100 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
        <Quote className="w-12 h-12" />
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {renderStars()}
        {verified && (
          <div className="flex items-center gap-1 ml-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        )}
      </div>

      {/* Content */}
      <blockquote className="mb-6">
        <p className="text-gray-700 leading-relaxed text-lg italic">
          &ldquo;{content}&rdquo;
        </p>
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img 
              src={avatar} 
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {name.charAt(0)}
            </div>
          )}
        </div>

        {/* Author Info */}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">
            {name}
          </h4>
          <p className="text-gray-600">
            {role}
            {company && (
              <>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-gray-500">{company}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.3'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
    </motion.article>
  );
}