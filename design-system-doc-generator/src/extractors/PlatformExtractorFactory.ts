import { Platform, ExtractorConfig, ExtractedComponent, ValidationResult } from '../types';
import { ConfigManager } from '../config/ConfigManager';

// 抽象基底クラス
export abstract class PlatformExtractor {
  protected config: ExtractorConfig;

  constructor(config: ExtractorConfig) {
    this.config = config;
  }

  abstract detectPlatform(filePath: string): Platform | null;
  abstract extractComponents(filePath: string, ast: any): Promise<ExtractedComponent[]>;
  abstract validateCode(code: string): ValidationResult;
  abstract generateExamples(component: ExtractedComponent): string[];
  abstract isValidComponent(componentName: string): boolean;
}

// Web Platform Extractor (既存機能の移行)
export class WebPlatformExtractor extends PlatformExtractor {
  private webFileExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  private webFrameworkIndicators = ['react', 'next', 'gatsby'];

  detectPlatform(filePath: string): Platform | null {
    // ファイル拡張子チェック
    if (!this.webFileExtensions.some(ext => filePath.endsWith(ext))) {
      return null;
    }

    // React Nativeファイルでないことを確認
    if (filePath.includes('.native.') || 
        filePath.includes('/native/') ||
        filePath.includes('react-native')) {
      return null;
    }

    return 'web';
  }

  async extractComponents(filePath: string, ast: any): Promise<ExtractedComponent[]> {
    // 既存のTailwindExtractorのロジックを使用
    // ここでは簡略化した実装
    return [];
  }

  validateCode(code: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Web固有バリデーション
    if (code.includes('StyleSheet.create')) {
      result.warnings.push({
        line: 0,
        column: 0,
        message: 'StyleSheet.create is React Native specific and may not work in web',
        code: 'RN_SPECIFIC_API'
      });
    }

    return result;
  }

  generateExamples(component: ExtractedComponent): string[] {
    const examples: string[] = [];

    // Tailwind CSS例を生成
    if (component.tailwindClasses.length > 0) {
      const classes = component.tailwindClasses.join(' ');
      examples.push(`<${component.componentName} className="${classes}">
  Example content
</${component.componentName}>`);
    }

    return examples;
  }

  isValidComponent(componentName: string): boolean {
    // HTMLタグとReactコンポーネントを判定
    const htmlTags = ['div', 'span', 'button', 'input', 'form', 'section', 'article'];
    return !htmlTags.includes(componentName.toLowerCase()) &&
           /^[A-Z]/.test(componentName);
  }
}

// React Native Platform Extractor
export class ReactNativePlatformExtractor extends PlatformExtractor {
  private reactNativeFileExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  private reactNativeComponents = [
    'View', 'Text', 'ScrollView', 'TouchableOpacity', 'TouchableHighlight',
    'Image', 'TextInput', 'FlatList', 'SectionList', 'Modal', 'SafeAreaView',
    'StatusBar', 'Switch', 'Slider', 'Picker', 'Alert'
  ];
  private reactNativeAPIs = [
    'Platform', 'Dimensions', 'AsyncStorage', 'NetInfo', 'Linking',
    'Clipboard', 'Vibration', 'BackHandler'
  ];

  detectPlatform(filePath: string): Platform | null {
    // React Native固有のファイルパターン
    if (filePath.includes('.native.') ||
        filePath.includes('/native/') ||
        filePath.includes('react-native') ||
        filePath.includes('/android/') ||
        filePath.includes('/ios/')) {
      return 'react-native';
    }

    // ファイル拡張子チェック
    if (!this.reactNativeFileExtensions.some(ext => filePath.endsWith(ext))) {
      return null;
    }

    // TODO: ファイル内容をチェックしてReact Nativeコンポーネントの使用を検出
    return null;
  }

  async extractComponents(filePath: string, ast: any): Promise<ExtractedComponent[]> {
    const components: ExtractedComponent[] = [];
    
    // React Native固有の抽出ロジック
    // StyleSheet.create()の検出
    // React Nativeコンポーネントの使用検出
    // Platform.OS分岐の検出

    return components;
  }

  validateCode(code: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // React Native固有バリデーション
    if (code.includes('className')) {
      result.errors.push({
        line: 0,
        column: 0,
        message: 'className is not supported in React Native. Use style prop instead.',
        code: 'INVALID_RN_PROP'
      });
    }

    // Web固有CSSプロパティチェック
    const webOnlyCSS = ['box-shadow', 'text-shadow', 'cursor', 'user-select'];
    webOnlyCSS.forEach(prop => {
      if (code.includes(prop)) {
        result.warnings.push({
          line: 0,
          column: 0,
          message: `CSS property '${prop}' is not supported in React Native`,
          code: 'UNSUPPORTED_CSS'
        });
      }
    });

    return result;
  }

  generateExamples(component: ExtractedComponent): string[] {
    const examples: string[] = [];

    // StyleSheet例を生成
    if (component.styleInfo?.type === 'stylesheet') {
      examples.push(`import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
});

<${component.componentName} style={styles.container}>
  Example content
</${component.componentName}>`);
    }

    // インライン例を生成
    examples.push(`<${component.componentName} style={{
  backgroundColor: '#ffffff',
  padding: 16,
  borderRadius: 8,
}}>
  Example content
</${component.componentName}>`);

    return examples;
  }

  isValidComponent(componentName: string): boolean {
    // React Nativeコンポーネントまたはカスタムコンポーネント
    return this.reactNativeComponents.includes(componentName) ||
           /^[A-Z]/.test(componentName);
  }

  // React Native固有メソッド
  extractPlatformSpecificCode(ast: any): PlatformSpecificCode[] {
    const platformCode: PlatformSpecificCode[] = [];
    
    // Platform.OS === 'ios' などの分岐を検出
    // Platform.select() の使用を検出
    
    return platformCode;
  }

  extractStyleSheetUsage(ast: any): StyleSheetUsage[] {
    const styleSheets: StyleSheetUsage[] = [];
    
    // StyleSheet.create()の使用を検出
    // styles.プロパティの参照を検出
    
    return styleSheets;
  }

  detectReactNativeAPIs(code: string): string[] {
    return this.reactNativeAPIs.filter(api => 
      code.includes(api) || code.includes(`from 'react-native'`) && code.includes(api)
    );
  }
}

// 型定義
export interface PlatformSpecificCode {
  type: 'Platform.OS' | 'Platform.select' | 'conditional';
  condition: string;
  iosCode?: string;
  androidCode?: string;
  webCode?: string;
  line?: number;
}

export interface StyleSheetUsage {
  name: string;
  properties: Record<string, any>;
  usageCount: number;
  line?: number;
}

// ファクトリークラス
export class PlatformExtractorFactory {
  static createExtractor(platform: Platform | string, config: ExtractorConfig): PlatformExtractor {
    const configManager = ConfigManager.getInstance();
    
    switch (platform) {
      case 'web':
        return new WebPlatformExtractor(config);
      case 'react-native':
        return new ReactNativePlatformExtractor(config);
      default:
        // カスタムプラットフォームの処理
        if (configManager.isCustomPlatform(platform)) {
          return this.createCustomExtractor(platform, config);
        }
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private static createCustomExtractor(platform: string, config: ExtractorConfig): PlatformExtractor {
    const configManager = ConfigManager.getInstance();
    const customConfig = configManager.getConfig().extensions.customPlatforms[platform];
    
    if (!customConfig) {
      throw new Error(`Custom platform not found: ${platform}`);
    }

    // 動的にカスタムプラットフォームエクストラクターを読み込み
    try {
      const ExtractorClass = require(customConfig.styleExtractor);
      return new ExtractorClass(config);
    } catch (error) {
      throw new Error(`Failed to load custom platform extractor: ${customConfig.styleExtractor}`);
    }
  }

  // プラットフォーム自動検出
  static detectPlatform(filePath: string, config: ExtractorConfig): Platform | null {
    const extractors = [
      new ReactNativePlatformExtractor(config),
      new WebPlatformExtractor(config)
    ];

    for (const extractor of extractors) {
      const platform = extractor.detectPlatform(filePath);
      if (platform) {
        return platform;
      }
    }

    return null;
  }

  // 複数プラットフォーム対応
  static createMultiPlatformExtractor(platforms: (Platform | string)[], config: ExtractorConfig): PlatformExtractor[] {
    return platforms.map(platform => this.createExtractor(platform, config));
  }
}