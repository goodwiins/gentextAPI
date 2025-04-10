import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"
import { cn } from "@/context/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
  showLabel?: boolean;
  labelPosition?: 'top' | 'right';
  status?: 'default' | 'success' | 'error' | 'warning';
  animate?: boolean;
}

const statusColors = {
  default: "bg-slate-900 dark:bg-slate-50",
  success: "bg-green-600 dark:bg-green-500",
  error: "bg-red-600 dark:bg-red-500",
  warning: "bg-yellow-600 dark:bg-yellow-500"
};

const ProgressLabel = React.memo<{ value: number | null; position: 'top' | 'right' }>(
  ({ value, position }) => {
    const displayValue = value !== null ? Math.round(value) : 0;
    return (
      <span 
        className={cn(
          "text-sm font-medium text-slate-700 dark:text-slate-200",
          position === 'top' ? "mb-2 block" : "ml-4"
        )}
        role="status"
        aria-label={`Progress: ${displayValue}%`}
      >
        {displayValue}%
      </span>
    );
  }
);
ProgressLabel.displayName = 'ProgressLabel';

const Progress = React.memo<ProgressProps>(
  React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    ProgressProps
  >(({ 
    className, 
    value = 0, 
    indicatorClassName,
    showLabel = false,
    labelPosition = 'right',
    status = 'default',
    animate = true,
    ...props 
  }, ref) => {
    // Ensure value is a number between 0 and 100
    const normalizedValue = value !== null ? Math.min(100, Math.max(0, value)) : 0;

    const containerStyles = cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
      className
    );

    const indicatorStyles = cn(
      "h-full w-full flex-1 transition-all",
      statusColors[status],
      indicatorClassName
    );

    return (
      <div className="flex flex-col">
        {showLabel && labelPosition === 'top' && (
          <ProgressLabel value={value} position="top" />
        )}
        <div className={labelPosition === 'right' ? "flex items-center" : undefined}>
          <ProgressPrimitive.Root
            ref={ref}
            className={containerStyles}
            value={normalizedValue}
            {...props}
          >
            {animate ? (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: `${normalizedValue - 100}%` }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 20,
                  mass: 1
                }}
                className={indicatorStyles}
              />
            ) : (
              <ProgressPrimitive.Indicator
                className={indicatorStyles}
                style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
              />
            )}
          </ProgressPrimitive.Root>
          {showLabel && labelPosition === 'right' && (
            <ProgressLabel value={value} position="right" />
          )}
        </div>
      </div>
    );
  })
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
