import React from 'react';

interface TestComponentProps {
  title: string;
  count?: number;
}

export default function TestComponent({ title, count = 0 }: TestComponentProps) {
  return (
    <div className="bg-blue-500 p-4 rounded-lg">
      <h2 className="text-white text-xl font-bold">{title}</h2>
      <p className="text-gray-100 mt-2">Count: {count}</p>
      <button className="bg-white text-blue-500 px-4 py-2 rounded mt-4">
        Click me
      </button>
    </div>
  );
}