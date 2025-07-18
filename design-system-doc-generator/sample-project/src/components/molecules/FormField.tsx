import React from 'react';
import { clsx } from 'clsx';
import Input, { InputProps } from '../atoms/Input';

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export default function FormField({
  label,
  error,
  helper,
  required,
  id,
  ...inputProps
}: FormFieldProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className={clsx(
            'block text-sm font-medium text-secondary-700',
            required && 'after:content-["*"] after:ml-0.5 after:text-danger-500'
          )}
        >
          {label}
        </label>
      )}
      
      <Input
        id={inputId}
        error={!!error}
        required={required}
        {...inputProps}
      />
      
      {error && (
        <p className="text-sm text-danger-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p className="text-sm text-secondary-500">
          {helper}
        </p>
      )}
    </div>
  );
}