import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="peer sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "block h-6 w-11 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              className
            )}
          ></div>
          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition-transform peer-checked:translate-x-5"></div>
        </div>
        {label && (
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Switch.displayName = "Switch";
