import { 
  StyleExtractorFactory, 
  TailwindStyleExtractor, 
  StyleSheetExtractor,
  StyledComponentsExtractor,
  CSSModulesExtractor
} from '../../extractors/StyleExtractorFactory';
import { ConfigManager } from '../../config/ConfigManager';
import { Platform } from '../../types';

// ConfigManagerのモック
jest.mock('../../config/ConfigManager');

describe('StyleExtractorFactory', () => {
  const mockConfig = {
    sourceDir: './src',
    platform: 'web' as Platform
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ConfigManager.getInstance as jest.Mock).mockReturnValue({
      isCustomStyleSystem: jest.fn().mockReturnValue(false)
    });
  });

  describe('createExtractor', () => {
    it('should create TailwindStyleExtractor for tailwind', () => {
      const extractor = StyleExtractorFactory.createExtractor('tailwind', mockConfig);
      expect(extractor).toBeInstanceOf(TailwindStyleExtractor);
    });

    it('should create StyleSheetExtractor for stylesheet', () => {
      const extractor = StyleExtractorFactory.createExtractor('stylesheet', mockConfig);
      expect(extractor).toBeInstanceOf(StyleSheetExtractor);
    });

    it('should create StyledComponentsExtractor for styled-components', () => {
      const extractor = StyleExtractorFactory.createExtractor('styled-components', mockConfig);
      expect(extractor).toBeInstanceOf(StyledComponentsExtractor);
    });

    it('should create CSSModulesExtractor for css-modules', () => {
      const extractor = StyleExtractorFactory.createExtractor('css-modules', mockConfig);
      expect(extractor).toBeInstanceOf(CSSModulesExtractor);
    });

    it('should throw error for unsupported style system', () => {
      expect(() => {
        StyleExtractorFactory.createExtractor('unknown-system', mockConfig);
      }).toThrow('Unsupported style system: unknown-system');
    });
  });

  describe('createMultiExtractor', () => {
    it('should create multiple extractors', () => {
      const extractors = StyleExtractorFactory.createMultiExtractor(
        ['tailwind', 'stylesheet'], 
        mockConfig
      );

      expect(extractors).toHaveLength(2);
      expect(extractors[0]).toBeInstanceOf(TailwindStyleExtractor);
      expect(extractors[1]).toBeInstanceOf(StyleSheetExtractor);
    });
  });
});

describe('TailwindStyleExtractor', () => {
  let extractor: TailwindStyleExtractor;

  beforeEach(() => {
    extractor = new TailwindStyleExtractor({
      sourceDir: './src',
      platform: 'web'
    });
  });

  describe('extractStyles', () => {
    it('should extract Tailwind classes from JSX className', () => {
      const node = {
        type: 'JSXAttribute',
        name: { name: 'className' },
        value: {
          type: 'Literal',
          value: 'bg-blue-500 p-4 text-white'
        }
      };

      const styles = extractor.extractStyles(node);

      expect(styles).toHaveLength(3);
      expect(styles[0]).toEqual({
        type: 'className',
        value: 'bg-blue-500'
      });
      expect(styles[1]).toEqual({
        type: 'className',
        value: 'p-4'
      });
      expect(styles[2]).toEqual({
        type: 'className',
        value: 'text-white'
      });
    });

    it('should filter out non-Tailwind classes', () => {
      const node = {
        type: 'JSXAttribute',
        name: { name: 'className' },
        value: {
          type: 'Literal',
          value: 'bg-blue-500 custom-class p-4'
        }
      };

      const styles = extractor.extractStyles(node);

      expect(styles).toHaveLength(2);
      expect(styles.map(s => s.value)).toEqual(['bg-blue-500', 'p-4']);
    });
  });

  describe('validateStyles', () => {
    it('should validate Tailwind classes', () => {
      const styles = ['bg-blue-500', 'p-4', 'text-white'];
      const result = extractor.validateStyles(styles);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn about invalid Tailwind classes', () => {
      const styles = ['bg-blue-500', 'invalid-class', 'p-4'];
      const result = extractor.validateStyles(styles);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('invalid-class');
      expect(result.warnings[0].code).toBe('INVALID_TAILWIND_CLASS');
    });
  });

  describe('generateExamples', () => {
    it('should generate HTML example', () => {
      const styles = [
        { type: 'className' as const, value: 'bg-blue-500' },
        { type: 'className' as const, value: 'p-4' }
      ];

      const example = extractor.generateExamples(styles);

      expect(example).toBe('<div className="bg-blue-500 p-4">Example</div>');
    });
  });
});

describe('StyleSheetExtractor', () => {
  let extractor: StyleSheetExtractor;

  beforeEach(() => {
    extractor = new StyleSheetExtractor({
      sourceDir: './src',
      platform: 'react-native'
    });
  });

  describe('extractStyles', () => {
    it('should extract StyleSheet.create usage', () => {
      const node = {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'StyleSheet' },
          property: { name: 'create' }
        },
        arguments: [{
          type: 'ObjectExpression',
          properties: [{
            type: 'Property',
            key: { name: 'container' },
            value: {
              type: 'ObjectExpression',
              properties: [{
                type: 'Property',
                key: { name: 'padding' },
                value: { type: 'Literal', value: 16 }
              }]
            }
          }]
        }]
      };

      const styles = extractor.extractStyles(node);

      expect(styles).toHaveLength(1);
      expect(styles[0]).toEqual({
        type: 'stylesheet',
        value: { container: { padding: 16 } },
        imports: ['StyleSheet'],
        source: 'StyleSheet.create()'
      });
    });

    it('should extract inline styles', () => {
      const node = {
        type: 'JSXAttribute',
        name: { name: 'style' },
        value: {
          type: 'JSXExpressionContainer',
          expression: {
            type: 'ObjectExpression',
            properties: [{
              type: 'Property',
              key: { name: 'padding' },
              value: { type: 'Literal', value: 16 }
            }]
          }
        }
      };

      const styles = extractor.extractStyles(node);

      expect(styles).toHaveLength(1);
      expect(styles[0]).toEqual({
        type: 'inline',
        value: { padding: 16 }
      });
    });
  });

  describe('validateStyles', () => {
    it('should detect className usage in React Native', () => {
      const styles = ['<View className="container">'];
      const result = extractor.validateStyles(styles);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_RN_PROP');
      expect(result.errors[0].message).toContain('className is not supported');
    });

    it('should warn about web-only CSS properties', () => {
      const styles = ['boxShadow: "0 2px 4px rgba(0,0,0,0.1)"'];
      const result = extractor.validateStyles(styles);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('UNSUPPORTED_CSS_PROP');
    });

    it('should validate React Native StyleSheet objects', () => {
      const styles = ['padding: 16', 'backgroundColor: #3B82F6', 'boxShadow: 0 2px 4px rgba(0,0,0,0.1)'];
      const result = extractor.validateStyles(styles);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('UNSUPPORTED_STYLESHEET_PROP');
    });
  });

  describe('React Native component detection', () => {
    it('should identify React Native components', () => {
      expect(extractor.isReactNativeComponent('View')).toBe(true);
      expect(extractor.isReactNativeComponent('Text')).toBe(true);
      expect(extractor.isReactNativeComponent('TouchableOpacity')).toBe(true);
      expect(extractor.isReactNativeComponent('div')).toBe(false);
      expect(extractor.isReactNativeComponent('CustomComponent')).toBe(false);
    });
  });
});

describe('StyledComponentsExtractor', () => {
  let extractor: StyledComponentsExtractor;

  beforeEach(() => {
    extractor = new StyledComponentsExtractor({
      sourceDir: './src',
      platform: 'web'
    });
  });

  describe('extractStyles', () => {
    it('should extract styled-components template literal', () => {
      const node = {
        type: 'TaggedTemplateExpression',
        tag: {
          type: 'MemberExpression',
          object: { name: 'styled' },
          property: { name: 'div' }
        },
        quasi: {
          quasis: [
            { value: { raw: 'padding: 16px; background-color: blue;' } }
          ]
        }
      };

      const styles = extractor.extractStyles(node);

      expect(styles).toHaveLength(1);
      expect(styles[0]).toEqual({
        type: 'styled-component',
        value: 'padding: 16px; background-color: blue;',
        imports: ['styled-components']
      });
    });
  });

  describe('generateExamples', () => {
    it('should generate styled-components example', () => {
      const styles = [{
        type: 'styled-component' as const,
        value: 'padding: 16px; background-color: blue;'
      }];

      const example = extractor.generateExamples(styles);

      expect(example).toContain('import styled from \'styled-components\'');
      expect(example).toContain('const StyledDiv = styled.div`');
      expect(example).toContain('padding: 16px; background-color: blue;');
    });
  });
});