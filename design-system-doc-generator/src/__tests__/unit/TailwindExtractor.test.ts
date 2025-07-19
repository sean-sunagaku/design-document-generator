import { TailwindExtractor } from '../../extractors/TailwindExtractor';
import * as fs from 'fs';
import * as path from 'path';

// Mock TypeScript ESLint
jest.mock('@typescript-eslint/typescript-estree', () => ({
  parseAndGenerateServices: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

// Mock the new architecture modules
jest.mock('../../extractors/ast/ComponentAnalyzer');
jest.mock('../../extractors/ast/ASTTraverser');
jest.mock('../../extractors/ast/TailwindClassExtractor');
jest.mock('../../extractors/ast/PropExtractor');
jest.mock('../../extractors/ast/JSXStructureExtractor');
jest.mock('../../extractors/ast/ComponentCategorizer');

describe('TailwindExtractor', () => {
  let extractor: TailwindExtractor;

  beforeEach(() => {
    extractor = new TailwindExtractor({
      sourceDir: './test-fixtures',
      ignore: ['**/*.test.tsx'],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Mock AST structure
    const mockAst = {
      type: 'Program',
      body: [
        {
          type: 'ExportDefaultDeclaration',
          declaration: {
            type: 'FunctionDeclaration',
            id: { name: 'TestComponent' }
          }
        }
      ]
    };

    const { parseAndGenerateServices } = require('@typescript-eslint/typescript-estree');
    (parseAndGenerateServices as jest.Mock).mockReturnValue({ ast: mockAst });

    // Mock ComponentAnalyzer to return proper result
    const { ComponentAnalyzer } = require('../../extractors/ast/ComponentAnalyzer');
    ComponentAnalyzer.prototype.analyzeFile = jest.fn().mockResolvedValue({
      content: 'mock content',
      ast: mockAst,
      componentName: 'Button',
      isComponentFile: true
    });
  });

  describe('extractFromFile', () => {
    it('should extract static Tailwind classes', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function Button() {
          return (
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Click me
            </button>
          );
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/Button.tsx');

      expect(result).not.toBeNull();
      expect(result?.componentName).toBe('Button');
      expect(result?.tailwindClasses).toContain('bg-blue-500');
      expect(result?.tailwindClasses).toContain('hover:bg-blue-700');
      expect(result?.tailwindClasses).toContain('text-white');
      expect(result?.tailwindClasses).toContain('font-bold');
      expect(result?.tailwindClasses).toContain('py-2');
      expect(result?.tailwindClasses).toContain('px-4');
      expect(result?.tailwindClasses).toContain('rounded');
    });

    it('should extract classes from template literals', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function Card({ active }: { active: boolean }) {
          return (
            <div className={\`bg-white border \${active ? 'border-blue-500' : 'border-gray-300'} rounded-lg p-4\`}>
              Content
            </div>
          );
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/Card.tsx');

      expect(result).not.toBeNull();
      expect(result?.tailwindClasses).toContain('bg-white');
      expect(result?.tailwindClasses).toContain('border');
      expect(result?.tailwindClasses).toContain('border-blue-500');
      expect(result?.tailwindClasses).toContain('border-gray-300');
      expect(result?.tailwindClasses).toContain('rounded-lg');
      expect(result?.tailwindClasses).toContain('p-4');
    });

    it('should extract classes from clsx function calls', async () => {
      const mockContent = `
        import React from 'react';
        import { clsx } from 'clsx';
        
        export default function Button({ variant }: { variant: 'primary' | 'secondary' }) {
          return (
            <button className={clsx(
              'px-4 py-2 rounded',
              variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            )}>
              Button
            </button>
          );
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/Button.tsx');

      expect(result).not.toBeNull();
      expect(result?.tailwindClasses).toContain('px-4');
      expect(result?.tailwindClasses).toContain('py-2');
      expect(result?.tailwindClasses).toContain('rounded');
      expect(result?.tailwindClasses).toContain('bg-blue-500');
      expect(result?.tailwindClasses).toContain('text-white');
      expect(result?.tailwindClasses).toContain('bg-gray-200');
      expect(result?.tailwindClasses).toContain('text-gray-800');
    });

    it('should extract component props', async () => {
      const mockContent = `
        import React from 'react';
        
        interface ButtonProps {
          children: React.ReactNode;
          onClick?: () => void;
          disabled?: boolean;
          variant?: 'primary' | 'secondary';
        }
        
        export default function Button({ 
          children, 
          onClick, 
          disabled = false, 
          variant = 'primary' 
        }: ButtonProps) {
          return (
            <button onClick={onClick} disabled={disabled} className="px-4 py-2">
              {children}
            </button>
          );
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/Button.tsx');

      expect(result).not.toBeNull();
      expect(result?.props).toHaveLength(4);
      
      const childrenProp = result?.props.find(p => p.name === 'children');
      expect(childrenProp).toBeDefined();
      expect(childrenProp?.required).toBe(true);
      
      const onClickProp = result?.props.find(p => p.name === 'onClick');
      expect(onClickProp).toBeDefined();
      expect(onClickProp?.required).toBe(false);
      
      const disabledProp = result?.props.find(p => p.name === 'disabled');
      expect(disabledProp).toBeDefined();
      expect(disabledProp?.required).toBe(false);
      expect(disabledProp?.defaultValue).toBe('false');
      
      const variantProp = result?.props.find(p => p.name === 'variant');
      expect(variantProp).toBeDefined();
      expect(variantProp?.required).toBe(false);
      expect(variantProp?.defaultValue).toBe('primary');
    });

    it('should categorize components correctly', async () => {
      const mockContent = `
        import React from 'react';
        export default function Button() {
          return <button className="px-4 py-2">Button</button>;
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      // Test atoms category
      const atomResult = await extractor.extractFromFile('/test/atoms/Button.tsx');
      expect(atomResult?.category).toBe('atoms');

      // Test molecules category
      const moleculeResult = await extractor.extractFromFile('/test/molecules/Card.tsx');
      expect(moleculeResult?.category).toBe('molecules');

      // Test organisms category
      const organismResult = await extractor.extractFromFile('/test/organisms/Header.tsx');
      expect(organismResult?.category).toBe('organisms');
    });

    it('should return null for non-component files', async () => {
      const mockContent = `
        export const utils = {
          formatDate: (date: Date) => date.toISOString(),
        };
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/utils.ts');
      expect(result).toBeNull();
    });

    it('should handle parsing errors gracefully', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function Button() {
          return <button className="px-4 py-2">Button</button>; // Missing closing brace
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/Button.tsx');
      expect(result).toBeNull();
    });

    it('should ignore non-Tailwind classes', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function Button() {
          return (
            <button className="px-4 py-2 custom-button my-class">
              Button
            </button>
          );
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/Button.tsx');

      expect(result).not.toBeNull();
      expect(result?.tailwindClasses).toContain('px-4');
      expect(result?.tailwindClasses).toContain('py-2');
      expect(result?.tailwindClasses).not.toContain('custom-button');
      expect(result?.tailwindClasses).not.toContain('my-class');
    });

    it('should extract responsive and state classes', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function ResponsiveButton() {
          return (
            <button className="px-4 py-2 sm:px-6 md:px-8 lg:px-10 hover:bg-blue-600 focus:ring-2 dark:bg-gray-800">
              Responsive Button
            </button>
          );
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/ResponsiveButton.tsx');

      expect(result).not.toBeNull();
      expect(result?.tailwindClasses).toContain('px-4');
      expect(result?.tailwindClasses).toContain('py-2');
      expect(result?.tailwindClasses).toContain('sm:px-6');
      expect(result?.tailwindClasses).toContain('md:px-8');
      expect(result?.tailwindClasses).toContain('lg:px-10');
      expect(result?.tailwindClasses).toContain('hover:bg-blue-600');
      expect(result?.tailwindClasses).toContain('focus:ring-2');
      expect(result?.tailwindClasses).toContain('dark:bg-gray-800');
    });
  });
});