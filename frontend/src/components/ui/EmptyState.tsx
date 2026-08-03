import { cn } from '../../utils/cn';
import { FileSearch } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon = <FileSearch className="h-12 w-12 text-muted-foreground opacity-50" />,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50", className)}>
      <div className="mb-4 rounded-full bg-muted p-4">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
