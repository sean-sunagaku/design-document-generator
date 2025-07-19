import React from 'react';
import { clsx } from 'clsx';

export interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export default function Input({
  id,
  name,
  type = 'text',
  value,
  placeholder,
  disabled = false,
  required = false,
  error = false,
  size = 'md',
  fullWidth = false,
  onChange,
  onFocus,
  onBlur,
}: InputProps) {
  const baseClasses = 'border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const stateClasses = error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 bg-danger-50'
    : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500 bg-white hover:border-secondary-400';

  const className = clsx(
    baseClasses,
    sizeClasses[size],
    stateClasses,
    fullWidth && 'w-full',
    disabled && 'cursor-not-allowed opacity-50 bg-secondary-50'
  );

  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={className}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}