import { TailwindExtractor } from '../../extractors/TailwindExtractor';
import { JSXElement } from '../../types';

describe('TailwindExtractor - JSX Structure Extraction', () => {
  let extractor: TailwindExtractor;

  beforeEach(() => {
    extractor = new TailwindExtractor({
      sourceDir: '/test',
      ignore: ['node_modules', '.git']
    });
  });

  describe('extractJSXStructure', () => {
    it('should extract simple JSX structure', async () => {
      const mockContent = `import React from 'react';
      
export default function SimpleComponent() {
  return (
    <div className="container">
      <h1 className="title">Hello World</h1>
    </div>
  );
}`;

      // Mock fs.promises.readFile
      const fs = require('fs');
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/SimpleComponent.tsx');
      
      expect(result).not.toBeNull();
      expect(result!.jsxStructure).toBeDefined();
      expect(result!.jsxStructure!.type).toBe('div');
      expect(result!.jsxStructure!.className).toBe('container');
      expect(result!.jsxStructure!.tailwindClasses).toEqual(['container']);
      expect(result!.jsxStructure!.children).toHaveLength(1);
      
      const h1Element = result!.jsxStructure!.children![0] as JSXElement;
      expect(h1Element.type).toBe('h1');
      expect(h1Element.className).toBe('title');
      expect(h1Element.children).toEqual(['Hello World']);
    });

    it('should extract nested JSX structure', async () => {
      const mockContent = `import React from 'react';
      
export default function NestedComponent() {
  return (
    <div className="bg-blue-500 p-4">
      <header className="text-white">
        <h1 className="text-xl font-bold">Title</h1>
        <p className="text-sm">Subtitle</p>
      </header>
      <main className="mt-4">
        <button className="bg-white text-blue-500 px-4 py-2">Click me</button>
      </main>
    </div>
  );
}`;

      const fs = require('fs');
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/NestedComponent.tsx');
      
      expect(result).not.toBeNull();
      expect(result!.jsxStructure).toBeDefined();
      
      const rootDiv = result!.jsxStructure!;
      expect(rootDiv.type).toBe('div');
      expect(rootDiv.tailwindClasses).toEqual(['bg-blue-500', 'p-4']);
      expect(rootDiv.children).toHaveLength(2);
      
      const header = rootDiv.children![0] as JSXElement;
      expect(header.type).toBe('header');
      expect(header.tailwindClasses).toEqual(['text-white']);
      expect(header.children).toHaveLength(2);
      
      const h1 = header.children![0] as JSXElement;
      expect(h1.type).toBe('h1');
      expect(h1.tailwindClasses).toEqual(['text-xl', 'font-bold']);
    });

    it('should handle dynamic content expressions', async () => {
      const mockContent = `import React from 'react';
      
export default function DynamicComponent({ title, count }) {
  return (
    <div className="container">
      <h1 className="title">{title}</h1>
      <p className="count">Count: {count}</p>
      {count > 0 && <span className="badge">Active</span>}
    </div>
  );
}`;

      const fs = require('fs');
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/DynamicComponent.tsx');
      
      expect(result).not.toBeNull();
      expect(result!.jsxStructure).toBeDefined();
      
      const rootDiv = result!.jsxStructure!;
      expect(rootDiv.children).toHaveLength(3);
      
      const h1 = rootDiv.children![0] as JSXElement;
      expect(h1.children).toEqual(['{...}']);
      
      const p = rootDiv.children![1] as JSXElement;
      expect(p.children).toEqual(['Count:', '{...}']);
      
      const span = rootDiv.children![2] as JSXElement;
      expect(span.children).toEqual(['Active']);
    });

    it('should handle component props', async () => {
      const mockContent = `import React from 'react';
      
export default function ComponentWithProps({ disabled, onClick }) {
  return (
    <button 
      type="button"
      className="btn"
      disabled={disabled}
      onClick={onClick}
    >
      Click me
    </button>
  );
}`;

      const fs = require('fs');
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/ComponentWithProps.tsx');
      
      expect(result).not.toBeNull();
      expect(result!.jsxStructure).toBeDefined();
      
      const button = result!.jsxStructure!;
      expect(button.type).toBe('button');
      expect(button.props).toEqual({
        type: 'button',
        disabled: '{disabled}',
        onClick: '{onClick}'
      });
      expect(button.className).toBe('btn');
    });

    it('should handle conditional rendering', async () => {
      const mockContent = `import React from 'react';
      
export default function ConditionalComponent({ showContent }) {
  return (
    <div className="container">
      {showContent ? (
        <div className="content">
          <p>Content is shown</p>
        </div>
      ) : (
        <div className="empty">
          <p>No content</p>
        </div>
      )}
    </div>
  );
}`;

      const fs = require('fs');
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/ConditionalComponent.tsx');
      
      expect(result).not.toBeNull();
      expect(result!.jsxStructure).toBeDefined();
      
      const rootDiv = result!.jsxStructure!;
      expect(rootDiv.children).toHaveLength(1);
      
      // Should extract the true branch (consequent)
      const contentDiv = rootDiv.children![0] as JSXElement;
      expect(contentDiv.type).toBe('div');
      expect(contentDiv.tailwindClasses).toEqual(['content']);
    });

    it('should handle fragments', async () => {
      const mockContent = `import React from 'react';
      
export default function FragmentComponent() {
  return (
    <>
      <h1 className="title">Title</h1>
      <p className="description">Description</p>
    </>
  );
}`;

      const fs = require('fs');
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await extractor.extractFromFile('/test/FragmentComponent.tsx');
      
      expect(result).not.toBeNull();
      expect(result!.jsxStructure).toBeDefined();
      
      const fragment = result!.jsxStructure!;
      expect(fragment.type).toBe('Fragment');
      expect(fragment.children).toHaveLength(2);
      
      const h1 = fragment.children![0] as JSXElement;
      expect(h1.type).toBe('h1');
      expect(h1.tailwindClasses).toEqual(['title']);
    });
  });

  describe('isJSXElement', () => {
    it('should identify JSX elements correctly', () => {
      const jsxNode = { type: 'JSXElement' };
      const fragmentNode = { type: 'JSXFragment' };
      const expressionNode = { type: 'JSXExpressionContainer', expression: { type: 'JSXElement' } };
      const nonJsxNode = { type: 'Literal' };

      expect((extractor as any).isJSXElement(jsxNode)).toBe(true);
      expect((extractor as any).isJSXElement(fragmentNode)).toBe(true);
      expect((extractor as any).isJSXElement(expressionNode)).toBe(true);
      expect((extractor as any).isJSXElement(nonJsxNode)).toBe(false);
    });
  });

  describe('extractJSXProps', () => {
    it('should extract JSX props with className', () => {
      const attributes = [
        {
          type: 'JSXAttribute',
          name: { name: 'className' },
          value: { type: 'Literal', value: 'bg-blue-500 text-white' }
        },
        {
          type: 'JSXAttribute',
          name: { name: 'id' },
          value: { type: 'Literal', value: 'my-id' }
        }
      ];

      const result = (extractor as any).extractJSXProps(attributes);
      
      expect(result.props).toEqual({ id: 'my-id' });
      expect(result.className).toBe('bg-blue-500 text-white');
      expect(result.tailwindClasses).toEqual(['bg-blue-500', 'text-white']);
    });

    it('should handle spread attributes', () => {
      const attributes = [
        {
          type: 'JSXSpreadAttribute',
          argument: { type: 'Identifier', name: 'props' }
        }
      ];

      const result = (extractor as any).extractJSXProps(attributes);
      
      expect(result.props).toEqual({ '...spread': true });
    });
  });
});