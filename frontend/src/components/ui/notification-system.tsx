import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/Icons';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove if not persistent
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    // Also show as toast for immediate feedback
    const emoji = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[notification.type];

    toast(notification.title, {
      icon: emoji,
      duration: 3000,
    });
  }, [removeNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-3">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRemove={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onRemove: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRemove }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <Icons.PlusCircle />;
      case 'error':
        return <Icons.AlertCircle />;
      case 'warning':
        return <Icons.AlertCircle />;
      case 'info':
        return <Icons.Settings />;
      default:
        return <Icons.Settings />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-orange-200';
      case 'info':
        return 'border-blue-200';
      default:
        return 'border-gray-200';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50/90';
      case 'error':
        return 'bg-red-50/90';
      case 'warning':
        return 'bg-orange-50/90';
      case 'info':
        return 'bg-blue-50/90';
      default:
        return 'bg-white/90';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      layout
    >
      <Card className={`glass ${getBorderColor()} ${getBackgroundColor()} p-4 shadow-lg`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            
            {notification.action && (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={notification.action.onClick}
                  className="text-xs"
                >
                  {notification.action.label}
                </Button>
              </div>
            )}
          </div>
          
          <button
            onClick={onRemove}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
          >
            <Icons.Trash />
          </button>
        </div>
      </Card>
    </motion.div>
  );
};

// Enhanced toast helper hook for better UX
export const useEnhancedToast = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message?: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'success',
        title,
        message: message || '',
        action,
      });
    },

    error: (title: string, message?: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'error',
        title,
        message: message || '',
        action,
        persistent: true, // Errors should be persistent
      });
    },

    warning: (title: string, message?: string) => {
      addNotification({
        type: 'warning',
        title,
        message: message || '',
        duration: 7000, // Warnings stay longer
      });
    },

    info: (title: string, message?: string) => {
      addNotification({
        type: 'info',
        title,
        message: message || '',
      });
    },

    // Contextual notifications for auth
    authSuccess: (action: 'login' | 'logout' | 'signup') => {
      const messages = {
        login: { title: 'Welcome back!', message: 'You\'ve been successfully signed in.' },
        logout: { title: 'See you later!', message: 'You\'ve been successfully signed out.' },
        signup: { title: 'Welcome aboard!', message: 'Your account has been created successfully.' },
      };
      
      addNotification({
        type: 'success',
        ...messages[action],
      });
    },

    authError: (error: string, action?: { label: string; onClick: () => void }) => {
      addNotification({
        type: 'error',
        title: 'Authentication Error',
        message: error,
        action,
        persistent: true,
      });
    },

    // Quiz-specific notifications
    quizGenerated: (questionCount: number) => {
      addNotification({
        type: 'success',
        title: 'Quiz Generated!',
        message: `Successfully created ${questionCount} questions from your text.`,
      });
    },

    quizSaved: (title: string) => {
      addNotification({
        type: 'success',
        title: 'Quiz Saved!',
        message: `"${title}" has been saved to your history.`,
        action: {
          label: 'View History',
          onClick: () => window.location.href = '/history'
        }
      });
    },

    networkError: () => {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        },
        persistent: true,
      });
    }
  };
};