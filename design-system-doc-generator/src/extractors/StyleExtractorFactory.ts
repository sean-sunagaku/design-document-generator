import { Platform, StyleSystem, ExtractorConfig, StyleInfo as BaseStyleInfo } from '../types';
import { ConfigManager } from '../config/ConfigManager';

/**
 * StyleExtractorFactory - マルチプラットフォーム対応スタイル抽出ファクトリー
 * 
 * このファイルには、異なるスタイルシステム（Tailwind CSS、React Native StyleSheet、
 * Styled Components、CSS Modules）に対応した抽出器を統一的に管理するファクトリーパターンと、
 * 各プラットフォーム固有のスタイル抽出・検証・例示機能を提供するクラス群が含まれています。
 * 
 * アーキテクチャパターン:
 * - Factory Pattern: 設定に基づいて適切なエクストラクターを生成
 * - Strategy Pattern: プラットフォーム毎の異なるスタイル抽出戦略
 * - Template Method Pattern: 共通インターフェースによる処理の統一化
 * - Plugin Architecture: カスタムスタイルシステムの動的読み込み
 * 
 * 主な機能:
 * - 複数スタイルシステムの統一的な処理
 * - プラットフォーム固有の制約・バリデーション
 * - コード例生成とドキュメント化支援
 * - 拡張可能なカスタムエクストラクター対応
 * 
 * 対応スタイルシステム:
 * - Tailwind CSS (Web)
 * - React Native StyleSheet
 * - Styled Components
 * - CSS Modules
 * - カスタムスタイルシステム（プラグイン対応）
 */

/**
 * StyleExtractor - スタイル抽出器の抽象基底クラス
 * 
 * 全てのスタイルシステム専用エクストラクターが実装すべき共通インターフェースを定義します。
 * Template Method パターンにより、各プラットフォームで一貫した処理フローを保証します。
 * 
 * 抽象メソッド:
 * - extractStyles: ASTノードからスタイル情報を抽出
 * - validateStyles: 抽出されたスタイルの妥当性検証
 * - generateExamples: ドキュメント用コード例の生成
 */
export abstract class StyleExtractor {
  protected config: ExtractorConfig;  // 抽出設定（全サブクラス共通）

  /**
   * 基底コンストラクタ
   * @param config 抽出器設定
   */
  constructor(config: ExtractorConfig) {
    this.config = config;
  }

  /**
   * ASTノードからスタイル情報を抽出（抽象メソッド）
   * @param node 解析対象のASTノード
   * @returns 抽出されたスタイル情報の配列
   */
  abstract extractStyles(node: any): ExtractedStyleInfo[];
  
  /**
   * 抽出されたスタイルの妥当性を検証（抽象メソッド）
   * @param styles 検証対象のスタイル配列
   * @returns 検証結果（エラー・警告を含む）
   */
  abstract validateStyles(styles: string[]): ValidationResult;
  
  /**
   * ドキュメント用のコード例を生成（抽象メソッド）
   * @param styles 例示対象のスタイル情報
   * @returns 生成されたコード例文字列
   */
  abstract generateExamples(styles: ExtractedStyleInfo[]): string;
}

/**
 * ExtractedStyleInfo - 抽出されたスタイル情報
 * 
 * 異なるスタイルシステムから抽出されたスタイル情報を統一的に表現するための
 * データ構造です。プラットフォーム固有の情報も含めて管理します。
 */
export interface ExtractedStyleInfo {
  type: 'className' | 'inline' | 'stylesheet' | 'styled-component';  // スタイルの種類
  value: string | Record<string, any>;   // スタイルの値（文字列またはオブジェクト）
  source?: string;                       // ソースファイルパス（StyleSheetの場合）
  imports?: string[];                    // 必要なimport文（React Nativeなど）
}

/**
 * ValidationResult - スタイル検証結果
 * 
 * スタイルの妥当性検証結果を格納します。エラーと警告を区別して管理し、
 * 位置情報とエラーコードも含めて詳細な診断情報を提供します。
 */
export interface ValidationResult {
  isValid: boolean;      // 全体的な妥当性
  errors: StyleError[];  // 致命的エラー一覧
  warnings: StyleWarning[];  // 警告一覧
}

/**
 * StyleError - スタイルエラー情報
 * 
 * 修正が必要な致命的なスタイルエラーの詳細情報です。
 */
export interface StyleError {
  message: string;    // エラーメッセージ
  line?: number;      // 行番号（オプション）
  column?: number;    // 列番号（オプション）
  code?: string;      // エラーコード（分類用）
}

/**
 * StyleWarning - スタイル警告情報
 * 
 * 修正が推奨されるが致命的ではない警告の詳細情報です。
 */
export interface StyleWarning {
  message: string;    // 警告メッセージ
  line?: number;      // 行番号（オプション）
  column?: number;    // 列番号（オプション）
  code?: string;      // 警告コード（分類用）
}

/**
 * TailwindStyleExtractor - Tailwind CSS専用スタイル抽出器
 * 
 * Webプラットフォーム向けのTailwind CSSクラスを抽出・検証・例示する専門クラスです。
 * 高度なパターンマッチングと包括的なクラス検証機能を提供します。
 * 
 * 主な機能:
 * - 静的・動的クラス名の抽出
 * - Tailwindパターンマッチング
 * - レスポンシブ・状態クラスの検出
 * - 無効クラスの検証と警告
 * - HTMLコード例の生成
 */
export class TailwindStyleExtractor extends StyleExtractor {
  private tailwindPatterns: RegExp[];

  constructor(config: ExtractorConfig) {
    super(config);
    this.tailwindPatterns = [
      // Spacing and layout
      /^(p|pl|pr|pt|pb|px|py|m|ml|mr|mt|mb|mx|my)-/,
      /^(w|h|min-w|min-h|max-w|max-h)-/,
      /^(flex|grid|absolute|relative|fixed|sticky)/,
      /^(block|inline|inline-block|inline-flex|table|grid|hidden)$/,
      /^(justify|items|content|self)-/,
      /^(space|gap|col|row)-/,
      /^(inset|top|right|bottom|left)-/,
      
      // Colors and backgrounds
      /^(bg|text|border|ring|shadow|fill|stroke)-/,
      /^(placeholder|caret|accent|decoration)-/,
      
      // Typography
      /^(font|text|leading|tracking|align|decoration|whitespace|break|list)-/,
      
      // Borders and effects
      /^(border|rounded|ring|shadow|outline)-/,
      /^(opacity|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop)-/,
      
      // Animations and transitions
      /^(animate|transition|duration|delay|ease)-/,
      /^(transform|scale|rotate|translate|skew|origin)-/,
      
      // States and responsive
      /^(hover|focus|active|disabled|dark|group-hover|group-focus|peer|visited|target|first|last|odd|even):/,
      /^(sm|md|lg|xl|2xl):/,
      
      // Interactive
      /^(cursor|select|resize|appearance|pointer-events|user-select)-/,
      
      // Layout utilities
      /^(float|clear|object|overflow|overscroll|scroll)-/,
      /^(z)-/,
      
      // Special cases - standalone classes
      /^(flex|grid|table|block|inline|hidden|sr-only|not-sr-only|visible|invisible|static|fixed|absolute|relative|sticky|truncate|antialiased|subpixel-antialiased|italic|not-italic|uppercase|lowercase|capitalize|normal-case|underline|line-through|no-underline|rounded|rounded-full|border)$/,
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
    if (node?.type === 'Literal' && typeof node.value === 'string') {
      return node.value.split(/\s+/).filter(Boolean);
    }
    
    if (node?.type === 'TemplateLiteral') {
      // テンプレートリテラルから文字列部分を抽出
      let result = '';
      if (node.quasis) {
        node.quasis.forEach((quasi: any) => {
          if (quasi.value?.raw) {
            result += quasi.value.raw + ' ';
          }
        });
      }
      return result.split(/\s+/).filter(Boolean);
    }

    if (node?.type === 'JSXExpressionContainer') {
      return this.extractClassNames(node.expression);
    }

    return [];
  }

  private isTailwindClass(className: string): boolean {
    // 空文字やスペースのみの場合は無効
    if (!className || !className.trim()) {
      return false;
    }

    // 明らかにカスタムクラスと思われるパターンを除外
    const customPatterns = [
      /^custom-/,    // custom-で始まる
      /component/,   // componentを含む
      /^my-(?!\d)/,  // my-で始まるがTailwindの数値パターンでないもの（my-1, my-2等はTailwind）
      /^[a-z]+-[a-z]+-[a-z]+$/  // 3つの単語をハイフンで繋いだもの（一般的でないパターン）
    ];

    // カスタムパターンに一致する場合はTailwindクラスではない
    if (customPatterns.some(pattern => pattern.test(className))) {
      return false;
    }

    // 不完全なクラス名（ハイフンで終わるなど）を除外
    if (className.endsWith('-') || className.startsWith('-')) {
      return false;
    }

    // Tailwindパターンに一致するかチェック
    return this.tailwindPatterns.some(pattern => pattern.test(className));
  }
}

/**
 * StyleSheetExtractor - React Native StyleSheet専用抽出器
 * 
 * React Nativeプラットフォーム向けのStyleSheet.create()スタイル抽出器です。
 * Web固有のCSSプロパティを検出して警告を出し、React Native固有の制約を
 * 検証する機能を提供します。
 * 
 * 主な機能:
 * - StyleSheet.create()の解析
 * - インラインスタイルの抽出
 * - styles参照の検出
 * - React Native制約の検証
 * - Web非互換プロパティの警告
 * - React Nativeコード例の生成
 * - Platform.OS分岐の検出
 */
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
            // Determine if it's a stylesheet property (prop: value) or just mentioned
            if (style.includes(`${prop}:`)) {
              result.errors.push({
                message: `StyleSheet property '${prop}' is not supported in React Native`,
                code: 'UNSUPPORTED_STYLESHEET_PROP'
              });
            } else {
              result.warnings.push({
                message: `CSS property '${prop}' may not be supported in React Native`,
                code: 'UNSUPPORTED_CSS_PROP'
              });
            }
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
    const isStyleSheet = node.type === 'CallExpression' &&
           node.callee?.type === 'MemberExpression' &&
           node.callee?.object?.name === 'StyleSheet' &&
           node.callee?.property?.name === 'create';
    
    if (isStyleSheet) {
      console.log('Found StyleSheet.create()');
    }
    
    return isStyleSheet;
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
    } else if (node.type === 'ObjectExpression') {
      // Handle nested object expressions
      const obj: Record<string, any> = {};
      node.properties.forEach((prop: any) => {
        if (prop.type === 'Property' && prop.key?.name) {
          obj[prop.key.name] = this.parseStyleValue(prop.value);
        }
      });
      return obj;
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

/**
 * StyledComponentsExtractor - Styled Components専用抽出器
 * 
 * CSS-in-JSライブラリのStyled Componentsのテンプレートリテラルから
 * CSSスタイルを抽出する専門クラスです。
 * 
 * 主な機能:
 * - tagged template literalの解析
 * - CSS文字列の抽出
 * - Styled Componentsコード例の生成
 */
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

/**
 * CSSModulesExtractor - CSS Modules専用抽出器
 * 
 * CSS Modulesのスタイル参照（styles.className）を検出・抽出する
 * 専門クラスです。
 * 
 * 主な機能:
 * - styles.className参照の検出
 * - CSSモジュールクラス名の抽出
 * - CSS Modulesコード例の生成
 */
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

/**
 * StyleExtractorFactory - スタイル抽出器ファクトリー
 * 
 * 設定に基づいて適切なStyleExtractorインスタンスを生成するファクトリークラスです。
 * Factory Patternにより、各プラットフォーム・スタイルシステムに特化した
 * 抽出器を統一的なインターフェースで提供し、カスタムエクストラクターの
 * 動的読み込みもサポートします。
 * 
 * サポート機能:
 * - 標準スタイルシステムの自動選択
 * - カスタムスタイルシステムの動的読み込み
 * - 複数スタイルシステムの組み合わせ対応
 * - 設定ベースの柔軟な拡張性
 * 
 * 標準対応:
 * - tailwind: TailwindStyleExtractor
 * - stylesheet: StyleSheetExtractor
 * - styled-components: StyledComponentsExtractor
 * - css-modules: CSSModulesExtractor
 */
export class StyleExtractorFactory {
  /**
   * 指定されたスタイルシステムに対応する抽出器を生成
   * 
   * 設定されたスタイルシステムに基づいて適切なStyleExtractorを選択・生成します。
   * 標準対応のスタイルシステムに加え、ConfigManagerに登録された
   * カスタムスタイルシステムにも対応します。
   * 
   * @param styleSystem 対象のスタイルシステム名
   * @param config 抽出器設定
   * @returns 対応するStyleExtractorインスタンス
   * @throws {Error} 未対応のスタイルシステムの場合
   */
  static createExtractor(styleSystem: StyleSystem | string, config: ExtractorConfig): StyleExtractor {
    const configManager = ConfigManager.getInstance();
    
    // 標準スタイルシステムの選択と生成
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
        // カスタムスタイルシステムの動的読み込み
        if (configManager.isCustomStyleSystem(styleSystem)) {
          return this.createCustomExtractor(styleSystem, config);
        }
        throw new Error(`Unsupported style system: ${styleSystem}`);
    }
  }

  /**
   * カスタムスタイルシステム用抽出器の動的生成
   * 
   * ConfigManagerに登録されたカスタムスタイルシステム設定に基づいて、
   * 外部モジュールから抽出器クラスを動的に読み込んで生成します。
   * 
   * @param styleSystem カスタムスタイルシステム名
   * @param config 抽出器設定
   * @returns 動的に読み込まれたStyleExtractorインスタンス
   * @throws {Error} 設定が見つからない、またはモジュール読み込みに失敗した場合
   */
  private static createCustomExtractor(styleSystem: string, config: ExtractorConfig): StyleExtractor {
    const configManager = ConfigManager.getInstance();
    const customConfig = configManager.getConfig().extensions.customStyleSystems[styleSystem];
    
    if (!customConfig) {
      throw new Error(`Custom style system not found: ${styleSystem}`);
    }

    // 外部モジュールの動的読み込みと抽出器クラスのインスタンス化
    try {
      const ExtractorClass = require(customConfig.extractor);
      return new ExtractorClass(config);
    } catch (error) {
      throw new Error(`Failed to load custom style extractor: ${customConfig.extractor}`);
    }
  }

  /**
   * 複数スタイルシステム対応の抽出器配列を生成
   * 
   * 複数のスタイルシステムが混在するプロジェクト（例: Tailwind + CSS Modules）
   * に対応するため、指定された全スタイルシステムの抽出器を生成します。
   * 
   * 使用例:
   * - モノレポでプラットフォーム毎に異なるスタイルシステム
   * - 段階的な移行期間での並行利用
   * - コンポーネントライブラリでの複数形式サポート
   * 
   * @param styleSystems 対象スタイルシステム名の配列
   * @param config 共通の抽出器設定
   * @returns 各スタイルシステムに対応するStyleExtractor配列
   */
  static createMultiExtractor(styleSystems: (StyleSystem | string)[], config: ExtractorConfig): StyleExtractor[] {
    return styleSystems.map(system => this.createExtractor(system, config));
  }
}