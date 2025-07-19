import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-200',
    success: 'bg-success-100 text-success-800 border border-success-200',
    danger: 'bg-danger-100 text-danger-800 border border-danger-200',
    warning: 'bg-warning-100 text-warning-800 border border-warning-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base',
  };

  const roundedClasses = rounded ? 'rounded-full' : 'rounded-md';

  const className = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClasses
  );

  return (
    <span className={className}>
      {children}
    </span>
  );
}