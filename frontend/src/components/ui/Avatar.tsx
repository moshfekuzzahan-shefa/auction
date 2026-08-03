import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = 'Avatar', fallback, size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-muted",
          {
            "h-8 w-8 text-xs": size === 'sm',
            "h-10 w-10 text-sm": size === 'md',
            "h-12 w-12 text-base": size === 'lg',
            "h-16 w-16 text-lg": size === 'xl',
          },
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-secondary-foreground font-medium">
            {fallback || alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
