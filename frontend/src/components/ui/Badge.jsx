import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ className, variant = 'default', children }) => {
  const variants = {
    default: 'bg-primary text-primary-foreground border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    destructive: 'bg-destructive text-destructive-foreground border-transparent',
    outline: 'text-foreground border-border',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
};

export default Badge;
