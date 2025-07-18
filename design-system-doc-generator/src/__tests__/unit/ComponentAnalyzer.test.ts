import { ComponentAnalyzer } from '../../extractors/ast/ComponentAnalyzer';
import * as fs from 'fs';

// Mock TypeScript ESLint
const mockParseAndGenerateServices = jest.fn();
jest.mock('@typescript-eslint/typescript-estree', () => ({
  parseAndGenerateServices: mockParseAndGenerateServices,
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('ComponentAnalyzer', () => {
  let analyzer: ComponentAnalyzer;

  beforeEach(() => {
    analyzer = new ComponentAnalyzer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeFile', () => {
    it('should analyze a React component file', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function Button() {
          return <button className="px-4 py-2">Click me</button>;
        }
      `;

      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'ExportDefaultDeclaration',
            declaration: {
              type: 'FunctionDeclaration',
              id: { name: 'Button' }
            }
          }
        ]
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      mockParseAndGenerateServices.mockReturnValue({ ast: mockAst });

      const result = await analyzer.analyzeFile('/test/Button.tsx');

      expect(result.content).toBe(mockContent);
      expect(result.ast).toBe(mockAst);
      expect(result.componentName).toBe('Button');
      expect(result.isComponentFile).toBe(true);
    });

    it('should identify non-component files', async () => {
      const mockContent = `
        export const utils = {
          formatDate: (date: Date) => date.toISOString(),
        };
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/utils.ts');

      expect(result.content).toBe(mockContent);
      expect(result.ast).toBeNull();
      expect(result.componentName).toBeNull();
      expect(result.isComponentFile).toBe(false);
    });

    it('should extract component name from default export', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function MyComponent() {
          return <div>Hello</div>;
        }
      `;

      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'ExportDefaultDeclaration',
            declaration: {
              type: 'FunctionDeclaration',
              id: { name: 'MyComponent' }
            }
          }
        ]
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      mockParseAndGenerateServices.mockReturnValue({ ast: mockAst });

      const result = await analyzer.analyzeFile('/test/MyComponent.tsx');

      expect(result.componentName).toBe('MyComponent');
    });

    it('should extract component name from named export', async () => {
      const mockContent = `
        import React from 'react';
        
        export function Button() {
          return <button>Click me</button>;
        }
      `;

      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'FunctionDeclaration',
              id: { name: 'Button' }
            }
          }
        ]
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      mockParseAndGenerateServices.mockReturnValue({ ast: mockAst });

      const result = await analyzer.analyzeFile('/test/Button.tsx');

      expect(result.componentName).toBe('Button');
    });

    it('should fallback to filename for component name', async () => {
      const mockContent = `
        import React from 'react';
        
        export default function() {
          return <div>Anonymous</div>;
        }
      `;

      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'ExportDefaultDeclaration',
            declaration: {
              type: 'FunctionDeclaration',
              id: null
            }
          }
        ]
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      mockParseAndGenerateServices.mockReturnValue({ ast: mockAst });

      const result = await analyzer.analyzeFile('/test/MyButton.tsx');

      expect(result.componentName).toBe('MyButton');
    });

    it('should handle variable declarations', async () => {
      const mockContent = `
        import React from 'react';
        
        const Button = () => {
          return <button>Click me</button>;
        };
        
        export default Button;
      `;

      const mockAst = {
        type: 'Program',
        body: [
          {
            type: 'ExportDefaultDeclaration',
            declaration: {
              type: 'Identifier',
              name: 'Button'
            }
          }
        ]
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      mockParseAndGenerateServices.mockReturnValue({ ast: mockAst });

      const result = await analyzer.analyzeFile('/test/Button.tsx');

      expect(result.componentName).toBe('Button');
    });

    it('should identify component files by React patterns', async () => {
      const componentContent = `
        import React from 'react';
        
        export default function Component() {
          return <div>Hello</div>;
        }
      `;

      const utilContent = `
        export const helper = () => {
          return 'helper';
        };
      `;

      // Test component file
      (fs.promises.readFile as jest.Mock).mockResolvedValue(componentContent);
      const componentResult = await analyzer.analyzeFile('/test/Component.tsx');
      expect(componentResult.isComponentFile).toBe(true);

      // Test utility file
      (fs.promises.readFile as jest.Mock).mockResolvedValue(utilContent);
      const utilResult = await analyzer.analyzeFile('/test/utils.ts');
      expect(utilResult.isComponentFile).toBe(false);
    });

    it('should reject files without valid extensions', async () => {
      const mockContent = `
        import React from 'react';
        export default function Component() {
          return <div>Hello</div>;
        }
      `;

      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await analyzer.analyzeFile('/test/Component.py');
      expect(result.isComponentFile).toBe(false);
    });
  });
});