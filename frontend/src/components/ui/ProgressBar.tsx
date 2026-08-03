import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}
        {...props}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";
