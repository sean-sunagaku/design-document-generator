import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  rounded?: boolean;
}

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = true,
  rounded = true,
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-gray-200',
        {
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
          'shadow-sm': shadow,
          'rounded-lg': rounded,
        },
        className
      )}
    >
      {children}
    </div>
  );
}