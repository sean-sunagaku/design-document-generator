import React from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'soft' | 'medium' | 'hard';
  rounded?: boolean;
  hoverable?: boolean;
}

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = 'soft',
  rounded = true,
  hoverable = false,
}: CardProps) {
  const baseClasses = 'bg-white border border-secondary-200';
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    hard: 'shadow-hard',
  };

  const cardClassName = clsx(
    baseClasses,
    paddingClasses[padding],
    shadowClasses[shadow],
    rounded && 'rounded-xl',
    hoverable && 'hover:shadow-medium transition-shadow duration-200 cursor-pointer',
    className
  );

  return (
    <div className={cardClassName}>
      {children}
    </div>
  );
}