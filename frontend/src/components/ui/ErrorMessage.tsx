import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  icon?: React.ReactNode;
}

interface ErrorMessageProps {
  title?: string;
  message: string;
  description?: string;
  actions?: ActionButton[];
  onClose?: () => void;
  role?: 'alert' | 'status';
  severity?: 'error' | 'warning';
}

const ErrorAction = memo<ActionButton>(({ label, onClick, variant = 'default', icon }) => (
  <Button
    variant={variant}
    onClick={onClick}
    className="mt-2 transition-all duration-200 hover:scale-102 active:scale-98"
  >
    {icon && <span className="mr-2">{icon}</span>}
    {label}
  </Button>
));
ErrorAction.displayName = 'ErrorAction';

const ErrorContent = memo<{ title: string; message: string; description?: string; severity: 'error' | 'warning' }>(
  ({ title, message, description, severity }) => {
    const colors = {
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        title: 'text-red-800 dark:text-red-400',
        message: 'text-red-700 dark:text-red-300',
        description: 'text-red-600 dark:text-red-400'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-700',
        title: 'text-yellow-800 dark:text-yellow-400',
        message: 'text-yellow-700 dark:text-yellow-300',
        description: 'text-yellow-600 dark:text-yellow-400'
      }
    };

    const color = colors[severity];

    return (
      <div className={`${color.bg} border ${color.border} p-4 rounded-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className={`h-5 w-5 ${color.title}`} />
          </div>
          <div className="ml-3">
            <h3 className={`font-medium ${color.title}`}>{title}</h3>
            <p className={`${color.message} mt-1`}>{message}</p>
            {description && (
              <p className={`${color.description} mt-2 text-sm`}>{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ErrorContent.displayName = 'ErrorContent';

export const ErrorMessage = memo<ErrorMessageProps>(({
  title = 'Error',
  message,
  description,
  actions = [],
  onClose,
  role = 'alert',
  severity = 'error'
}) => {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="py-8 space-y-4"
        role={role}
        aria-live={role === 'alert' ? 'assertive' : 'polite'}
      >
        <ErrorContent 
          title={title}
          message={message}
          description={description}
          severity={severity}
        />
        
        {actions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-3"
          >
            {actions.map((action, index) => (
              <ErrorAction key={index} {...action} />
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage; 