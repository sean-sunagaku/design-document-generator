import { ExtractedComponent, ExtractorConfig, PropInfo, JSXElement, StyleInfo } from '../types';
import { generateHash } from '../utils/hash';
import { ComponentAnalyzer } from './ast/ComponentAnalyzer';
import { ASTTraverser } from './ast/ASTTraverser';
import { TailwindClassExtractor } from './ast/TailwindClassExtractor';
import { PropExtractor } from './ast/PropExtractor';
import { JSXStructureExtractor } from './ast/JSXStructureExtractor';
import { ComponentCategorizer } from './ast/ComponentCategorizer';
import { StyleExtractorFactory } from './StyleExtractorFactory';
import { ConfigManager } from '../config/ConfigManager';

export class TailwindExtractor {
  private config: ExtractorConfig;
  private componentAnalyzer: ComponentAnalyzer;
  private astTraverser: ASTTraverser;
  private tailwindExtractor: TailwindClassExtractor;
  private propExtractor: PropExtractor;
  private jsxExtractor: JSXStructureExtractor;
  private categorizer: ComponentCategorizer;
  private styleExtractor: any; // StyleExtractor

  constructor(config: ExtractorConfig) {
    this.config = config;
    this.componentAnalyzer = new ComponentAnalyzer();
    this.astTraverser = new ASTTraverser();
    this.tailwindExtractor = new TailwindClassExtractor();
    this.propExtractor = new PropExtractor();
    this.jsxExtractor = new JSXStructureExtractor();
    this.categorizer = new ComponentCategorizer();
    
    // 設定されたスタイルシステムに応じてExtractorを作成
    const configManager = ConfigManager.getInstance();
    const appConfig = configManager.getConfig();
    const styleSystem = appConfig.styleSystem || 'tailwind';
    
    this.styleExtractor = StyleExtractorFactory.createExtractor(styleSystem, config);
  }

  async extractFromFile(filePath: string): Promise<ExtractedComponent | null> {
    try {
      // Analyze the file
      const { content, ast, componentName, isComponentFile } = 
        await this.componentAnalyzer.analyzeFile(filePath);

      if (!isComponentFile || !componentName || !ast) {
        return null;
      }

      // Extract data using specialized extractors
      const classes = new Set<string>();
      const props: PropInfo[] = [];
      const dependencies = new Set<string>();
      let jsxStructure: JSXElement | undefined;

      // Use AST traverser to collect data
      this.astTraverser.traverse(ast, {
        onClassName: (node) => {
          const extractedClasses = this.tailwindExtractor.extractClasses(node);
          extractedClasses.forEach(cls => classes.add(cls));
        },
        onProp: (prop) => props.push(prop),
        onImport: (dep) => dependencies.add(dep),
        onJSXReturn: (element) => {
          if (!jsxStructure) {
            jsxStructure = element;
          }
        },
      });

      // Extract JSX structure if not found via traverser
      if (!jsxStructure) {
        jsxStructure = this.jsxExtractor.extractJSXStructure(ast) || undefined;
      }

      // Categorize component
      const category = this.categorizer.categorizeComponent(
        filePath, 
        componentName, 
        this.config.sourceDir
      );

      // 新しいスタイル抽出システムを使用
      const extractedStyles = this.extractStylesFromAST(ast);
      
      // スタイル情報を構築 - extractedStylesの結果に基づいて決定
      const styleInfo: StyleInfo = this.buildStyleInfo(extractedStyles, Array.from(classes));

      return {
        filePath,
        componentName,
        category,
        tailwindClasses: Array.from(classes).sort(),
        props,
        dependencies: Array.from(dependencies),
        hash: generateHash(content),
        jsxStructure,
        platform: 'web',
        styleInfo,
      };
    } catch (error) {
      console.error(`Failed to extract from ${filePath}:`, error);
      return null;
    }
  }

  private extractStylesFromAST(ast: any): any[] {
    const styles: any[] = [];
    this.astTraverser.traverse(ast, {
      onClassName: (node) => {
        const extractedStyles = this.styleExtractor.extractStyles(node);
        styles.push(...extractedStyles);
      }
    });
    return styles;
  }

  private hasResponsiveClasses(classes: string[]): boolean {
    return classes.some(cls => /^(sm:|md:|lg:|xl:|2xl:)/.test(cls));
  }

  private hasDarkModeClasses(classes: string[]): boolean {
    return classes.some(cls => cls.startsWith('dark:'));
  }

  private extractAnimations(classes: string[]): string[] {
    return classes.filter(cls => 
      cls.startsWith('animate-') || 
      cls.startsWith('transition-') ||
      cls.includes('duration-') ||
      cls.includes('ease-')
    );
  }
}