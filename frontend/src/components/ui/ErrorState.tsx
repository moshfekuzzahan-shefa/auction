import { cn } from '../../utils/cn';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  className
}: ErrorStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50 rounded-lg border border-destructive/20 bg-destructive/5", className)}>
      <AlertCircle className="h-10 w-10 text-destructive mb-3" />
      <h3 className="mb-1 text-lg font-semibold text-destructive">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="bg-background">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
};
