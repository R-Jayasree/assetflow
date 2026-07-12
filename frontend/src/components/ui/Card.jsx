import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('card', className)} {...props}>{children}</div>
));
Card.displayName = 'Card';

export const CardHeader = ({ className, children }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)}>{children}</div>
);

export const CardTitle = ({ className, children }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>{children}</h3>
);

export const CardDescription = ({ className, children }) => (
  <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
);

export const CardContent = ({ className, children }) => (
  <div className={cn('p-6 pt-0', className)}>{children}</div>
);

export const CardFooter = ({ className, children }) => (
  <div className={cn('flex items-center p-6 pt-0', className)}>{children}</div>
);
