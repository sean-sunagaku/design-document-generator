import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button 
      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
      onClick={onClick}
    >
      {children}
    </button>
  );
};