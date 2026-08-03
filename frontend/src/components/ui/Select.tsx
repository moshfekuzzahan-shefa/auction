import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
