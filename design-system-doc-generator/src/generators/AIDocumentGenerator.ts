import * as fs from 'fs';
import * as path from 'path';
import { 
  ExtractedComponent, 
  DesignTokens, 
  GeneratorOptions, 
  ProjectInfo,
  AIDocument,
  DocumentGenerationContext,
  GenerationResult,
  GenerationMetadata
} from '../types';
import { ensureDirectoryExists } from '../utils/fileUtils';
import { ComponentDocumentGenerator } from './document/ComponentDocumentGenerator';
import { PatternDetector } from './document/PatternDetector';
import { GuidelineGenerator } from './document/GuidelineGenerator';
import { MarkdownFormatter } from './document/MarkdownFormatter';

export class AIDocumentGenerator {
  private componentDocGenerator: ComponentDocumentGenerator;
  private patternDetector: PatternDetector;
  private guidelineGenerator: GuidelineGenerator;
  private markdownFormatter: MarkdownFormatter;

  constructor() {
    this.componentDocGenerator = new ComponentDocumentGenerator();
    this.patternDetector = new PatternDetector();
    this.guidelineGenerator = new GuidelineGenerator();
    this.markdownFormatter = new MarkdownFormatter();
  }

  async generate(
    components: ExtractedComponent[],
    tokens: DesignTokens,
    options: GeneratorOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    const context: DocumentGenerationContext = {
      components,
      tokens,
      options
    };

    const document: AIDocument = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      project: await this.getProjectInfo(),
      tokens,
      components: [],
      patterns: [],
      guidelines: [],
    };

    // コンポーネントドキュメント生成
    for (const component of components) {
      const componentDoc = this.componentDocGenerator.generateComponentDoc(
        component, 
        components, 
        options
      );
      document.components.push(componentDoc);
    }

    // デザインパターンの検出
    const patternResult = this.patternDetector.detectPatterns(components);
    document.patterns = patternResult.patterns;

    // ガイドライン生成
    document.guidelines = this.guidelineGenerator.generateGuidelines(components, tokens);

    const metadata: GenerationMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      duration: Date.now() - startTime,
      componentsProcessed: components.length,
    };

    return { document, metadata };
  }

  private async getProjectInfo(): Promise<ProjectInfo> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
      
      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    } catch {
      return {
        name: 'unknown',
        version: '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    }
  }

  async saveAsJSON(document: AIDocument, outputPath: string): Promise<void> {
    await ensureDirectoryExists(path.dirname(outputPath));
    const jsonContent = JSON.stringify(document, null, 2);
    await fs.promises.writeFile(outputPath, jsonContent, 'utf-8');
  }

  async saveAsMarkdown(document: AIDocument, outputPath: string): Promise<void> {
    await ensureDirectoryExists(path.dirname(outputPath));
    const markdown = this.markdownFormatter.generateMarkdown(document);
    await fs.promises.writeFile(outputPath, markdown, 'utf-8');
  }
}