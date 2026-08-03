import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

export const Tabs = ({ defaultValue, className, children }: TabsProps) => {
  return (
    <div className={cn("w-full", className)} data-active={defaultValue}>
      {children}
    </div>
  );
};

export const TabsList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)} {...props} />
));
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  active?: boolean;
  onTabChange?: (val: string) => void;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(({ className, value, active, onTabChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={() => onTabChange?.(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  active?: boolean;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(({ className, value, active, ...props }, ref) => {
  if (!active) return null;
  return (
    <div
      ref={ref}
      className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";
