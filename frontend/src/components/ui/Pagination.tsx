import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export const Pagination = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);

export const PaginationContent = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

export const PaginationItem = forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
};

export const PaginationButton = ({ className, isActive, ...props }: PaginationButtonProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9",
      isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
);

export const PaginationPrevious = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <PaginationButton className={cn("gap-1 pl-2.5", className)} {...props}>
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Previous</span>
  </PaginationButton>
);

export const PaginationNext = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <PaginationButton className={cn("gap-1 pr-2.5", className)} {...props}>
    <span className="sr-only">Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationButton>
);

export const PaginationEllipsis = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
