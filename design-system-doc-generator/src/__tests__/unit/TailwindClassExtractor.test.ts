import { TailwindClassExtractor } from '../../extractors/ast/TailwindClassExtractor';

describe('TailwindClassExtractor', () => {
  let extractor: TailwindClassExtractor;

  beforeEach(() => {
    extractor = new TailwindClassExtractor();
  });

  describe('extractClasses', () => {
    it('should extract classes from string literals', () => {
      const node = {
        type: 'Literal',
        value: 'bg-blue-500 text-white p-4 rounded'
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('bg-blue-500');
      expect(classes).toContain('text-white');
      expect(classes).toContain('p-4');
      expect(classes).toContain('rounded');
    });

    it('should extract classes from template literals', () => {
      const node = {
        type: 'TemplateLiteral',
        quasis: [
          { value: { raw: 'bg-white border ' } },
          { value: { raw: ' rounded-lg p-4' } }
        ]
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('bg-white');
      expect(classes).toContain('border');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('p-4');
    });

    it('should extract classes from clsx calls', () => {
      const node = {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'clsx' },
          arguments: [
            { type: 'Literal', value: 'px-4 py-2' },
            { type: 'Literal', value: 'bg-blue-500' }
          ]
        }
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
      expect(classes).toContain('bg-blue-500');
    });

    it('should extract classes from object expressions in clsx', () => {
      const node = {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'clsx' },
          arguments: [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  type: 'Property',
                  key: { type: 'Literal', value: 'bg-red-500' }
                },
                {
                  type: 'Property',
                  key: { type: 'Literal', value: 'text-white' }
                }
              ]
            }
          ]
        }
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('bg-red-500');
      expect(classes).toContain('text-white');
    });

    it('should handle array expressions in clsx', () => {
      const node = {
        type: 'JSXExpressionContainer',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'clsx' },
          arguments: [
            {
              type: 'ArrayExpression',
              elements: [
                { type: 'Literal', value: 'flex' },
                { type: 'Literal', value: 'items-center' }
              ]
            }
          ]
        }
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('flex');
      expect(classes).toContain('items-center');
    });

    it('should filter out non-Tailwind classes', () => {
      const node = {
        type: 'Literal',
        value: 'bg-blue-500 custom-class my-style p-4'
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('bg-blue-500');
      expect(classes).toContain('p-4');
      expect(classes).not.toContain('custom-class');
      expect(classes).not.toContain('my-style');
    });

    it('should handle responsive and state classes', () => {
      const node = {
        type: 'Literal',
        value: 'p-4 sm:p-6 md:p-8 hover:bg-blue-600 focus:ring-2 dark:bg-gray-800'
      };

      const classes = extractor.extractClasses(node);
      expect(classes).toContain('p-4');
      expect(classes).toContain('sm:p-6');
      expect(classes).toContain('md:p-8');
      expect(classes).toContain('hover:bg-blue-600');
      expect(classes).toContain('focus:ring-2');
      expect(classes).toContain('dark:bg-gray-800');
    });
  });

  describe('isTailwindClass', () => {
    it('should identify valid Tailwind classes', () => {
      expect(extractor.isTailwindClass('bg-blue-500')).toBe(true);
      expect(extractor.isTailwindClass('text-white')).toBe(true);
      expect(extractor.isTailwindClass('p-4')).toBe(true);
      expect(extractor.isTailwindClass('rounded')).toBe(true);
      expect(extractor.isTailwindClass('flex')).toBe(true);
      expect(extractor.isTailwindClass('grid')).toBe(true);
      expect(extractor.isTailwindClass('hover:bg-blue-600')).toBe(true);
      expect(extractor.isTailwindClass('sm:text-lg')).toBe(true);
      expect(extractor.isTailwindClass('dark:bg-gray-800')).toBe(true);
    });

    it('should reject non-Tailwind classes', () => {
      expect(extractor.isTailwindClass('custom-class')).toBe(false);
      expect(extractor.isTailwindClass('my-style')).toBe(false);
      expect(extractor.isTailwindClass('component-name')).toBe(false);
      expect(extractor.isTailwindClass('some-random-class')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(extractor.isTailwindClass('')).toBe(false);
      expect(extractor.isTailwindClass(' ')).toBe(false);
      expect(extractor.isTailwindClass('bg-')).toBe(false);
      expect(extractor.isTailwindClass('bg-blue-')).toBe(false);
    });
  });
});