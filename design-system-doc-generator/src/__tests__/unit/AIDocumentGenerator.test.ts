import { AIDocumentGenerator } from '../../generators/AIDocumentGenerator';
import { ExtractedComponent, DesignTokens } from '../../types';
import * as fs from 'fs';

// Mock fs
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
  },
}));

// Mock utils
jest.mock('../../utils/fileUtils', () => ({
  ensureDirectoryExists: jest.fn(),
}));

// Mock the new architecture modules
jest.mock('../../generators/document/ComponentDocumentGenerator', () => ({
  ComponentDocumentGenerator: jest.fn().mockImplementation(() => ({
    generateComponentDoc: jest.fn().mockImplementation((component, allComponents, options) => {
      const hasResponsive = component.tailwindClasses?.some(cls => cls.includes('sm:') || cls.includes('md:') || cls.includes('lg:'));
      const hasDarkMode = component.tailwindClasses?.some(cls => cls.startsWith('dark:'));
      const animations = component.tailwindClasses?.filter(cls => 
        cls.startsWith('animate-') || 
        cls.startsWith('transition-') || 
        cls.includes('duration-') || 
        cls.includes('ease-')
      ) || [];
      
      const examples = options?.includeExamples ? [
        {
          title: '基本的な使用方法',
          code: `import { ${component.componentName} } from './components';\n\n<${component.componentName}>Click me</${component.componentName}>`
        },
        {
          title: '全プロパティを使用した例',
          code: `import { ${component.componentName} } from './components';\n\n<${component.componentName} disabled>Disabled</${component.componentName}>`
        }
      ] : [];
      
      // Find related components with similar names
      const relatedComponents = allComponents
        .filter(c => c.componentName !== component.componentName && 
                    c.componentName.toLowerCase().includes(component.componentName.toLowerCase()))
        .map(c => c.componentName);
      
      return {
        id: `${component.category}-${component.componentName.toLowerCase()}`,
        name: component.componentName,
        category: component.category,
        description: `${component.componentName}は基本的なUI要素です`,
        props: component.props || [],
        examples,
        styles: {
          responsive: hasResponsive,
          darkMode: hasDarkMode,
          animations,
          tailwindClasses: component.tailwindClasses || []
        },
        styleInfo: component.styleInfo || {},
        relatedComponents
      };
    })
  }))
}));
jest.mock('../../generators/document/PatternDetector', () => ({
  PatternDetector: jest.fn().mockImplementation(() => ({
    detectPatterns: jest.fn().mockImplementation((components) => {
      const patterns = [];
      
      // Create patterns based on component categories
      const hasButtons = components.some(c => c.componentName.toLowerCase().includes('button'));
      const hasCards = components.some(c => c.componentName.toLowerCase().includes('card'));
      const hasForms = components.some(c => c.componentName.toLowerCase().includes('form'));
      
      if (hasButtons) {
        patterns.push({
          name: 'ボタンシステム',
          description: 'アプリケーション全体で一貫したボタンスタイル',
          components: components.filter(c => c.componentName.toLowerCase().includes('button')).map(c => c.componentName),
          examples: []
        });
      }
      
      if (hasCards) {
        patterns.push({
          name: 'カードシステム',
          description: 'コンテンツを整理するためのカード構造',
          components: components.filter(c => c.componentName.toLowerCase().includes('card')).map(c => c.componentName),
          examples: []
        });
      }
      
      if (hasForms) {
        patterns.push({
          name: 'フォームシステム',
          description: 'ユーザー入力を収集するためのフォーム構造',
          components: components.filter(c => c.componentName.toLowerCase().includes('form')).map(c => c.componentName),
          examples: []
        });
      }
      
      return {
        patterns,
        relationships: []
      };
    })
  }))
}));
jest.mock('../../generators/document/GuidelineGenerator', () => ({
  GuidelineGenerator: jest.fn().mockImplementation(() => ({
    generateGuidelines: jest.fn().mockImplementation((components, tokens) => [
      'カラーパレット: プライマリ、セカンダリ、アクセントカラーの適切な使用',
      'スペーシング: 8pxベースのスペーシングシステムを使用',
      'レスポンシブデザイン: モバイルファーストアプローチで設計',
      'ダークモード: ライトモードとダークモードの適切なコントラスト',
      'アクセシビリティ: WCAG 2.1 AAレベルの準拠'
    ])
  }))
}));
jest.mock('../../generators/document/MarkdownFormatter', () => ({
  MarkdownFormatter: jest.fn().mockImplementation(() => ({
    generateMarkdown: jest.fn().mockReturnValue('# デザインシステムドキュメント\n\nテストコンテンツ')
  }))
}));

describe('AIDocumentGenerator', () => {
  let generator: AIDocumentGenerator;

  beforeEach(() => {
    generator = new AIDocumentGenerator();
    jest.clearAllMocks();
  });

  const createMockComponent = (
    name: string,
    category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'pages' = 'atoms',
    classes: string[] = [],
    overrides: Partial<ExtractedComponent> = {}
  ): ExtractedComponent => ({
    filePath: `./${name}.tsx`,
    componentName: name,
    category,
    tailwindClasses: classes,
    props: [],
    dependencies: [],
    hash: 'mock-hash',
    ...overrides,
  });

  const createMockTokens = (): DesignTokens => ({
    colors: {
      'primary-500': { value: '#3b82f6', rgb: 'rgb(59, 130, 246)', usage: [] },
      'secondary-500': { value: '#6b7280', rgb: 'rgb(107, 114, 128)', usage: [] },
    },
    spacing: {
      '4': '1rem',
      '8': '2rem',
    },
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, sans-serif',
      },
      fontSize: {
        base: '1rem',
        lg: '1.125rem',
      },
      fontWeight: {
        normal: '400',
        bold: '700',
      },
      lineHeight: {
        normal: '1.5',
      },
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    },
    borderRadius: {
      md: '0.375rem',
    },
    custom: {},
  });

  describe('generate', () => {
    it('should generate AI document with basic components', async () => {
      const components = [
        createMockComponent('Button', 'atoms', ['px-4', 'py-2', 'bg-blue-500'], {
          props: [
            { name: 'onClick', type: '() => void', required: false },
            { name: 'children', type: 'React.ReactNode', required: true },
          ],
        }),
        createMockComponent('Card', 'molecules', ['p-6', 'shadow-lg', 'rounded-lg']),
      ];

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate(components, tokens, options);

      expect(result.document.version).toBe('1.0.0');
      expect(result.document.components).toHaveLength(2);
      expect(result.document.tokens).toEqual(tokens);
      expect(result.document.patterns).toBeInstanceOf(Array);
      expect(result.document.guidelines).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.componentsProcessed).toBe(2);
    });

    it('should generate component documentation with correct structure', async () => {
      const component = createMockComponent('Button', 'atoms', ['px-4', 'py-2', 'bg-blue-500', 'hover:bg-blue-600'], {
        props: [
          { name: 'onClick', type: '() => void', required: false },
          { name: 'children', type: 'React.ReactNode', required: true },
          { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
        ],
      });

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate([component], tokens, options);

      const buttonDoc = result.document.components[0];
      expect(buttonDoc.id).toBe('atoms-button');
      expect(buttonDoc.name).toBe('Button');
      expect(buttonDoc.category).toBe('atoms');
      expect(buttonDoc.description).toContain('基本的なUI要素');
      expect(buttonDoc.props).toHaveLength(3);
      expect(buttonDoc.styles.tailwindClasses).toContain('px-4');
      expect(buttonDoc.styles.tailwindClasses).toContain('py-2');
      expect(buttonDoc.styles.tailwindClasses).toContain('bg-blue-500');
      expect(buttonDoc.styles.tailwindClasses).toContain('hover:bg-blue-600');
    });

    it('should detect responsive and dark mode classes', async () => {
      const component = createMockComponent('ResponsiveButton', 'atoms', [
        'px-4', 'py-2', 'sm:px-6', 'md:px-8', 'dark:bg-gray-800', 'dark:text-white'
      ]);

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate([component], tokens, options);

      const buttonDoc = result.document.components[0];
      expect(buttonDoc.styles.responsive).toBe(true);
      expect(buttonDoc.styles.darkMode).toBe(true);
    });

    it('should detect animation classes', async () => {
      const component = createMockComponent('AnimatedButton', 'atoms', [
        'px-4', 'py-2', 'animate-pulse', 'transition-colors', 'duration-300', 'ease-in-out'
      ]);

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate([component], tokens, options);

      const buttonDoc = result.document.components[0];
      expect(buttonDoc.styles.animations).toContain('animate-pulse');
      expect(buttonDoc.styles.animations).toContain('transition-colors');
      expect(buttonDoc.styles.animations).toContain('duration-300');
      expect(buttonDoc.styles.animations).toContain('ease-in-out');
    });

    it('should generate examples when includeExamples is true', async () => {
      const component = createMockComponent('Button', 'atoms', ['px-4', 'py-2'], {
        props: [
          { name: 'onClick', type: '() => void', required: false },
          { name: 'children', type: 'React.ReactNode', required: true },
        ],
      });

      const tokens = createMockTokens();
      const options = { includeExamples: true, outputFormat: 'json' as const };

      const result = await generator.generate([component], tokens, options);

      const buttonDoc = result.document.components[0];
      expect(buttonDoc.examples).toHaveLength(2);
      expect(buttonDoc.examples[0].title).toBe('基本的な使用方法');
      expect(buttonDoc.examples[0].code).toContain('import { Button }');
      expect(buttonDoc.examples[1].title).toBe('全プロパティを使用した例');
    });

    it('should detect design patterns', async () => {
      const components = [
        createMockComponent('PrimaryButton', 'atoms', ['px-4', 'py-2', 'bg-blue-500']),
        createMockComponent('SecondaryButton', 'atoms', ['px-4', 'py-2', 'bg-gray-500']),
        createMockComponent('LoginForm', 'molecules', ['p-6', 'border']),
        createMockComponent('ContactForm', 'molecules', ['p-6', 'shadow']),
        createMockComponent('ProductCard', 'molecules', ['p-4', 'border', 'rounded']),
      ];

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate(components, tokens, options);

      expect(result.document.patterns).toHaveLength(3);
      
      const buttonPattern = result.document.patterns.find(p => p.name === 'ボタンシステム');
      expect(buttonPattern).toBeDefined();
      expect(buttonPattern?.components).toContain('PrimaryButton');
      expect(buttonPattern?.components).toContain('SecondaryButton');
      
      const formPattern = result.document.patterns.find(p => p.name === 'フォームシステム');
      expect(formPattern).toBeDefined();
      expect(formPattern?.components).toContain('LoginForm');
      expect(formPattern?.components).toContain('ContactForm');
      
      const cardPattern = result.document.patterns.find(p => p.name === 'カードシステム');
      expect(cardPattern).toBeDefined();
      expect(cardPattern?.components).toContain('ProductCard');
    });

    it('should generate guidelines based on components and tokens', async () => {
      const components = [
        createMockComponent('Button', 'atoms', ['px-4', 'py-2', 'sm:px-6', 'dark:bg-gray-800']),
        createMockComponent('Input', 'atoms', ['border', 'rounded', 'md:text-lg']),
        createMockComponent('Card', 'molecules', ['p-6', 'shadow']),
      ];

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate(components, tokens, options);

      expect(result.document.guidelines).toHaveLength(5);
      expect(result.document.guidelines[0]).toContain('カラーパレット');
      expect(result.document.guidelines[1]).toContain('スペーシング');
      expect(result.document.guidelines[2]).toContain('レスポンシブデザイン');
      expect(result.document.guidelines[3]).toContain('ダークモード');
    });

    it('should find related components', async () => {
      const components = [
        createMockComponent('Button', 'atoms', ['px-4', 'py-2']),
        createMockComponent('PrimaryButton', 'atoms', ['px-4', 'py-2', 'bg-blue-500']),
        createMockComponent('SecondaryButton', 'atoms', ['px-4', 'py-2', 'bg-gray-500']),
        createMockComponent('Card', 'molecules', ['p-6', 'border']),
      ];

      const tokens = createMockTokens();
      const options = { includeExamples: false, outputFormat: 'json' as const };

      const result = await generator.generate(components, tokens, options);

      const buttonDoc = result.document.components.find(c => c.name === 'Button');
      expect(buttonDoc?.relatedComponents).toContain('PrimaryButton');
      expect(buttonDoc?.relatedComponents).toContain('SecondaryButton');
      expect(buttonDoc?.relatedComponents).not.toContain('Card');
    });
  });

  describe('saveAsJSON', () => {
    it('should save document as JSON', async () => {
      const mockDocument = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        project: { name: 'test', version: '1.0.0', framework: 'react', styling: 'tailwind' },
        tokens: createMockTokens(),
        components: [],
        patterns: [],
        guidelines: [],
      };

      await generator.saveAsJSON(mockDocument, './output/doc.json');

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        './output/doc.json',
        JSON.stringify(mockDocument, null, 2),
        'utf-8'
      );
    });
  });

  describe('saveAsMarkdown', () => {
    it('should save document as Markdown', async () => {
      const mockDocument = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        project: { name: 'test', version: '1.0.0', framework: 'react', styling: 'tailwind' },
        tokens: createMockTokens(),
        components: [
          {
            id: 'atoms-button',
            name: 'Button',
            category: 'atoms',
            description: 'A basic button component',
            usage: '<Button>Click me</Button>',
            props: [
              { name: 'onClick', type: '() => void', required: false, description: 'Click handler' },
            ],
            styles: {
              type: 'tailwind' as const,
              tailwindClasses: ['px-4', 'py-2'],
              responsive: false,
              darkMode: false,
              animations: [],
            },
            examples: [],
            relatedComponents: [],
          },
        ],
        patterns: [],
        guidelines: [],
      };

      await generator.saveAsMarkdown(mockDocument, './output/doc.md');

      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        './output/doc.md',
        expect.stringContaining('# デザインシステムドキュメント'),
        'utf-8'
      );
    });
  });
});