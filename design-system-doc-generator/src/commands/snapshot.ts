import * as path from 'path';
import { TailwindExtractor } from '../extractors/TailwindExtractor';
import { DesignTokenExtractor } from '../extractors/DesignTokenExtractor';
import { findFiles, writeJsonFile, ensureDirectoryExists } from '../utils/fileUtils';
import { Snapshot } from '../types';

/**
 * Snapshotコマンドのオプション設定
 */
export interface SnapshotOptions {
  /** ソースディレクトリのパス */
  source: string;
  /** 設定ファイルのパス（任意） */
  config?: string;
  /** 出力ファイルのパス */
  output: string;
  /** 出力形式 */
  format: 'json' | 'markdown';
}

/**
 * SnapshotCommand - デザインシステムスナップショット作成コマンド
 * 
 * このクラスは、現在のデザインシステムの状態を記録し、
 * 将来の比較・差分検出のためのスナップショットファイルを生成します。
 * 
 * 主な機能：
 * 1. 全コンポーネントの現在状態記録
 * 2. デザイントークンの状態記録
 * 3. タイムスタンプ付きスナップショット生成
 * 4. JSON/Markdown形式での出力
 * 
 * 活用場面：
 * - バージョン管理でのデザインシステム変更追跡
 * - CI/CDでの自動スナップショット作成
 * - リリース前の状態記録
 * - 差分分析の基準データ作成
 */
export class SnapshotCommand {
  private options: SnapshotOptions;

  /**
   * SnapshotCommandのコンストラクタ
   * 
   * @param options - スナップショット作成オプション
   */
  constructor(options: SnapshotOptions) {
    this.options = options;
  }

  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    const outputPath = path.resolve(this.options.output);
    
    // Initialize extractors
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

    // Find all React/TypeScript files
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

    console.log(`Found ${componentFiles.length} component files`);

    // Extract components
    const components = [];
    for (const file of componentFiles) {
      const component = await tailwindExtractor.extractFromFile(file);
      if (component) {
        components.push(component);
      }
    }

    console.log(`Extracted ${components.length} components`);

    // Extract design tokens
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
    const tokens = await tokenExtractor.extractFromTailwindConfig(tailwindConfigPath);

    // Get project info
    const projectInfo = await this.getProjectInfo();

    // Create snapshot
    const snapshot: Snapshot = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      components,
      tokens,
      project: projectInfo,
    };

    // Save snapshot
    await ensureDirectoryExists(path.dirname(outputPath));
    await writeJsonFile(outputPath, snapshot);

    console.log(`Snapshot saved to: ${outputPath}`);
    console.log(`Components: ${components.length}`);
    console.log(`Tokens: ${Object.keys(tokens.colors).length} colors, ${Object.keys(tokens.spacing).length} spacing`);
  }

  private async getProjectInfo() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = require(packageJsonPath);
      
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
}