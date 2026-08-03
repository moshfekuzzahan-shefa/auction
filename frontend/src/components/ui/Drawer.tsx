import { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'left' | 'right' | 'top' | 'bottom';
  children: React.ReactNode;
}

export const Drawer = ({ open, children }: DrawerProps) => {
  if (!open) return null;
  return <>{children}</>;
};

export const DrawerContent = forwardRef<HTMLDivElement, DrawerProps>(
  ({ className, children, open, onOpenChange, side = 'right', ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement>).current = node;
    };

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && onOpenChange) onOpenChange(false);
      };
      if (open) {
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [open, onOpenChange]);

    if (!open) return null;

    const variants = {
      top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
      left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
    };

    return createPortal(
      <div className="fixed inset-0 z-50 flex">
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
          onClick={() => onOpenChange?.(false)}
        />
        <div
          ref={combinedRef}
          className={cn(
            "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-300",
            variants[side],
            className
          )}
          {...props}
        >
          {children}
          <button
            onClick={() => onOpenChange?.(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>,
      document.body
    );
  }
);
DrawerContent.displayName = "DrawerContent";

export const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

export const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

export const DrawerTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
));
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DrawerDescription.displayName = "DrawerDescription";
