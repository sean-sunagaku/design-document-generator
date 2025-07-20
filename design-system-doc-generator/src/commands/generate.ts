import * as path from 'path';
import chalk from 'chalk';
import { TailwindExtractor } from '../extractors/TailwindExtractor';
import { DesignTokenExtractor } from '../extractors/DesignTokenExtractor';
import { AIDocumentGenerator } from '../generators/AIDocumentGenerator';
import { findFiles, ensureDirectoryExists } from '../utils/fileUtils';
import { StyleExtractorFactory } from '../extractors/StyleExtractorFactory';
import { PlatformExtractorFactory } from '../extractors/PlatformExtractorFactory';
import { MultiPlatformDocumentGenerator } from '../generators/MultiPlatformDocumentGenerator';
import { ConfigManager } from '../config/ConfigManager';
import { Platform, StyleSystem } from '../types';

/**
 * Generateコマンドのオプション設定
 * 
 * ドキュメント生成に必要な全パラメータを定義し、
 * CLI引数とコンフィグファイルの両方に対応します。
 */
export interface GenerateOptions {
  /** ソースディレクトリのパス */
  source: string;
  /** 出力ディレクトリのパス */
  output: string;
  /** 設定ファイルのパス（任意） */
  config?: string;
  /** 対象プラットフォーム（任意・設定ファイルから継承可能） */
  platform?: Platform;
  /** スタイルシステム（任意・設定ファイルから継承可能） */
  styleSystem?: StyleSystem;
  /** コード例を含めるかどうか */
  includeExamples: boolean;
}

/**
 * GenerateCommand - ドキュメント生成コマンド実行クラス
 * 
 * このクラスは、デザインシステムドキュメント生成の全プロセスを
 * 統合的に実行するメインコマンドです。設定管理、コンポーネント抽出、
 * ドキュメント生成、ファイル出力までの一連の処理を担います。
 * 
 * 実行プロセス：
 * 1. 設定の読み込みと統合（CLI引数 + 設定ファイル）
 * 2. プラットフォーム/スタイルシステムの決定
 * 3. コンポーネントファイルの発見と抽出
 * 4. デザイントークンの抽出
 * 5. AIドキュメントの生成
 * 6. 複数形式でのファイル出力
 * 7. 実行結果のサマリー表示
 * 
 * 対応出力形式：
 * - JSON形式（AI/プログラム消費用）
 * - Markdown形式（人間読み取り用）
 * - インデックスファイル（概要・使用方法）
 * 
 * CLI統合：
 * - 詳細な進捗表示（chalk使用）
 * - エラーハンドリングと分かりやすいメッセージ
 * - 実行結果の統計情報表示
 */
export class GenerateCommand {
  private options: GenerateOptions;

  /**
   * GenerateCommandのコンストラクタ
   * 
   * @param options - 実行オプション設定
   */
  constructor(options: GenerateOptions) {
    this.options = options;
  }

  /**
   * ドキュメント生成の実行メイン処理
   * 
   * 設定読み込みからファイル出力まで、ドキュメント生成の
   * 全プロセスを順次実行します。各段階で適切な進捗表示を行い、
   * エラー時には分かりやすいメッセージを提供します。
   * 
   * 実行手順の詳細：
   * 1. パス解決と基本設定
   * 2. 設定ファイル読み込み + CLI引数のマージ
   * 3. プラットフォーム固有の抽出器セットアップ
   * 4. コンポーネントファイル探索と抽出実行
   * 5. デザイントークン抽出
   * 6. AI最適化ドキュメント生成
   * 7. 複数形式でのファイル出力
   * 8. 実行サマリーと統計情報表示
   * 
   * エラーハンドリング：
   * - 設定ファイル読み込み失敗
   * - ソースディレクトリ不存在
   * - 出力ディレクトリ作成失敗
   * - コンポーネント抽出エラー
   */
  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    const outputPath = path.resolve(this.options.output);
    
    console.log(chalk.blue('🔍 Analyzing components...'));

    // フェーズ1: 設定の統合と決定
    // ConfigManagerから基本設定を読み込み、CLI引数で上書き
    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig(this.options.config);
    
    // CLI引数の優先適用（設定ファイル < CLI引数）
    const finalPlatform = (this.options.platform || config.platform) as Platform;
    const finalStyleSystem = (this.options.styleSystem || config.styleSystem) as StyleSystem;
    
    // システム全体で使用する最終設定をConfigManagerに反映
    configManager.setConfig({
      ...config,
      platform: finalPlatform,
      styleSystem: finalStyleSystem,
    });
    
    console.log(chalk.gray(`Platform: ${finalPlatform}, Style System: ${finalStyleSystem}`));

    // 既存のTailwindExtractorを使用（一時的な修正）
    const tailwindExtractor = new TailwindExtractor({
      sourceDir: sourcePath,
      ignore: [
        '**/node_modules/**',
        '**/*.test.tsx',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.spec.ts',
        '**/*.stories.tsx',
        '**/*.stories.ts',
        '**/dist/**',
        '**/build/**',
      ],
    });

    const tokenExtractor = new DesignTokenExtractor();
    const documentGenerator = new AIDocumentGenerator();

    // プラットフォーム固有のファイル検索（既存の方法を使用）
    const patterns = [
      `${sourcePath}/**/*.tsx`,
      `${sourcePath}/**/*.jsx`,
      `${sourcePath}/**/*.ts`,
    ];

    const allFiles = [];
    for (const pattern of patterns) {
      const files = await findFiles(pattern);
      allFiles.push(...files);
    }

    // Filter out non-component files
    const componentFiles = allFiles.filter(file => 
      !file.includes('node_modules') &&
      !file.includes('.test.') &&
      !file.includes('.spec.') &&
      !file.includes('.stories.') &&
      (file.endsWith('.tsx') || file.endsWith('.jsx'))
    );
    console.log(chalk.gray(`Found ${componentFiles.length} component files`));

    // Extract components using tailwind extractor
    const components = [];
    for (const file of componentFiles) {
      const component = await tailwindExtractor.extractFromFile(file);
      if (component) {
        components.push(component);
      }
    }

    console.log(chalk.gray(`Extracted ${components.length} components`));

    // Extract design tokens (プラットフォーム・スタイルシステムに応じて)
    let tokens;
    if (finalStyleSystem === 'tailwind') {
      const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
      tokens = await tokenExtractor.extractFromTailwindConfig(tailwindConfigPath);
    } else {
      // StyleSheetやその他のスタイルシステム用のtoken extraction
      tokens = await tokenExtractor.extractFromStyleSheet(components);
    }

    console.log(chalk.blue('📝 Generating documentation...'));

    // Generate AI document using existing generator
    const result = await documentGenerator.generate(components, tokens, {
      includeExamples: this.options.includeExamples,
      outputFormat: 'json',
    });

    // Create output directory
    await ensureDirectoryExists(outputPath);

    // Save files
    const jsonOutputPath = path.join(outputPath, 'design-system.json');
    const markdownOutputPath = path.join(outputPath, 'design-system.md');
    const indexOutputPath = path.join(outputPath, 'index.md');

    await documentGenerator.saveAsJSON(result.document, jsonOutputPath);
    await documentGenerator.saveAsMarkdown(result.document, markdownOutputPath);

    // Create index file
    await this.createIndexFile(result.document, indexOutputPath);

    console.log(chalk.green('✅ Documentation generated successfully!'));
    console.log(chalk.gray(`Output directory: ${outputPath}`));
    console.log(chalk.gray(`Files created:`));
    console.log(chalk.gray(`  - design-system.json (${components.length} components)`));
    console.log(chalk.gray(`  - design-system.md (human readable)`));
    console.log(chalk.gray(`  - index.md (overview)`));

    // Display summary
    this.displaySummary(result.document);
  }

  private async createIndexFile(aiDocument: any, outputPath: string): Promise<void> {
    const indexContent = `# Design System Documentation

This directory contains automatically generated documentation for the project's design system.

## Files

- **design-system.json** - Complete design system data in JSON format, optimized for AI consumption
- **design-system.md** - Human-readable documentation in Markdown format
- **index.md** - This overview file

## Summary

- **Project**: ${aiDocument.project.name}
- **Generated**: ${new Date(aiDocument.generated).toLocaleString('ja-JP')}
- **Components**: ${aiDocument.components.length}
- **Design Tokens**: ${Object.keys(aiDocument.tokens.colors).length} colors, ${Object.keys(aiDocument.tokens.spacing).length} spacing
- **Patterns**: ${aiDocument.patterns.length}

## Component Categories

- **Atoms**: ${aiDocument.components.filter((c: any) => c.category === 'atoms').length}
- **Molecules**: ${aiDocument.components.filter((c: any) => c.category === 'molecules').length}
- **Organisms**: ${aiDocument.components.filter((c: any) => c.category === 'organisms').length}
- **Templates**: ${aiDocument.components.filter((c: any) => c.category === 'templates').length}
- **Pages**: ${aiDocument.components.filter((c: any) => c.category === 'pages').length}

## How to Use

1. **For AI/LLM**: Use the \`design-system.json\` file for structured data
2. **For Developers**: Read the \`design-system.md\` file for comprehensive documentation
3. **For Updates**: Re-run \`design-system-doc generate\` to update documentation

## Commands

\`\`\`bash
# Generate documentation
design-system-doc generate

# Create snapshot
design-system-doc snapshot

# Compare changes
design-system-doc diff

# Watch for changes
design-system-doc watch
\`\`\`
`;

    await require('fs').promises.writeFile(outputPath, indexContent, 'utf-8');
  }

  private displaySummary(aiDocument: any): void {
    console.log(chalk.bold('\n📊 Summary:'));
    
    const categoryCounts = {
      atoms: aiDocument.components.filter((c: any) => c.category === 'atoms').length,
      molecules: aiDocument.components.filter((c: any) => c.category === 'molecules').length,
      organisms: aiDocument.components.filter((c: any) => c.category === 'organisms').length,
      templates: aiDocument.components.filter((c: any) => c.category === 'templates').length,
      pages: aiDocument.components.filter((c: any) => c.category === 'pages').length,
    };

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`  ${category}: ${count} components`);
      }
    });

    const tokensCount = Object.keys(aiDocument.tokens.colors).length;
    const spacingCount = Object.keys(aiDocument.tokens.spacing).length;
    
    console.log(`  Design tokens: ${tokensCount} colors, ${spacingCount} spacing`);
    console.log(`  Patterns detected: ${aiDocument.patterns.length}`);
    console.log(`  Guidelines: ${aiDocument.guidelines.length}`);

    // Show most used classes
    const allClasses = aiDocument.components.flatMap((c: any) => c.styles.tailwindClasses);
    const classCount = allClasses.reduce((acc: any, cls: string) => {
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {});

    const topClasses = Object.entries(classCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([cls, count]) => `${cls}(${count})`);

    if (topClasses.length > 0) {
      console.log(`  Most used classes: ${topClasses.join(', ')}`);
    }
  }
}