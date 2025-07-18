import { ComponentDocumentGenerator } from '../../generators/document/ComponentDocumentGenerator';
import { ExtractedComponent } from '../../types';

describe('ComponentDocumentGenerator', () => {
  let generator: ComponentDocumentGenerator;
  let mockComponent: ExtractedComponent;
  let mockComponents: ExtractedComponent[];

  beforeEach(() => {
    generator = new ComponentDocumentGenerator();
    
    mockComponent = {
      filePath: '/test/Button.tsx',
      componentName: 'Button',
      category: 'atoms',
      tailwindClasses: ['bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-blue-600'],
      props: [
        { name: 'children', type: 'ReactNode', required: true },
        { name: 'onClick', type: '() => void', required: false },
        { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
        { name: 'variant', type: 'string', required: false, defaultValue: 'primary' }
      ],
      dependencies: ['react', './utils'],
      hash: 'abc123',
      jsxStructure: {
        type: 'button',
        props: { onClick: '{onClick}', disabled: '{disabled}' },
        children: ['{children}']
      }
    };

    mockComponents = [
      mockComponent,
      {
        filePath: '/test/Input.tsx',
        componentName: 'Input',
        category: 'atoms',
        tailwindClasses: ['border', 'border-gray-300', 'px-3', 'py-2', 'rounded'],
        props: [
          { name: 'value', type: 'string', required: true },
          { name: 'onChange', type: '(value: string) => void', required: true }
        ],
        dependencies: ['react'],
        hash: 'def456'
      }
    ];
  });

  describe('generateComponentDoc', () => {
    it('should generate basic component documentation', () => {
      const doc = generator.generateComponentDoc(mockComponent, mockComponents, {
        includeExamples: false,
        outputFormat: 'json'
      });

      expect(doc.name).toBe('Button');
      expect(doc.category).toBe('atoms');
      expect(doc.description).toContain('基本的なUI要素「Button」');
      expect(doc.usage).toBe('<Button children={<div>コンテンツ</div>} />');
      expect(doc.props).toHaveLength(4);
      expect(doc.styles.tailwindClasses).toEqual([
        'bg-blue-500', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-blue-600'
      ]);
      expect(doc.styles.responsive).toBe(false);
      expect(doc.styles.darkMode).toBe(false);
      expect(doc.jsxStructure).toBeDefined();
    });

    it('should generate component documentation with examples', () => {
      const doc = generator.generateComponentDoc(mockComponent, mockComponents, {
        includeExamples: true,
        outputFormat: 'json'
      });

      expect(doc.examples).toHaveLength(2);
      expect(doc.examples[0].title).toBe('基本的な使用方法');
      expect(doc.examples[1].title).toBe('全プロパティを使用した例');
      expect(doc.examples[0].code).toContain('import { Button }');
      expect(doc.examples[0].code).toContain('<Button');
    });

    it('should detect responsive design', () => {
      const responsiveComponent: ExtractedComponent = {
        ...mockComponent,
        tailwindClasses: ['px-4', 'py-2', 'sm:px-6', 'md:px-8', 'lg:px-10']
      };

      const doc = generator.generateComponentDoc(responsiveComponent, mockComponents, {
        includeExamples: false,
        outputFormat: 'json'
      });

      expect(doc.styles.responsive).toBe(true);
      expect(doc.description).toContain('レスポンシブ対応');
    });

    it('should detect dark mode support', () => {
      const darkModeComponent: ExtractedComponent = {
        ...mockComponent,
        tailwindClasses: ['bg-white', 'dark:bg-gray-800', 'text-black', 'dark:text-white']
      };

      const doc = generator.generateComponentDoc(darkModeComponent, mockComponents, {
        includeExamples: false,
        outputFormat: 'json'
      });

      expect(doc.styles.darkMode).toBe(true);
      expect(doc.description).toContain('ダークモード対応');
    });

    it('should detect animations', () => {
      const animatedComponent: ExtractedComponent = {
        ...mockComponent,
        tailwindClasses: ['transition-colors', 'duration-200', 'animate-pulse']
      };

      const doc = generator.generateComponentDoc(animatedComponent, mockComponents, {
        includeExamples: false,
        outputFormat: 'json'
      });

      expect(doc.styles.animations).toContain('transition-colors');
      expect(doc.styles.animations).toContain('duration-200');
      expect(doc.styles.animations).toContain('animate-pulse');
      expect(doc.description).toContain('アニメーション効果付き');
    });

    it('should find related components', () => {
      const relatedComponents: ExtractedComponent[] = [
        {
          filePath: '/test/PrimaryButton.tsx',
          componentName: 'PrimaryButton',
          category: 'atoms',
          tailwindClasses: [],
          props: [],
          dependencies: [],
          hash: 'related1'
        },
        {
          filePath: '/test/SecondaryButton.tsx',
          componentName: 'SecondaryButton',
          category: 'atoms',
          tailwindClasses: [],
          props: [],
          dependencies: [],
          hash: 'related2'
        },
        {
          filePath: '/test/Card.tsx',
          componentName: 'Card',
          category: 'molecules',
          tailwindClasses: [],
          props: [],
          dependencies: [],
          hash: 'unrelated'
        }
      ];

      const doc = generator.generateComponentDoc(mockComponent, relatedComponents, {
        includeExamples: false,
        outputFormat: 'json'
      });

      expect(doc.relatedComponents).toContain('PrimaryButton');
      expect(doc.relatedComponents).toContain('SecondaryButton');
      expect(doc.relatedComponents.length).toBeLessThanOrEqual(5);
    });

    it('should generate proper prop descriptions', () => {
      const doc = generator.generateComponentDoc(mockComponent, mockComponents, {
        includeExamples: false,
        outputFormat: 'json'
      });

      const childrenProp = doc.props.find(p => p.name === 'children');
      const onClickProp = doc.props.find(p => p.name === 'onClick');
      const disabledProp = doc.props.find(p => p.name === 'disabled');

      expect(childrenProp?.description).toBe('コンポーネントの子要素');
      expect(onClickProp?.description).toBe('クリック時のイベントハンドラ');
      expect(disabledProp?.description).toBe('コンポーネントの無効化状態');
    });

    it('should handle components with no props', () => {
      const noPropComponent: ExtractedComponent = {
        ...mockComponent,
        props: []
      };

      const doc = generator.generateComponentDoc(noPropComponent, mockComponents, {
        includeExamples: true,
        outputFormat: 'json'
      });

      expect(doc.props).toHaveLength(0);
      expect(doc.usage).toBe('<Button />');
      expect(doc.examples[0].code).toContain('<Button />');
    });

    it('should categorize different component types', () => {
      const moleculeComponent: ExtractedComponent = {
        ...mockComponent,
        componentName: 'Card',
        category: 'molecules'
      };

      const organismComponent: ExtractedComponent = {
        ...mockComponent,
        componentName: 'Header',
        category: 'organisms'
      };

      const moleculeDoc = generator.generateComponentDoc(moleculeComponent, [], {
        includeExamples: false,
        outputFormat: 'json'
      });

      const organismDoc = generator.generateComponentDoc(organismComponent, [], {
        includeExamples: false,
        outputFormat: 'json'
      });

      expect(moleculeDoc.description).toContain('複数の要素を組み合わせた「Card」');
      expect(organismDoc.description).toContain('複雑な機能を持つ「Header」');
    });
  });
});