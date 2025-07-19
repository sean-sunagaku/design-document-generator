import { Platform, StyleSystem, ExtractorConfig, StyleInfo as BaseStyleInfo } from '../types';
import { ConfigManager } from '../config/ConfigManager';

// 抽象基底クラス
export abstract class StyleExtractor {
  protected config: ExtractorConfig;

  constructor(config: ExtractorConfig) {
    this.config = config;
  }

  abstract extractStyles(node: any): ExtractedStyleInfo[];
  abstract validateStyles(styles: string[]): ValidationResult;
  abstract generateExamples(styles: ExtractedStyleInfo[]): string;
}

export interface ExtractedStyleInfo {
  type: 'className' | 'inline' | 'stylesheet' | 'styled-component';
  value: string | Record<string, any>;
  source?: string; // ソースファイルパス（StyleSheetの場合）
  imports?: string[]; // 必要なimport文
}

export interface ValidationResult {
  isValid: boolean;
  errors: StyleError[];
  warnings: StyleWarning[];
}

export interface StyleError {
  message: string;
  line?: number;
  column?: number;
  code?: string;
}

export interface StyleWarning {
  message: string;
  line?: number;
  column?: number;
  code?: string;
}

// Tailwind CSS Extractor（既存の実装を移行）
export class TailwindStyleExtractor extends StyleExtractor {
  private tailwindPatterns: RegExp[];

  constructor(config: ExtractorConfig) {
    super(config);
    this.tailwindPatterns = [
      // 既存のTailwindClassExtractorのパターンを移行
      /^(p|pl|pr|pt|pb|px|py|m|ml|mr|mt|mb|mx|my)-/,
      /^(w|h|min-w|min-h|max-w|max-h)-/,
      /^(flex|grid|absolute|relative|fixed|sticky)/,
      /^(block|inline|inline-block|inline-flex|table|grid|hidden)$/,
      // ... 他のパターン
    ];
  }

  extractStyles(node: any): ExtractedStyleInfo[] {
    const styles: ExtractedStyleInfo[] = [];
    
    // className属性の解析
    if (node.type === 'JSXAttribute' && node.name?.name === 'className') {
      const classes = this.extractClassNames(node.value);
      classes.forEach(className => {
        if (this.isTailwindClass(className)) {
          styles.push({
            type: 'className',
            value: className
          });
        }
      });
    }

    return styles;
  }

  validateStyles(styles: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    styles.forEach(style => {
      if (!this.isTailwindClass(style)) {
        result.warnings.push({
          message: `'${style}' is not a valid Tailwind CSS class`,
          code: 'INVALID_TAILWIND_CLASS'
        });
      }
    });

    return result;
  }

  generateExamples(styles: ExtractedStyleInfo[]): string {
    const classes = styles.map(s => s.value).join(' ');
    return `<div className="${classes}">Example</div>`;
  }

  private extractClassNames(node: any): string[] {
    // 既存のTailwindClassExtractorの実装を移行
    if (node.type === 'Literal') {
      return node.value.split(/\s+/).filter(Boolean);
    }
    // ... 他の処理
    return [];
  }

  private isTailwindClass(className: string): boolean {
    return this.tailwindPatterns.some(pattern => pattern.test(className));
  }
}

// React Native StyleSheet Extractor
export class StyleSheetExtractor extends StyleExtractor {
  private reactNativeComponents = [
    'View', 'Text', 'ScrollView', 'TouchableOpacity', 'TouchableHighlight',
    'Image', 'TextInput', 'FlatList', 'SectionList', 'Modal', 'SafeAreaView'
  ];

  extractStyles(node: any): ExtractedStyleInfo[] {
    const styles: ExtractedStyleInfo[] = [];

    // StyleSheet.create() の解析
    if (this.isStyleSheetCreate(node)) {
      const styleObjects = this.extractStyleObjects(node);
      styleObjects.forEach(styleObj => {
        styles.push({
          type: 'stylesheet',
          value: styleObj,
          imports: ['StyleSheet'],
          source: 'StyleSheet.create()'
        });
      });
    }

    // style属性の解析（インラインスタイル）
    if (node.type === 'JSXAttribute' && node.name?.name === 'style') {
      const inlineStyles = this.extractInlineStyles(node.value);
      if (inlineStyles) {
        styles.push({
          type: 'inline',
          value: inlineStyles
        });
      }
    }

    // React Native固有コンポーネントのstyles prop参照
    if (this.isStyleReference(node)) {
      const styleRef = this.extractStyleReference(node);
      if (styleRef) {
        styles.push({
          type: 'stylesheet',
          value: styleRef,
          source: 'styles object reference'
        });
      }
    }

    return styles;
  }

  validateStyles(styles: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // React Native固有のスタイルバリデーション
    styles.forEach(style => {
      if (typeof style === 'string') {
        // className使用チェック
        if (style.includes('className')) {
          result.errors.push({
            message: 'className is not supported in React Native. Use style prop instead.',
            code: 'INVALID_RN_PROP'
          });
        }

        // Web固有CSSプロパティチェック
        const webOnlyProperties = ['boxShadow', 'textShadow', 'cursor', 'userSelect'];
        webOnlyProperties.forEach(prop => {
          if (style.includes(prop)) {
            result.warnings.push({
              message: `CSS property '${prop}' may not be supported in React Native`,
              code: 'UNSUPPORTED_CSS_PROP'
            });
          }
        });
      } else if (typeof style === 'object') {
        // React Native StyleSheetオブジェクトバリデーション
        this.validateStyleSheetProperties(style, result);
      }
    });

    return result;
  }

  private validateStyleSheetProperties(styleObj: any, result: ValidationResult): void {
    const unsupportedProps = ['boxShadow', 'textShadow', 'cursor', 'userSelect', 'float'];
    const deprecatedProps = ['tintColor']; // React Native 0.60+で非推奨

    Object.keys(styleObj).forEach(key => {
      if (unsupportedProps.includes(key)) {
        result.errors.push({
          message: `StyleSheet property '${key}' is not supported in React Native`,
          code: 'UNSUPPORTED_STYLESHEET_PROP'
        });
      }

      if (deprecatedProps.includes(key)) {
        result.warnings.push({
          message: `StyleSheet property '${key}' is deprecated in React Native`,
          code: 'DEPRECATED_STYLESHEET_PROP'
        });
      }

      // 値の型チェック
      const value = styleObj[key];
      if (key.endsWith('Color') && typeof value === 'string' && !this.isValidColor(value)) {
        result.warnings.push({
          message: `Color value '${value}' for '${key}' may not be valid`,
          code: 'INVALID_COLOR_VALUE'
        });
      }
    });
  }

  private isValidColor(color: string): boolean {
    // 基本的な色値の検証
    return /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|transparent|[a-z]+)/.test(color);
  }

  generateExamples(styles: ExtractedStyleInfo[]): string {
    const styleSheetStyles = styles.filter(s => s.type === 'stylesheet');
    const inlineStyles = styles.filter(s => s.type === 'inline');

    let example = `import { StyleSheet } from 'react-native';\n\n`;
    
    if (styleSheetStyles.length > 0) {
      example += `const styles = StyleSheet.create(${JSON.stringify(styleSheetStyles[0].value, null, 2)});\n\n`;
      example += `<View style={styles.container}>Example</View>`;
    } else if (inlineStyles.length > 0) {
      example += `<View style={${JSON.stringify(inlineStyles[0].value)}}>Example</View>`;
    }

    return example;
  }

  private isStyleSheetCreate(node: any): boolean {
    return node.type === 'CallExpression' &&
           node.callee?.type === 'MemberExpression' &&
           node.callee?.object?.name === 'StyleSheet' &&
           node.callee?.property?.name === 'create';
  }

  private extractStyleObjects(node: any): Record<string, any>[] {
    // StyleSheet.create()の引数からスタイルオブジェクトを抽出
    if (node.arguments?.[0]?.type === 'ObjectExpression') {
      const styles: Record<string, any> = {};
      node.arguments[0].properties.forEach((prop: any) => {
        if (prop.type === 'Property' && prop.key?.name) {
          styles[prop.key.name] = this.parseStyleValue(prop.value);
        }
      });
      return [styles];
    }
    return [];
  }

  private extractInlineStyles(node: any): Record<string, any> | null {
    if (node.type === 'JSXExpressionContainer' && node.expression?.type === 'ObjectExpression') {
      const styles: Record<string, any> = {};
      node.expression.properties.forEach((prop: any) => {
        if (prop.type === 'Property' && prop.key?.name) {
          styles[prop.key.name] = this.parseStyleValue(prop.value);
        }
      });
      return styles;
    }
    return null;
  }

  private parseStyleValue(node: any): any {
    if (node.type === 'Literal') {
      return node.value;
    } else if (node.type === 'UnaryExpression' && node.operator === '-') {
      return -this.parseStyleValue(node.argument);
    }
    return node.raw || 'unknown';
  }

  private isStyleReference(node: any): boolean {
    return node.type === 'JSXAttribute' && 
           node.name?.name === 'style' &&
           node.value?.type === 'JSXExpressionContainer' &&
           node.value?.expression?.type === 'MemberExpression';
  }

  private extractStyleReference(node: any): string | null {
    if (node.value?.expression?.object?.name === 'styles' && 
        node.value?.expression?.property?.name) {
      return `styles.${node.value.expression.property.name}`;
    }
    return null;
  }

  // React Nativeコンポーネント検出
  isReactNativeComponent(componentName: string): boolean {
    return this.reactNativeComponents.includes(componentName);
  }

  // Platform.OS分岐の検出
  isPlatformSpecific(node: any): boolean {
    return node.type === 'MemberExpression' &&
           node.object?.name === 'Platform' &&
           node.property?.name === 'OS';
  }
}

// Styled Components Extractor
export class StyledComponentsExtractor extends StyleExtractor {
  extractStyles(node: any): ExtractedStyleInfo[] {
    const styles: ExtractedStyleInfo[] = [];

    // styled.div`...` の解析
    if (this.isStyledComponent(node)) {
      const styledCss = this.extractStyledCSS(node);
      if (styledCss) {
        styles.push({
          type: 'styled-component',
          value: styledCss,
          imports: ['styled-components']
        });
      }
    }

    return styles;
  }

  validateStyles(styles: string[]): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  generateExamples(styles: ExtractedStyleInfo[]): string {
    const styledComponent = styles.find(s => s.type === 'styled-component');
    if (styledComponent) {
      return `import styled from 'styled-components';\n\nconst StyledDiv = styled.div\`\n${styledComponent.value}\n\`;\n\n<StyledDiv>Example</StyledDiv>`;
    }
    return '';
  }

  private isStyledComponent(node: any): boolean {
    return node.type === 'TaggedTemplateExpression' &&
           node.tag?.type === 'MemberExpression' &&
           node.tag?.object?.name === 'styled';
  }

  private extractStyledCSS(node: any): string | null {
    if (node.quasi?.quasis) {
      return node.quasi.quasis.map((quasi: any) => quasi.value.raw).join('${...}');
    }
    return null;
  }
}

// CSS Modules Extractor
export class CSSModulesExtractor extends StyleExtractor {
  extractStyles(node: any): ExtractedStyleInfo[] {
    const styles: ExtractedStyleInfo[] = [];

    // styles.className の解析
    if (this.isCSSModuleReference(node)) {
      const className = this.extractCSSModuleClass(node);
      if (className) {
        styles.push({
          type: 'className',
          value: className,
          imports: ['./styles.module.css']
        });
      }
    }

    return styles;
  }

  validateStyles(styles: string[]): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  generateExamples(styles: ExtractedStyleInfo[]): string {
    return `import styles from './Component.module.css';\n\n<div className={styles.container}>Example</div>`;
  }

  private isCSSModuleReference(node: any): boolean {
    return node.type === 'MemberExpression' &&
           node.object?.name === 'styles';
  }

  private extractCSSModuleClass(node: any): string | null {
    if (node.property?.name) {
      return node.property.name;
    }
    return null;
  }
}

// ファクトリークラス
export class StyleExtractorFactory {
  static createExtractor(styleSystem: StyleSystem | string, config: ExtractorConfig): StyleExtractor {
    const configManager = ConfigManager.getInstance();
    
    // 標準のスタイルシステム
    switch (styleSystem) {
      case 'tailwind':
        return new TailwindStyleExtractor(config);
      case 'stylesheet':
        return new StyleSheetExtractor(config);
      case 'styled-components':
        return new StyledComponentsExtractor(config);
      case 'css-modules':
        return new CSSModulesExtractor(config);
      default:
        // カスタムスタイルシステムの処理
        if (configManager.isCustomStyleSystem(styleSystem)) {
          return this.createCustomExtractor(styleSystem, config);
        }
        throw new Error(`Unsupported style system: ${styleSystem}`);
    }
  }

  private static createCustomExtractor(styleSystem: string, config: ExtractorConfig): StyleExtractor {
    const configManager = ConfigManager.getInstance();
    const customConfig = configManager.getConfig().extensions.customStyleSystems[styleSystem];
    
    if (!customConfig) {
      throw new Error(`Custom style system not found: ${styleSystem}`);
    }

    // 動的にカスタムエクストラクターを読み込み
    try {
      const ExtractorClass = require(customConfig.extractor);
      return new ExtractorClass(config);
    } catch (error) {
      throw new Error(`Failed to load custom style extractor: ${customConfig.extractor}`);
    }
  }

  // 複数のスタイルシステムを組み合わせる場合
  static createMultiExtractor(styleSystems: (StyleSystem | string)[], config: ExtractorConfig): StyleExtractor[] {
    return styleSystems.map(system => this.createExtractor(system, config));
  }
}