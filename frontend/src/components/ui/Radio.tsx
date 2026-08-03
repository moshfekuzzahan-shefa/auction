import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-primary",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";
