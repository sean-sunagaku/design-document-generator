import * as fs from 'fs';
import * as path from 'path';
import { Platform, PlatformConfig, StyleSystem } from '../types';

/**
 * ConfigManager - 設計システムドキュメント生成ツールの設定管理クラス
 * 
 * このクラスは、アプリケーション全体の設定を一元管理するSingletonパターンを実装しています。
 * プラットフォーム（Web、React Native）、スタイルシステム（Tailwind、StyleSheet）、
 * 出力形式、検証ルールなどの複雑な設定を統一的に管理し、
 * 拡張可能なアーキテクチャを提供します。
 * 
 * 主な責務:
 * - 設定ファイルの自動検出と読み込み（.js, .json, package.json）
 * - デフォルト設定の提供とバリデーション
 * - プラットフォーム固有設定のマージ
 * - カスタムプラットフォーム・スタイルシステムの登録管理
 * - 設定の永続化
 * 
 * 使用パターン:
 * const configManager = ConfigManager.getInstance();
 * await configManager.loadConfig();
 * const config = configManager.getConfig();
 * 
 * なぜSingletonパターンを採用したか:
 * - アプリケーション全体で一貫した設定を保証
 * - メモリ効率の最適化（設定の重複読み込み回避）
 * - グローバルアクセスの簡素化
 */

/**
 * DesignSystemConfig - メイン設定インターフェース
 * 
 * デザインシステムドキュメント生成の全ての設定を定義します。
 * 拡張性を重視し、カスタムプラットフォームやスタイルシステムにも対応。
 */
export interface DesignSystemConfig {
  platform: Platform | string; // 拡張可能な文字列型も許可
  styleSystem: StyleSystem | string; // 拡張可能な文字列型も許可
  source: SourceConfig;
  output: OutputConfig;
  validation: ValidationConfigDetailed;
  generation: GenerationConfigDetailed;
  categorization?: CategorizationConfig;
  extensions: ExtensionsConfig;
}

/**
 * SourceConfig - ソースコード検索設定
 * 
 * 解析対象のファイルを指定するための設定です。
 */
export interface SourceConfig {
  dir: string;           // 検索ルートディレクトリ
  include: string[];     // 含めるファイルパターン（glob形式）
  exclude: string[];     // 除外するファイルパターン
  tsConfigPath?: string; // TypeScript設定ファイルパス
}

/**
 * OutputConfig - 出力設定
 * 
 * 生成されるドキュメントの出力先と形式を指定します。
 */
export interface OutputConfig {
  dir: string;                                   // 出力ディレクトリ
  format: 'markdown' | 'json' | 'html' | string; // 出力形式（拡張可能）
  filename: string;                              // 出力ファイル名
}

/**
 * ValidationConfigDetailed - 詳細検証設定
 * 
 * コンポーネントの品質を保証するための検証ルールを定義します。
 */
export interface ValidationConfigDetailed {
  enabled: boolean; // 検証機能の有効/無効
  rules: {
    syntaxCheck: boolean;        // 構文チェック
    styleValidation: boolean;    // スタイル検証
    accessibilityCheck: boolean; // アクセシビリティチェック
    performanceHints: boolean;   // パフォーマンスヒント
    [key: string]: boolean;      // 拡張可能なカスタムルール
  };
}

/**
 * GenerationConfigDetailed - ドキュメント生成詳細設定
 * 
 * 生成されるドキュメントの内容と品質を制御します。
 * プラットフォーム固有の設定もサポートしています。
 */
export interface GenerationConfigDetailed {
  includeExamples: boolean;              // 使用例の含有
  includeStyleValidation: boolean;       // スタイル検証情報の含有
  includeAccessibilityInfo: boolean;     // アクセシビリティ情報の含有
  includeBestPractices: boolean;         // ベストプラクティスの含有
  includeNativeImports?: boolean;        // React Native用インポート情報
  includeStyleSheetExamples?: boolean;   // StyleSheet使用例
  platformSpecific: Record<string, Record<string, any>>; // プラットフォーム固有設定（完全拡張可能）
}

export interface CategorizationConfig {
  atoms: string[];
  molecules: string[];
  organisms: string[];
  templates: string[];
  pages: string[];
  [key: string]: string[]; // カスタムカテゴリも許可
}

export interface ExtensionsConfig {
  customPlatforms: Record<string, CustomPlatformConfig>;
  customStyleSystems: Record<string, CustomStyleSystemConfig>;
  customValidators: Record<string, CustomValidatorConfig>;
  customGenerators: Record<string, CustomGeneratorConfig>;
}

export interface CustomPlatformConfig {
  name: string;
  fileExtensions: string[];
  componentPattern: RegExp;
  styleExtractor: string; // モジュールパス
  validator: string; // モジュールパス
  generator: string; // モジュールパス
}

export interface CustomStyleSystemConfig {
  name: string;
  pattern: RegExp;
  extractor: string; // モジュールパス
  validator: string; // モジュールパス
}

export interface CustomValidatorConfig {
  name: string;
  rules: string[];
  validator: string; // モジュールパス
}

export interface CustomGeneratorConfig {
  name: string;
  templates: Record<string, string>;
  generator: string; // モジュールパス
}

/**
 * ConfigManager - 設定管理Singletonクラス
 * 
 * アプリケーション全体で一意の設定インスタンスを管理します。
 * 設定の読み込み、検証、永続化を担当し、拡張性のあるアーキテクチャを提供します。
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: DesignSystemConfig | null = null;
  private configPath: string = '';

  /**
   * プライベートコンストラクタ（Singletonパターン）
   */
  private constructor() {}

  /**
   * ConfigManagerインスタンスを取得（Singletonパターン）
   * @returns ConfigManagerの唯一のインスタンス
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 設定ファイルを自動検出して読み込む
   * 
   * 複数のファイル形式（.js, .json, package.json）をサポートし、
   * 最初に見つかった有効な設定を使用します。
   * 
   * @param configPath 特定の設定ファイルパス（オプション）
   * @returns 検証済み設定オブジェクト
   */
  async loadConfig(configPath?: string): Promise<DesignSystemConfig> {
    const possiblePaths = [
      configPath,
      'design-system.config.js',
      'design-system.config.json',
      '.design-system.json',
      'package.json' // package.jsonのdesignSystemフィールド
    ].filter(Boolean) as string[];

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath)) {
          this.configPath = filePath;
          
          if (filePath === 'package.json') {
            // package.jsonのdesignSystemフィールド
            const content = fs.readFileSync(filePath, 'utf-8');
            const pkg = JSON.parse(content);
            if (pkg.designSystem) {
              this.config = pkg.designSystem;
            }
          } else if (filePath.endsWith('.js')) {
            // JavaScript設定ファイル
            delete require.cache[require.resolve(path.resolve(filePath))];
            this.config = require(path.resolve(filePath));
          } else if (filePath.endsWith('.json')) {
            // JSON設定ファイル
            const content = fs.readFileSync(filePath, 'utf-8');
            this.config = JSON.parse(content);
          }
          
          if (this.config) {
            break;
          }
        }
      } catch (error) {
        console.warn(`Failed to load config from ${filePath}:`, error);
      }
    }

    if (!this.config) {
      // デフォルト設定
      this.config = this.getDefaultConfig();
    }

    return this.validateAndNormalizeConfig(this.config);
  }

  /**
   * 現在の設定を取得
   * 
   * @returns 現在の設定オブジェクト
   * @throws {Error} 設定が未読み込みの場合
   */
  getConfig(): DesignSystemConfig {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * 設定を直接設定（プログラム実行時の動的設定変更用）
   * 
   * @param config 新しい設定オブジェクト
   */
  setConfig(config: DesignSystemConfig): void {
    this.config = this.validateAndNormalizeConfig(config);
  }

  /**
   * デフォルト設定を生成
   * 
   * 設定ファイルが見つからない場合や、必須項目が不足している場合に使用されます。
   * Web + Tailwind環境を基本とした安全な設定を提供します。
   * 
   * @returns デフォルト設定オブジェクト
   */
  private getDefaultConfig(): DesignSystemConfig {
    return {
      platform: 'web',
      styleSystem: 'tailwind',
      source: {
        dir: 'src',
        include: ['**/*.{tsx,ts,jsx,js}'],
        exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
      },
      output: {
        dir: 'docs',
        format: 'markdown',
        filename: 'design-system.md'
      },
      validation: {
        enabled: true,
        rules: {
          syntaxCheck: true,
          styleValidation: true,
          accessibilityCheck: false,
          performanceHints: false
        }
      },
      generation: {
        includeExamples: true,
        includeStyleValidation: true,
        includeAccessibilityInfo: false,
        includeBestPractices: true,
        platformSpecific: {}
      },
      extensions: {
        customPlatforms: {},
        customStyleSystems: {},
        customValidators: {},
        customGenerators: {}
      }
    };
  }

  /**
   * 設定の検証と正規化
   * 
   * 不完全な設定にデフォルト値を補完し、プラットフォーム固有設定をマージします。
   * これにより、後続の処理で安全に設定を利用できます。
   * 
   * @param config 生の設定オブジェクト
   * @returns 検証・正規化済み設定オブジェクト
   */
  private validateAndNormalizeConfig(config: DesignSystemConfig): DesignSystemConfig {
    // 基本的なバリデーション - 設定されていない場合のみデフォルト値を設定
    if (!config.platform) {
      config.platform = 'web';
    }
    
    if (!config.styleSystem) {
      config.styleSystem = 'tailwind';
    }

    // generation設定のデフォルト値設定
    if (!config.generation) {
      config.generation = {
        includeExamples: true,
        includeStyleValidation: true,
        includeAccessibilityInfo: true,
        includeBestPractices: true,
        platformSpecific: {}
      };
    } else {
      // 個別プロパティのデフォルト値設定
      if (!config.generation.platformSpecific) {
        config.generation.platformSpecific = {};
      }
    }

    // extensions設定のデフォルト値設定
    if (!config.extensions) {
      config.extensions = {
        customPlatforms: {},
        customStyleSystems: {},
        customValidators: {},
        customGenerators: {}
      };
    }

    // プラットフォーム固有設定のマージ
    if (config.generation?.platformSpecific && config.generation.platformSpecific[config.platform as string]) {
      const platformSpecific = config.generation.platformSpecific[config.platform as string];
      config.generation = { ...config.generation, ...platformSpecific };
    }

    return config;
  }

  /**
   * カスタムプラットフォームの登録
   * 
   * 既存のweb/react-native以外のプラットフォームをサポートするために使用します。
   * 例: Flutter、Vue.js、Angular等
   * 
   * @param name プラットフォーム名
   * @param config プラットフォーム設定
   */
  registerCustomPlatform(name: string, config: CustomPlatformConfig): void {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    this.config.extensions.customPlatforms[name] = config;
  }

  /**
   * カスタムスタイルシステムの登録
   * 
   * 既存のtailwind/stylesheet/styled-components以外のスタイルシステムをサポートするために使用します。
   * 例: Emotion、Stitches、vanilla-extract等
   * 
   * @param name スタイルシステム名
   * @param config スタイルシステム設定
   */
  registerCustomStyleSystem(name: string, config: CustomStyleSystemConfig): void {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    this.config.extensions.customStyleSystems[name] = config;
  }

  /**
   * カスタムバリデーターの登録
   * 
   * 独自の検証ルールを追加するために使用します。
   * 例: 企業固有のデザインガイドライン検証等
   * 
   * @param name バリデーター名
   * @param config バリデーター設定
   */
  registerCustomValidator(name: string, config: CustomValidatorConfig): void {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    this.config.extensions.customValidators[name] = config;
  }

  /**
   * カスタムプラットフォームかどうかを判定
   * 
   * @param platform プラットフォーム名
   * @returns カスタムプラットフォームの場合true
   */
  isCustomPlatform(platform: string): boolean {
    return !['web', 'react-native'].includes(platform) && 
           !!this.config?.extensions.customPlatforms[platform];
  }

  /**
   * カスタムスタイルシステムかどうかを判定
   * 
   * @param styleSystem スタイルシステム名
   * @returns カスタムスタイルシステムの場合true
   */
  isCustomStyleSystem(styleSystem: string): boolean {
    return !['tailwind', 'stylesheet', 'styled-components'].includes(styleSystem) &&
           !!this.config?.extensions.customStyleSystems[styleSystem];
  }

  /**
   * 設定をファイルに保存
   * 
   * 現在の設定または指定された設定を、最後に読み込んだファイル形式で保存します。
   * 
   * @param config 保存する設定（省略時は現在の設定）
   */
  async saveConfig(config?: DesignSystemConfig): Promise<void> {
    const configToSave = config || this.config;
    if (!configToSave) {
      throw new Error('No config to save');
    }

    if (this.configPath.endsWith('.js')) {
      const content = `// Design System Documentation Generator Configuration
module.exports = ${JSON.stringify(configToSave, null, 2)};`;
      fs.writeFileSync(this.configPath, content, 'utf-8');
    } else {
      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2), 'utf-8');
    }
  }
}