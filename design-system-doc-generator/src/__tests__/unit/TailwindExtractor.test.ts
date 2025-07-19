import { TailwindExtractor } from '../../extractors/TailwindExtractor';
import * as fs from 'fs';

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

// Mock ConfigManager
jest.mock('../../config/ConfigManager', () => ({
  ConfigManager: {
    getInstance: jest.fn(() => ({
      getConfig: jest.fn(() => ({
        styleSystem: 'tailwind',
        platform: 'web',
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx']
      }))
    }))
  }
}));

// Mock the new architecture modules
jest.mock('../../extractors/ast/ComponentAnalyzer', () => ({
  ComponentAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeFile: jest.fn()
  }))
}));
jest.mock('../../extractors/ast/ASTTraverser', () => ({
  ASTTraverser: jest.fn().mockImplementation(() => ({
    traverse: jest.fn()
  }))
}));
jest.mock('../../extractors/ast/TailwindClassExtractor', () => ({
  TailwindClassExtractor: jest.fn().mockImplementation(() => ({
    extractClasses: jest.fn()
  }))
}));
jest.mock('../../extractors/ast/PropExtractor', () => ({
  PropExtractor: jest.fn().mockImplementation(() => ({
    extractProps: jest.fn()
  }))
}));
jest.mock('../../extractors/ast/JSXStructureExtractor', () => ({
  JSXStructureExtractor: jest.fn().mockImplementation(() => ({
    extractJSXStructure: jest.fn()
  }))
}));
jest.mock('../../extractors/ast/ComponentCategorizer', () => ({
  ComponentCategorizer: jest.fn().mockImplementation(() => ({
    categorizeComponent: jest.fn()
  }))
}));
jest.mock('../../extractors/StyleExtractorFactory', () => ({
  StyleExtractorFactory: {
    createExtractor: jest.fn(() => ({
      extractStyles: jest.fn(() => [])
    }))
  }
}));

describe('TailwindExtractor', () => {
  let extractor: TailwindExtractor;

  beforeEach(() => {
    extractor = new TailwindExtractor({
      sourceDir: './test-fixtures',
      ignore: ['**/*.test.tsx'],
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

      // Get the mocked classes
      const { ComponentAnalyzer } = require('../../extractors/ast/ComponentAnalyzer');
      const { ASTTraverser } = require('../../extractors/ast/ASTTraverser');
      const { TailwindClassExtractor } = require('../../extractors/ast/TailwindClassExtractor');
      const { ComponentCategorizer } = require('../../extractors/ast/ComponentCategorizer');

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Button',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXAttribute',
            name: { name: 'className' },
            value: { type: 'Literal', value: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' }
          });
        }
        if (callbacks.onProp) {
          callbacks.onProp({
            name: 'children',
            type: 'React.ReactNode',
            required: true,
            description: 'Button content'
          });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue([
        'bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded'
      ]);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue(undefined);

      const result = await freshExtractor.extractFromFile('/test/Button.tsx');

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

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Card',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXAttribute',
            name: { name: 'className' },
            value: { type: 'TemplateLiteral', quasis: [{ value: { raw: 'bg-white border border-blue-500 border-gray-300 rounded-lg p-4' } }] }
          });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue([
        'bg-white', 'border', 'border-blue-500', 'border-gray-300', 'rounded-lg', 'p-4'
      ]);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue(undefined);

      const result = await freshExtractor.extractFromFile('/test/Card.tsx');

      expect(result).not.toBeNull();
      expect(result?.componentName).toBe('Card');
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

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Button',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXExpressionContainer',
            expression: {
              type: 'CallExpression',
              callee: { name: 'clsx' },
              arguments: [
                { type: 'Literal', value: 'px-4 py-2 rounded' },
                { type: 'ConditionalExpression' }
              ]
            }
          });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
          callbacks.onImport('clsx');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue([
        'px-4', 'py-2', 'rounded', 'bg-blue-500', 'text-white', 'bg-gray-200', 'text-gray-800'
      ]);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue(undefined);

      const result = await freshExtractor.extractFromFile('/test/Button.tsx');

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

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Button',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXAttribute',
            name: { name: 'className' },
            value: { type: 'Literal', value: 'px-4 py-2' }
          });
        }
        if (callbacks.onProp) {
          callbacks.onProp({ name: 'children', type: 'React.ReactNode', required: true, description: 'Button content' });
          callbacks.onProp({ name: 'onClick', type: '() => void', required: false, description: 'Click handler' });
          callbacks.onProp({ name: 'disabled', type: 'boolean', required: false, defaultValue: 'false', description: 'Disabled state' });
          callbacks.onProp({ name: 'variant', type: 'primary | secondary', required: false, defaultValue: 'primary', description: 'Button variant' });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue(['px-4', 'py-2']);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue(undefined);

      const result = await freshExtractor.extractFromFile('/test/Button.tsx');

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

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Button',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXAttribute',
            name: { name: 'className' },
            value: { type: 'Literal', value: 'px-4 py-2' }
          });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue(['px-4', 'py-2']);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockImplementation((filePath) => {
        if (filePath.includes('/atoms/')) return 'atoms';
        if (filePath.includes('/molecules/')) return 'molecules';
        if (filePath.includes('/organisms/')) return 'organisms';
        return undefined;
      });

      // Test atoms category
      const atomResult = await freshExtractor.extractFromFile('/test/atoms/Button.tsx');
      expect(atomResult?.category).toBe('atoms');

      // Test molecules category
      const moleculeResult = await freshExtractor.extractFromFile('/test/molecules/Card.tsx');
      expect(moleculeResult?.category).toBe('molecules');

      // Test organisms category
      const organismResult = await freshExtractor.extractFromFile('/test/organisms/Header.tsx');
      expect(organismResult?.category).toBe('organisms');
    });

    it('should return null for non-component files', async () => {
      const mockContent = `
        export const utils = {
          formatDate: (date: Date) => date.toISOString(),
        };
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: null,
        isComponentFile: false
      });

      const result = await freshExtractor.extractFromFile('/test/utils.ts');
      expect(result).toBeNull();
    });

    it('should handle parsing errors gracefully', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function Button() {
          return <button className="px-4 py-2">Button</button>; // Missing closing brace
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      // Setup mocks for parsing error
      const { ComponentAnalyzer } = require('../../extractors/ast/ComponentAnalyzer');

      ComponentAnalyzer.prototype.analyzeFile = jest.fn().mockRejectedValue(
        new Error('SyntaxError: Unexpected end of file')
      );

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

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Button',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXAttribute',
            name: { name: 'className' },
            value: { type: 'Literal', value: 'px-4 py-2 custom-button my-class' }
          });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
        }
      });

      // Only return Tailwind classes, filtering out custom ones
      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue(['px-4', 'py-2']);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue(undefined);

      const result = await freshExtractor.extractFromFile('/test/Button.tsx');

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

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'ResponsiveButton',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onClassName) {
          callbacks.onClassName({
            type: 'JSXAttribute',
            name: { name: 'className' },
            value: { type: 'Literal', value: 'px-4 py-2 sm:px-6 md:px-8 lg:px-10 hover:bg-blue-600 focus:ring-2 dark:bg-gray-800' }
          });
        }
        if (callbacks.onImport) {
          callbacks.onImport('react');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue([
        'px-4', 'py-2', 'sm:px-6', 'md:px-8', 'lg:px-10', 'hover:bg-blue-600', 'focus:ring-2', 'dark:bg-gray-800'
      ]);

      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue(undefined);

      const result = await freshExtractor.extractFromFile('/test/ResponsiveButton.tsx');

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

    it('should handle React Native StyleSheet extraction', async () => {
      const mockContent = `
        import React from 'react';
        import { View, Text, StyleSheet } from 'react-native';
        
        export default function Button() {
          return (
            <View style={styles.container}>
              <Text style={styles.text}>Button</Text>
            </View>
          );
        }

        const styles = StyleSheet.create({
          container: {
            padding: 16,
            backgroundColor: '#3B82F6',
            borderRadius: 6,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '600',
          },
        });
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      // Mock ConfigManager to return React Native config
      const mockConfigManager = require('../../config/ConfigManager').ConfigManager.getInstance();
      mockConfigManager.getConfig.mockReturnValue({
        styleSystem: 'stylesheet',
        platform: 'react-native',
        sourceDir: './test-fixtures',
        ignore: []
      });

      // Mock StyleExtractorFactory to return React Native styles
      const { StyleExtractorFactory } = require('../../extractors/StyleExtractorFactory');
      StyleExtractorFactory.createExtractor.mockReturnValue({
        extractStyles: jest.fn().mockReturnValue([
          {
            type: 'stylesheet',
            value: {
              container: { padding: 16, backgroundColor: '#3B82F6', borderRadius: 6 },
              text: { color: '#FFFFFF', fontWeight: '600' }
            },
            imports: ['StyleSheet'],
            source: 'StyleSheet.create()'
          }
        ])
      });

      // Create a fresh extractor instance after setting up mocks
      const freshExtractor = new TailwindExtractor({
        sourceDir: './test-fixtures',
        ignore: ['**/*.test.tsx'],
      });

      // Mock the instance methods
      freshExtractor['componentAnalyzer'].analyzeFile = jest.fn().mockResolvedValue({
        content: mockContent,
        ast: { type: 'Program', body: [] },
        componentName: 'Button',
        isComponentFile: true
      });

      freshExtractor['astTraverser'].traverse = jest.fn().mockImplementation((ast, callbacks) => {
        if (callbacks.onImport) {
          callbacks.onImport('react');
          callbacks.onImport('react-native');
        }
      });

      freshExtractor['tailwindExtractor'].extractClasses = jest.fn().mockReturnValue([]);
      freshExtractor['categorizer'].categorizeComponent = jest.fn().mockReturnValue('atoms');

      const result = await freshExtractor.extractFromFile('/test/Button.tsx');

      expect(result).not.toBeNull();
      expect(result?.componentName).toBe('Button');
      expect(result?.styleInfo.type).toBe('stylesheet');
      expect(result?.styleInfo.styles).toEqual({
        container: { padding: 16, backgroundColor: '#3B82F6', borderRadius: 6 },
        text: { color: '#FFFFFF', fontWeight: '600' }
      });
      expect(result?.styleInfo.imports).toContain('StyleSheet');
    });
  });
});