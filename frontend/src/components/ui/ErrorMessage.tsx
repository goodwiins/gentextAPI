import React from 'react';
import { Button } from '@/components/ui/button';

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
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  description,
  actions = [],
}) => {
  return (
    <div className="py-8 space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
        <h3 className="font-medium text-red-800 dark:text-red-400">{title}</h3>
        <p className="text-red-700 dark:text-red-300 mt-1">{message}</p>
        {description && (
          <p className="text-red-600 dark:text-red-400 mt-2">{description}</p>
        )}
      </div>
      
      {actions.length > 0 && (
        <div className="flex flex-wrap space-x-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="mt-2"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorMessage; 