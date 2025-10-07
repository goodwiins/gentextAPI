import React from 'react';
import { CallToActionButton } from '@/types/homepage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Download, ExternalLink } from 'lucide-react';

interface CallToActionProps extends CallToActionButton {
  className?: string;
  loading?: boolean;
}

const CallToAction: React.FC<CallToActionProps> = ({
  text,
  url,
  variant,
  size,
  disabled,
  loading = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}) => {
  const getIcon = () => {
    if (text.toLowerCase().includes('start')) return Play;
    if (text.toLowerCase().includes('download')) return Download;
    if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('read')) return ExternalLink;
    return ArrowRight;
  };

  const Icon = getIcon();

  const getButtonClasses = () => {
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'rounded-lg': size !== 'sm',
        'rounded-md': size === 'sm',
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-base': size === 'md',
        'px-6 py-3 text-lg': size === 'lg',
        'transform hover:scale-105': !disabled && !loading,
        'transition-none': disabled || loading,
      }
    );

    switch (variant) {
      case 'primary':
        return cn(
          baseClasses,
          'bg-blue-600 text-white hover:bg-blue-700',
          'focus:ring-blue-500',
          'shadow-sm hover:shadow-md'
        );
      case 'secondary':
        return cn(
          baseClasses,
          'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
          'focus:ring-gray-500'
        );
      case 'outline':
        return cn(
          baseClasses,
          'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50',
          'focus:ring-blue-500'
        );
      default:
        return cn(baseClasses, 'bg-blue-600 text-white hover:bg-blue-700');
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (disabled || loading) return;

    // If onClick prop is provided, call it
    if (onClick) {
      onClick(event);
      return;
    }

    // Otherwise, navigate to the URL
    if (url.startsWith('http')) {
      // External link
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Internal link
      window.location.href = url;
    }
  };

  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;
    if (url.startsWith('http')) {
      return `${text} (opens in new tab)`;
    }
    return text;
  };

  return (
    <Button
      className={getButtonClasses()}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={getAriaLabel()}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {text}
          <Icon className="w-4 h-4" />
        </>
      )}
    </Button>
  );
};

export default CallToAction;