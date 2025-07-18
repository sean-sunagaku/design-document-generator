import React from 'react';
import { clsx } from 'clsx';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  navigation?: NavigationItem[];
  showNotification?: boolean;
  notificationCount?: number;
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
}

export default function Header({
  title,
  subtitle,
  actions,
  navigation,
  showNotification = false,
  notificationCount = 0,
  user,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-secondary-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-secondary-900">
                {title}
                {subtitle && (
                  <span className="ml-2 text-sm font-normal text-secondary-500">
                    {subtitle}
                  </span>
                )}
              </h1>
            </div>
            
            {navigation && (
              <nav className="hidden md:flex space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={clsx(
                      'text-sm font-medium transition-colors duration-200',
                      item.active
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-secondary-500 hover:text-secondary-700'
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
          </div>

          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {showNotification && (
              <div className="relative">
                <button className="p-2 text-secondary-400 hover:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </button>
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="danger" size="sm" rounded>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  </div>
                )}
              </div>
            )}
            
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar}
                      alt={user.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-secondary-900">
                    {user.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}