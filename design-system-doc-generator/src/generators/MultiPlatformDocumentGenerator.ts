import { ExtractedComponent, Platform, StyleSystem, GeneratorOptions, AIDocument, ComponentDoc } from '../types';
import { ConfigManager } from '../config/ConfigManager';
import { ComponentDocumentGenerator } from './document/ComponentDocumentGenerator';
import { StyleExtractorFactory } from '../extractors/StyleExtractorFactory';
import { PlatformExtractorFactory } from '../extractors/PlatformExtractorFactory';

export interface MultiPlatformDocumentOptions extends GeneratorOptions {
  platforms: Platform[];
  generateComparison: boolean;
  includeStyleConversion: boolean;
}

export interface PlatformSpecificDocument {
  platform: Platform;
  document: AIDocument;
  components: ComponentDoc[];
}

export interface CrossPlatformComponent {
  componentName: string;
  platforms: {
    [key in Platform]?: ComponentDoc;
  };
  sharedProps: any[];
  platformDifferences: PlatformDifference[];
}

export interface PlatformDifference {
  platform: Platform;
  type: 'styling' | 'props' | 'behavior' | 'imports';
  description: string;
  example?: string;
}

export class MultiPlatformDocumentGenerator {
  private configManager: ConfigManager;
  private componentDocGenerator: ComponentDocumentGenerator;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.componentDocGenerator = new ComponentDocumentGenerator();
  }

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

    // 各プラットフォームごとのドキュメント生成
    for (const [platform, components] of componentsByPlatform) {
      const platformDoc = await this.generatePlatformSpecificDocument(
        platform,
        components,
        options
      );
      platformDocuments.push(platformDoc);
    }

    // クロスプラットフォーム分析
    if (options.generateComparison) {
      const crossPlatformAnalysis = this.analyzeCrossPlatformComponents(platformDocuments);
      crossPlatformComponents.push(...crossPlatformAnalysis);
    }

    // 統合ドキュメント生成
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

  private async generatePlatformSpecificDocument(
    platform: Platform,
    components: ExtractedComponent[],
    options: MultiPlatformDocumentOptions
  ): Promise<PlatformSpecificDocument> {
    const config = this.configManager.getConfig();
    const platformComponents: ComponentDoc[] = [];

    for (const component of components) {
      const componentDoc = this.componentDocGenerator.generateComponentDoc(
        component,
        components,
        options
      );

      // プラットフォーム固有の拡張
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

// スタイル変換ユーティリティ
export class StyleConverter {
  tailwindToStyleSheet(tailwindClasses: string[]): Record<string, any> {
    const styles: Record<string, any> = {};
    
    tailwindClasses.forEach(className => {
      const converted = this.convertTailwindClass(className);
      Object.assign(styles, converted);
    });

    return { container: styles };
  }

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