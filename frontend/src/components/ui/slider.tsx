import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
}

const sizeStyles = {
  sm: {
    track: "h-1",
    thumb: "h-3 w-3",
  },
  md: {
    track: "h-1.5",
    thumb: "h-4 w-4",
  },
  lg: {
    track: "h-2",
    thumb: "h-5 w-5",
  },
};

const SliderTooltip = React.memo<{ value: number; formatValue?: (value: number) => string }>(
  ({ value, formatValue }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-primary text-primary-foreground text-xs"
    >
      {formatValue ? formatValue(value) : value}
    </motion.div>
  )
);
SliderTooltip.displayName = 'SliderTooltip';

const Slider = React.memo<SliderProps>(
  React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    SliderProps
  >(({ 
    className, 
    showTooltip = false,
    formatValue,
    size = 'md',
    variant = 'default',
    ...props 
  }, ref) => {
    const [hoveredThumb, setHoveredThumb] = React.useState<number | null>(null);
    const value = Array.isArray(props.value) ? props.value[0] : props.value;
    const styles = sizeStyles[size];

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        onValueChange={(newValue) => {
          props.onValueChange?.(newValue);
          setHoveredThumb(null);
        }}
        {...props}
      >
        <SliderPrimitive.Track 
          className={cn(
            "relative w-full grow overflow-hidden rounded-full",
            styles.track,
            variant === 'default' 
              ? "bg-primary/20" 
              : "bg-gradient-to-r from-primary/20 to-primary/30"
          )}
        >
          <SliderPrimitive.Range 
            className={cn(
              "absolute h-full",
              variant === 'default'
                ? "bg-primary"
                : "bg-gradient-to-r from-primary via-primary/80 to-primary"
            )}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className={cn(
            "block rounded-full border border-primary/50 bg-background shadow transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "hover:scale-110 active:scale-95",
            styles.thumb
          )}
          onMouseEnter={() => setHoveredThumb(0)}
          onMouseLeave={() => setHoveredThumb(null)}
        >
          {showTooltip && hoveredThumb === 0 && (
            <SliderTooltip value={value} formatValue={formatValue} />
          )}
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    );
  })
);

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider }; 