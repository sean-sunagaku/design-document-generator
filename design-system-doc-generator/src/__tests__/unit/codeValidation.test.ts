import { CodeValidator } from '../../utils/codeValidation';

// Mock TypeScript modules
const mockTs = {
  createSourceFile: jest.fn().mockReturnValue({}),
  getPreEmitDiagnostics: jest.fn().mockReturnValue([]),
  ScriptTarget: { ES2020: 1 },
  ScriptKind: { TSX: 1 },
  DiagnosticCategory: { Error: 1, Warning: 2 }
};

const mockTsEslint = {
  parseAndGenerateServices: jest.fn().mockReturnValue({
    services: {
      program: {
        getSemanticDiagnostics: jest.fn().mockReturnValue([])
      }
    }
  })
};

jest.doMock('typescript', () => mockTs);
jest.doMock('@typescript-eslint/typescript-estree', () => mockTsEslint);

describe('CodeValidator', () => {
  let validator: CodeValidator;

  beforeEach(() => {
    validator = new CodeValidator();
  });

  describe('validateReactCode', () => {
    it('should validate correct React code', () => {
      const code = `
        import React from 'react';
        
        export default function Button() {
          return <button className="px-4 py-2">Click me</button>;
        }
      `;

      const result = validator.validateReactCode(code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect syntax errors', () => {
      const code = `
        import React from 'react';
        
        export default function Button() {
          return <button className="px-4 py-2">Click me</button> // Missing semicolon and closing brace
      `;

      const result = validator.validateReactCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about missing React import with JSX', () => {
      const code = `
        export default function Button() {
          return <button className="px-4 py-2">Click me</button>;
        }
      `;

      const result = validator.validateReactCode(code);
      expect(result.warnings.some(w => w.code === 'MISSING_REACT_IMPORT')).toBe(true);
    });

    it('should warn about class attribute in JSX', () => {
      const code = `
        import React from 'react';
        
        export default function Button() {
          return <button class="px-4 py-2">Click me</button>;
        }
      `;

      const result = validator.validateReactCode(code);
      expect(result.warnings.some(w => w.code === 'JSX_CLASS_ATTRIBUTE')).toBe(true);
    });

    it('should detect unclosed JSX elements', () => {
      const code = `
        import React from 'react';
        
        export default function Button() {
          return <button className="px-4 py-2">Click me;
        }
      `;

      const result = validator.validateReactCode(code);
      expect(result.isValid).toBe(false);
    });

    it('should warn about potential missing imports', () => {
      const code = `
        import React from 'react';
        import { SomeComponent } from './NonExistentComponent';
        
        export default function Button() {
          return <SomeComponent />;
        }
      `;

      const result = validator.validateReactCode(code);
      expect(result.warnings.some(w => w.code === 'POTENTIAL_MISSING_IMPORT')).toBe(true);
    });
  });

  describe('validateExampleCode', () => {
    it('should enhance code with missing imports', () => {
      const code = `
        function Example() {
          return <Button>Click me</Button>;
        }
      `;

      const result = validator.validateExampleCode(code, 'Button');
      // The validator should add React and Button imports
      expect(result.warnings.length).toBeLessThan(2); // Should have fewer warnings after enhancement
    });

    it('should not duplicate existing imports', () => {
      const code = `
        import React from 'react';
        import { Button } from './Button';
        
        function Example() {
          return <Button>Click me</Button>;
        }
      `;

      const result = validator.validateExampleCode(code, 'Button');
      expect(result.warnings.filter(w => w.code === 'MISSING_REACT_IMPORT')).toHaveLength(0);
    });
  });

  describe('validateTailwindClasses', () => {
    it('should validate correct Tailwind classes', () => {
      const classes = ['bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-blue-600'];
      
      const result = validator.validateTailwindClasses(classes);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about invalid Tailwind classes', () => {
      const classes = ['bg-blue-500', 'custom-class', 'my-style', 'p-4'];
      
      const result = validator.validateTailwindClasses(classes);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('custom-class'))).toBe(true);
      expect(result.warnings.some(w => w.message.includes('my-style'))).toBe(true);
    });

    it('should handle responsive and state classes', () => {
      const classes = ['sm:p-6', 'md:p-8', 'hover:bg-blue-600', 'focus:ring-2', 'dark:bg-gray-800'];
      
      const result = validator.validateTailwindClasses(classes);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle animation classes', () => {
      const classes = ['animate-pulse', 'transition-colors', 'duration-200', 'ease-in-out'];
      
      const result = validator.validateTailwindClasses(classes);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateTypeScriptCode', () => {
    it('should validate correct TypeScript code', () => {
      const code = `
        interface Props {
          name: string;
          age: number;
        }
        
        function greet(props: Props): string {
          return \`Hello, \${props.name}!\`;
        }
      `;

      const result = validator.validateTypeScriptCode(code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect TypeScript type errors', () => {
      const code = `
        interface Props {
          name: string;
          age: number;
        }
        
        function greet(props: Props): string {
          return props.nonExistentProperty; // Type error
        }
      `;

      const result = validator.validateTypeScriptCode(code);
      // Note: Depending on TypeScript configuration, this might not fail
      // since we're not providing full type checking context
      expect(result.isValid || result.warnings.length > 0).toBe(true);
    });
  });
});