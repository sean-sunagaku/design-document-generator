import { ExtractedComponent, Platform, StyleSystem, GeneratorOptions, AIDocument, ComponentDoc } from '../types';
import { ConfigManager } from '../config/ConfigManager';
import { ComponentDocumentGenerator } from './document/ComponentDocumentGenerator';
import { StyleExtractorFactory } from '../extractors/StyleExtractorFactory';
import { PlatformExtractorFactory } from '../extractors/PlatformExtractorFactory';

/**
 * マルチプラットフォームドキュメント生成オプション
 * 
 * 複数プラットフォーム対応のドキュメント生成における
 * 詳細な制御オプションを定義します。
 */
export interface MultiPlatformDocumentOptions extends GeneratorOptions {
  /** 対象プラットフォーム一覧 */
  platforms: Platform[];
  /** プラットフォーム間比較の生成有無 */
  generateComparison: boolean;
  /** スタイル変換例の生成有無 */
  includeStyleConversion: boolean;
}

/**
 * プラットフォーム固有ドキュメント
 * 
 * 単一プラットフォーム向けに生成された
 * 完全なドキュメントパッケージを表現します。
 */
export interface PlatformSpecificDocument {
  /** 対象プラットフォーム */
  platform: Platform;
  /** 生成されたAIドキュメント */
  document: AIDocument;
  /** プラットフォーム固有のコンポーネントドキュメント一覧 */
  components: ComponentDoc[];
}

/**
 * クロスプラットフォームコンポーネント分析結果
 * 
 * 複数プラットフォームで共通利用されるコンポーネントの
 * 差異分析と統合情報を格納します。
 */
export interface CrossPlatformComponent {
  /** コンポーネント名 */
  componentName: string;
  /** プラットフォーム別のコンポーネント実装 */
  platforms: {
    [key in Platform]?: ComponentDoc;
  };
  /** 全プラットフォーム共通のProps */
  sharedProps: any[];
  /** プラットフォーム間の差異一覧 */
  platformDifferences: PlatformDifference[];
}

/**
 * プラットフォーム間差異
 * 
 * 同一コンポーネントのプラットフォーム間での
 * 具体的な差異を詳細に記録します。
 */
export interface PlatformDifference {
  /** 差異のあるプラットフォーム */
  platform: Platform;
  /** 差異のタイプ */
  type: 'styling' | 'props' | 'behavior' | 'imports';
  /** 差異の説明 */
  description: string;
  /** 具体的なコード例（任意） */
  example?: string;
}

/**
 * MultiPlatformDocumentGenerator - マルチプラットフォーム対応ドキュメント生成エンジン
 * 
 * このクラスは、Web（React）とReact Nativeなど複数のプラットフォームで
 * 動作するコンポーネントを統合的に文書化する専門ジェネレーターです。
 * 
 * 主な機能：
 * 1. プラットフォーム固有ドキュメントの生成
 * 2. クロスプラットフォーム分析と差異検出
 * 3. 統合ドキュメントの生成
 * 4. スタイル変換例の提供
 * 5. プラットフォーム間比較レポート
 * 
 * 対応プラットフォーム：
 * - Web（React + Tailwind CSS）
 * - React Native（StyleSheet）
 * - 将来的に他のプラットフォームへの拡張対応
 * 
 * アーキテクチャ上の位置：
 * このクラスは、個別のAIDocumentGeneratorを拡張し、
 * プラットフォーム横断的な視点でのドキュメント生成を担います。
 * 
 * 活用場面：
 * - マルチプラットフォーム開発チーム向けドキュメント
 * - プラットフォーム移行時の差異把握
 * - 統一されたデザインシステムの維持
 * - 開発者オンボーディング資料
 */
export class MultiPlatformDocumentGenerator {
  private configManager: ConfigManager;
  private componentDocGenerator: ComponentDocumentGenerator;

  /**
   * MultiPlatformDocumentGeneratorのコンストラクタ
   * 
   * 設定管理とコンポーネントドキュメント生成器を初期化します。
   * Singletonパターンを使用してシステム全体の設定を共有します。
   */
  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.componentDocGenerator = new ComponentDocumentGenerator();
  }

  /**
   * マルチプラットフォームドキュメント生成のメイン処理
   * 
   * 複数のプラットフォームのコンポーネント情報を統合的に処理し、
   * プラットフォーム固有ドキュメント、クロスプラットフォーム分析、
   * 統合ドキュメントを包括的に生成します。
   * 
   * 処理フロー：
   * 1. 各プラットフォーム固有のドキュメント生成
   * 2. クロスプラットフォーム差異分析（オプション）
   * 3. 統合ドキュメントの作成
   * 4. 結果の集約と返却
   * 
   * @param componentsByPlatform - プラットフォーム別のコンポーネント情報
   * @param options - マルチプラットフォーム生成オプション
   * @returns 生成されたドキュメント群
   * 
   * 戻り値の構造：
   * - platformDocuments: 各プラットフォーム専用ドキュメント
   * - crossPlatformAnalysis: プラットフォーム間差異分析
   * - unifiedDocument: 統合ドキュメント
   * 
   * 例：
   * ```typescript
   * const result = await generator.generateMultiPlatformDocumentation(
   *   new Map([
   *     ['web', webComponents],
   *     ['react-native', rnComponents]
   *   ]),
   *   { 
   *     platforms: ['web', 'react-native'],
   *     generateComparison: true,
   *     includeStyleConversion: true
   *   }
   * );
   * ```
   */
  async generateMultiPlatformDocumentation(
    componentsByPlatform: Map<Platform, ExtractedComponent[]>,
    options: MultiPlatformDocumentOptions
  ): Promise<{
    platformDocuments: PlatformSpecificDocument[];
    crossPlatformAnalysis: CrossPlatformComponent[];
    unifiedDocument: AIDocument;
  }> {
    const platformDocuments: PlatformSpecificDocument[] = [];
    const crossPlatformComponents: CrossPlatformComponent[] = [];

    // フェーズ1: 各プラットフォームごとのドキュメント生成
    // 各プラットフォームの特性を活かした専用ドキュメントを作成
    for (const [platform, components] of componentsByPlatform) {
      const platformDoc = await this.generatePlatformSpecificDocument(
        platform,
        components,
        options
      );
      platformDocuments.push(platformDoc);
    }

    // フェーズ2: クロスプラットフォーム分析（オプション）
    // プラットフォーム間の差異と共通点を詳細分析
    if (options.generateComparison) {
      const crossPlatformAnalysis = this.analyzeCrossPlatformComponents(platformDocuments);
      crossPlatformComponents.push(...crossPlatformAnalysis);
    }

    // フェーズ3: 統合ドキュメント生成
    // 全プラットフォームを横断した統一視点のドキュメント作成
    const unifiedDocument = this.generateUnifiedDocument(
      platformDocuments,
      crossPlatformComponents,
      options
    );

    return {
      platformDocuments,
      crossPlatformAnalysis: crossPlatformComponents,
      unifiedDocument
    };
  }

  /**
   * プラットフォーム固有ドキュメント生成処理
   * 
   * 指定されたプラットフォーム向けに最適化されたドキュメントを生成します。
   * プラットフォーム特有の機能、制約、ベストプラクティスを反映した
   * 専門的なドキュメントを作成します。
   * 
   * @param platform - 対象プラットフォーム
   * @param components - プラットフォーム用のコンポーネント一覧
   * @param options - 生成オプション
   * @returns プラットフォーム固有ドキュメント
   * 
   * 処理内容：
   * 1. 基本コンポーネントドキュメント生成
   * 2. プラットフォーム固有の例示コード生成
   * 3. プラットフォーム用ガイドライン適用
   * 4. 統合ドキュメント構造への変換
   */
  private async generatePlatformSpecificDocument(
    platform: Platform,
    components: ExtractedComponent[],
    options: MultiPlatformDocumentOptions
  ): Promise<PlatformSpecificDocument> {
    const config = this.configManager.getConfig();
    const platformComponents: ComponentDoc[] = [];

    // 各コンポーネントのプラットフォーム固有ドキュメント生成
    for (const component of components) {
      const componentDoc = this.componentDocGenerator.generateComponentDoc(
        component,
        components,
        options
      );

      // プラットフォーム固有の例示コード生成
      // 各プラットフォームの慣習とベストプラクティスを反映
      componentDoc.examples = await this.generatePlatformSpecificExamples(
        component,
        platform,
        options
      );

      platformComponents.push(componentDoc);
    }

    const document: AIDocument = {
      version: '2.0',
      generated: new Date().toISOString(),
      project: {
        name: config.source?.dir || 'Project',
        version: '1.0.0',
        framework: this.getPlatformFramework(platform),
        styling: config.styleSystem as string
      },
      tokens: {
        colors: {},
        spacing: {},
        typography: {
          fontFamily: {},
          fontSize: {},
          fontWeight: {},
          lineHeight: {}
        },
        breakpoints: {},
        shadows: {},
        borderRadius: {},
        custom: {}
      }, // TODO: トークン抽出
      components: platformComponents,
      patterns: [],
      guidelines: this.generatePlatformGuidelines(platform)
    };

    return {
      platform,
      document,
      components: platformComponents
    };
  }

  private async generatePlatformSpecificExamples(
    component: ExtractedComponent,
    platform: Platform,
    options: MultiPlatformDocumentOptions
  ): Promise<any[]> {
    const examples: any[] = [];
    const config = this.configManager.getConfig();

    try {
      const extractorConfig = {
        sourceDir: config.source.dir,
        platform
      };

      const platformExtractor = PlatformExtractorFactory.createExtractor(platform, extractorConfig);
      const platformExamples = platformExtractor.generateExamples(component);

      platformExamples.forEach(example => {
        examples.push({
          title: `${platform} Example`,
          code: example,
          platform: platform,
          description: `Platform-specific implementation for ${platform}`
        });
      });

      // スタイル変換例を含める場合
      if (options.includeStyleConversion) {
        const conversionExamples = await this.generateStyleConversionExamples(component, platform);
        examples.push(...conversionExamples);
      }

    } catch (error) {
      console.warn(`Failed to generate platform-specific examples for ${platform}:`, error);
    }

    return examples;
  }

  private async generateStyleConversionExamples(
    component: ExtractedComponent,
    targetPlatform: Platform
  ): Promise<any[]> {
    const examples: any[] = [];

    if (component.platform === 'web' && targetPlatform === 'react-native') {
      // Tailwind → React Native StyleSheet変換
      const styleConverter = new StyleConverter();
      const convertedStyles = styleConverter.tailwindToStyleSheet(component.tailwindClasses);
      
      examples.push({
        title: 'Converted to React Native StyleSheet',
        code: this.generateStyleSheetExample(component.componentName, convertedStyles),
        platform: 'react-native',
        description: 'Tailwind CSS classes converted to React Native StyleSheet'
      });
    }

    if (component.platform === 'react-native' && targetPlatform === 'web') {
      // React Native StyleSheet → Tailwind変換
      if (component.styleInfo?.styles) {
        const styleConverter = new StyleConverter();
        const convertedClasses = styleConverter.styleSheetToTailwind(component.styleInfo.styles);
        
        examples.push({
          title: 'Converted to Tailwind CSS',
          code: this.generateTailwindExample(component.componentName, convertedClasses),
          platform: 'web',
          description: 'React Native StyleSheet converted to Tailwind CSS classes'
        });
      }
    }

    return examples;
  }

  private analyzeCrossPlatformComponents(
    platformDocuments: PlatformSpecificDocument[]
  ): CrossPlatformComponent[] {
    const componentMap = new Map<string, CrossPlatformComponent>();

    // コンポーネント名でグループ化
    platformDocuments.forEach(({ platform, components }) => {
      components.forEach(component => {
        if (!componentMap.has(component.name)) {
          componentMap.set(component.name, {
            componentName: component.name,
            platforms: {},
            sharedProps: [],
            platformDifferences: []
          });
        }

        const crossPlatformComponent = componentMap.get(component.name)!;
        crossPlatformComponent.platforms[platform] = component;
      });
    });

    // プラットフォーム間の差異を分析
    componentMap.forEach(crossPlatformComponent => {
      this.analyzePlatformDifferences(crossPlatformComponent);
    });

    return Array.from(componentMap.values()).filter(
      comp => Object.keys(comp.platforms).length > 1
    );
  }

  private analyzePlatformDifferences(component: CrossPlatformComponent): void {
    const platforms = Object.keys(component.platforms) as Platform[];
    
    if (platforms.length < 2) return;

    // スタイリングの違いを分析
    const stylingDifferences = this.compareStyleSystems(component.platforms);
    component.platformDifferences.push(...stylingDifferences);

    // プロパティの違いを分析
    const propDifferences = this.compareProps(component.platforms);
    component.platformDifferences.push(...propDifferences);

    // 共通プロパティを抽出
    component.sharedProps = this.extractSharedProps(component.platforms);
  }

  private compareStyleSystems(platforms: { [key in Platform]?: ComponentDoc }): PlatformDifference[] {
    const differences: PlatformDifference[] = [];

    Object.entries(platforms).forEach(([platform, componentDoc]) => {
      if (componentDoc?.styles.type === 'tailwind') {
        differences.push({
          platform: platform as Platform,
          type: 'styling',
          description: 'Uses Tailwind CSS classes for styling',
          example: `className="${componentDoc.styles.tailwindClasses?.join(' ')}"`
        });
      } else if (componentDoc?.styles.type === 'stylesheet') {
        differences.push({
          platform: platform as Platform,
          type: 'styling',
          description: 'Uses React Native StyleSheet for styling',
          example: 'style={styles.container}'
        });
      }
    });

    return differences;
  }

  private compareProps(platforms: { [key in Platform]?: ComponentDoc }): PlatformDifference[] {
    const differences: PlatformDifference[] = [];
    
    // プラットフォーム固有のプロパティを検出
    const platformSpecificProps = new Map<string, Platform[]>();
    
    Object.entries(platforms).forEach(([platform, componentDoc]) => {
      componentDoc?.props.forEach(prop => {
        if (!platformSpecificProps.has(prop.name)) {
          platformSpecificProps.set(prop.name, []);
        }
        platformSpecificProps.get(prop.name)!.push(platform as Platform);
      });
    });

    // 一部のプラットフォームにのみ存在するプロパティを特定
    platformSpecificProps.forEach((supportedPlatforms, propName) => {
      if (supportedPlatforms.length !== Object.keys(platforms).length) {
        supportedPlatforms.forEach(platform => {
          differences.push({
            platform,
            type: 'props',
            description: `Property '${propName}' is specific to ${platform}`,
            example: `${propName}={...}`
          });
        });
      }
    });

    return differences;
  }

  private extractSharedProps(platforms: { [key in Platform]?: ComponentDoc }): any[] {
    const propCounts = new Map<string, number>();
    const totalPlatforms = Object.keys(platforms).length;

    Object.values(platforms).forEach(componentDoc => {
      componentDoc?.props.forEach(prop => {
        propCounts.set(prop.name, (propCounts.get(prop.name) || 0) + 1);
      });
    });

    // すべてのプラットフォームで共通のプロパティを抽出
    return Array.from(propCounts.entries())
      .filter(([, count]) => count === totalPlatforms)
      .map(([propName]) => {
        // 最初のプラットフォームからプロパティ詳細を取得
        const firstComponent = Object.values(platforms)[0];
        return firstComponent?.props.find(p => p.name === propName);
      })
      .filter(Boolean);
  }

  private generateUnifiedDocument(
    platformDocuments: PlatformSpecificDocument[],
    crossPlatformComponents: CrossPlatformComponent[],
    options: MultiPlatformDocumentOptions
  ): AIDocument {
    const config = this.configManager.getConfig();

    return {
      version: '2.0',
      generated: new Date().toISOString(),
      project: {
        name: config.source?.dir || 'Multi-Platform Project',
        version: '1.0.0',
        framework: 'Multi-Platform',
        styling: 'Multi-System'
      },
      tokens: {
        colors: {},
        spacing: {},
        typography: {
          fontFamily: {},
          fontSize: {},
          fontWeight: {},
          lineHeight: {}
        },
        breakpoints: {},
        shadows: {},
        borderRadius: {},
        custom: {}
      }, // TODO: 統合トークン
      components: this.generateUnifiedComponents(crossPlatformComponents, platformDocuments),
      patterns: this.generateCrossPlatformPatterns(crossPlatformComponents),
      guidelines: this.generateMultiPlatformGuidelines(platformDocuments)
    };
  }

  private generateUnifiedComponents(
    crossPlatformComponents: CrossPlatformComponent[],
    platformDocuments: PlatformSpecificDocument[]
  ): ComponentDoc[] {
    return crossPlatformComponents.map(crossComp => ({
      id: `unified-${crossComp.componentName.toLowerCase()}`,
      name: crossComp.componentName,
      category: 'cross-platform',
      description: `Multi-platform component available on: ${Object.keys(crossComp.platforms).join(', ')}`,
      usage: this.generateUnifiedUsage(crossComp),
      props: crossComp.sharedProps,
      styles: this.generateUnifiedStyles(crossComp),
      examples: this.generateUnifiedExamples(crossComp),
      relatedComponents: [],
      jsxStructure: undefined
    }));
  }

  private generateUnifiedUsage(component: CrossPlatformComponent): string {
    const platforms = Object.keys(component.platforms);
    let usage = `// Available on: ${platforms.join(', ')}\n\n`;

    Object.entries(component.platforms).forEach(([platform, componentDoc]) => {
      usage += `// ${platform.toUpperCase()}\n`;
      usage += componentDoc?.usage || `<${component.componentName} />`;
      usage += '\n\n';
    });

    return usage.trim();
  }

  private generateUnifiedStyles(component: CrossPlatformComponent): any {
    return {
      type: 'multi-platform',
      platforms: Object.fromEntries(
        Object.entries(component.platforms).map(([platform, componentDoc]) => [
          platform,
          componentDoc?.styles
        ])
      ),
      differences: component.platformDifferences.filter(diff => diff.type === 'styling')
    };
  }

  private generateUnifiedExamples(component: CrossPlatformComponent): any[] {
    const examples: any[] = [];

    Object.entries(component.platforms).forEach(([platform, componentDoc]) => {
      if (componentDoc?.examples) {
        examples.push(...componentDoc.examples.map(example => ({
          ...example,
          platform,
          title: `${platform}: ${example.title}`
        })));
      }
    });

    return examples;
  }

  private generateCrossPlatformPatterns(components: CrossPlatformComponent[]): any[] {
    return [
      {
        name: 'Cross-Platform Styling',
        description: 'Patterns for managing styles across different platforms',
        components: components.map(c => c.componentName),
        examples: ['Conditional styling', 'Platform-specific stylesheets']
      },
      {
        name: 'Shared Component Props',
        description: 'Common props interface across platforms',
        components: components.filter(c => c.sharedProps.length > 0).map(c => c.componentName),
        examples: ['Common prop validation', 'Platform-agnostic interfaces']
      }
    ];
  }

  private generateMultiPlatformGuidelines(platformDocuments: PlatformSpecificDocument[]): string[] {
    return [
      'Use shared prop interfaces for cross-platform compatibility',
      'Implement platform-specific styling while maintaining consistent UX',
      'Leverage conditional rendering for platform-specific features',
      'Document platform differences clearly',
      'Test components on all target platforms'
    ];
  }

  private generatePlatformGuidelines(platform: Platform): string[] {
    switch (platform) {
      case 'web':
        return [
          'Use semantic HTML elements when possible',
          'Leverage Tailwind CSS for consistent styling',
          'Ensure accessibility with proper ARIA labels',
          'Optimize for responsive design'
        ];
      case 'react-native':
        return [
          'Use React Native core components',
          'Leverage StyleSheet.create() for performance',
          'Consider platform-specific styling with Platform.OS',
          'Test on both iOS and Android platforms'
        ];
      default:
        return ['Follow platform-specific best practices'];
    }
  }

  private getPlatformFramework(platform: Platform): string {
    switch (platform) {
      case 'web': return 'React Web';
      case 'react-native': return 'React Native';
      default: return 'Custom Platform';
    }
  }

  private generateStyleSheetExample(componentName: string, styles: Record<string, any>): string {
    return `import { StyleSheet } from 'react-native';

const styles = StyleSheet.create(${JSON.stringify(styles, null, 2)});

<${componentName} style={styles.container}>
  Content
</${componentName}>`;
  }

  private generateTailwindExample(componentName: string, classes: string[]): string {
    return `<${componentName} className="${classes.join(' ')}">
  Content
</${componentName}>`;
  }
}

/**
 * StyleConverter - プラットフォーム間スタイル変換ユーティリティ
 * 
 * このクラスは、異なるプラットフォーム間でのスタイル形式変換を提供します。
 * 主にTailwind CSS（Web）とReact Native StyleSheetの相互変換を担います。
 * 
 * 主な機能：
 * 1. Tailwind CSS → React Native StyleSheet変換
 * 2. React Native StyleSheet → Tailwind CSS変換
 * 3. プラットフォーム固有の制約への対応
 * 4. 変換不可要素の適切なハンドリング
 * 
 * 制限事項：
 * - 全てのスタイルプロパティが完全に変換可能ではない
 * - プラットフォーム固有機能は変換対象外
 * - 近似変換により完全性は保証されない
 * 
 * 拡張性：
 * - 新しいスタイルプロパティの変換ルール追加
 * - より高精度な変換アルゴリズムの実装
 * - 他のスタイルシステムへの対応
 */
export class StyleConverter {
  /**
   * Tailwind CSS → React Native StyleSheet変換
   * 
   * Web用のTailwindクラスをReact Nativeで使用可能な
   * StyleSheetオブジェクトに変換します。
   * 
   * @param tailwindClasses - 変換対象のTailwindクラス配列
   * @returns React Native StyleSheetオブジェクト
   */
  tailwindToStyleSheet(tailwindClasses: string[]): Record<string, any> {
    const styles: Record<string, any> = {};
    
    tailwindClasses.forEach(className => {
      const converted = this.convertTailwindClass(className);
      Object.assign(styles, converted);
    });

    return { container: styles };
  }

  /**
   * React Native StyleSheet → Tailwind CSS変換
   * 
   * React NativeのStyleSheetオブジェクトを
   * Web用のTailwindクラス文字列配列に変換します。
   * 
   * @param styleSheet - 変換対象のStyleSheetオブジェクト
   * @returns Tailwindクラス文字列配列
   */
  styleSheetToTailwind(styleSheet: Record<string, any>): string[] {
    const classes: string[] = [];
    
    Object.entries(styleSheet).forEach(([property, value]) => {
      const tailwindClass = this.convertStyleToTailwind(property, value);
      if (tailwindClass) {
        classes.push(tailwindClass);
      }
    });

    return classes;
  }

  private convertTailwindClass(className: string): Record<string, any> {
    // 基本的なTailwind → React Native変換
    const conversions: Record<string, Record<string, any>> = {
      'p-4': { padding: 16 },
      'p-2': { padding: 8 },
      'm-4': { margin: 16 },
      'm-2': { margin: 8 },
      'bg-blue-500': { backgroundColor: '#3B82F6' },
      'bg-white': { backgroundColor: '#FFFFFF' },
      'text-white': { color: '#FFFFFF' },
      'text-black': { color: '#000000' },
      'rounded': { borderRadius: 4 },
      'rounded-lg': { borderRadius: 8 },
      'flex': { display: 'flex' },
      'flex-1': { flex: 1 },
      'items-center': { alignItems: 'center' },
      'justify-center': { justifyContent: 'center' }
    };

    return conversions[className] || {};
  }

  private convertStyleToTailwind(property: string, value: any): string | null {
    // 基本的なReact Native → Tailwind変換
    const conversions: Record<string, Record<any, string>> = {
      padding: { 16: 'p-4', 8: 'p-2' },
      margin: { 16: 'm-4', 8: 'm-2' },
      backgroundColor: { '#3B82F6': 'bg-blue-500', '#FFFFFF': 'bg-white' },
      color: { '#FFFFFF': 'text-white', '#000000': 'text-black' },
      borderRadius: { 4: 'rounded', 8: 'rounded-lg' },
      alignItems: { 'center': 'items-center' },
      justifyContent: { 'center': 'justify-center' }
    };

    return conversions[property]?.[value] || null;
  }
}