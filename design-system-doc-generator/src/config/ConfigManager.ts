import * as fs from 'fs';
import * as path from 'path';
import { Platform, PlatformConfig, StyleSystem } from '../types';

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

export interface SourceConfig {
  dir: string;
  include: string[];
  exclude: string[];
  tsConfigPath?: string;
}

export interface OutputConfig {
  dir: string;
  format: 'markdown' | 'json' | 'html' | string; // 拡張可能
  filename: string;
}

export interface ValidationConfigDetailed {
  enabled: boolean;
  rules: {
    syntaxCheck: boolean;
    styleValidation: boolean;
    accessibilityCheck: boolean;
    performanceHints: boolean;
    [key: string]: boolean; // 拡張可能なルール
  };
}

export interface GenerationConfigDetailed {
  includeExamples: boolean;
  includeStyleValidation: boolean;
  includeAccessibilityInfo: boolean;
  includeBestPractices: boolean;
  includeNativeImports?: boolean;
  includeStyleSheetExamples?: boolean;
  platformSpecific: Record<string, Record<string, any>>; // 完全に拡張可能
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

export class ConfigManager {
  private static instance: ConfigManager;
  private config: DesignSystemConfig | null = null;
  private configPath: string = '';

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

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

  getConfig(): DesignSystemConfig {
    if (!this.config) {
      throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  setConfig(config: DesignSystemConfig): void {
    this.config = this.validateAndNormalizeConfig(config);
  }

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

  // 拡張性: 新しいプラットフォームの登録
  registerCustomPlatform(name: string, config: CustomPlatformConfig): void {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    this.config.extensions.customPlatforms[name] = config;
  }

  // 拡張性: 新しいスタイルシステムの登録
  registerCustomStyleSystem(name: string, config: CustomStyleSystemConfig): void {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    this.config.extensions.customStyleSystems[name] = config;
  }

  // 拡張性: カスタムバリデーターの登録
  registerCustomValidator(name: string, config: CustomValidatorConfig): void {
    if (!this.config) {
      throw new Error('Config not loaded');
    }
    this.config.extensions.customValidators[name] = config;
  }

  // プラットフォームが拡張されたものかチェック
  isCustomPlatform(platform: string): boolean {
    return !['web', 'react-native'].includes(platform) && 
           !!this.config?.extensions.customPlatforms[platform];
  }

  // スタイルシステムが拡張されたものかチェック
  isCustomStyleSystem(styleSystem: string): boolean {
    return !['tailwind', 'stylesheet', 'styled-components'].includes(styleSystem) &&
           !!this.config?.extensions.customStyleSystems[styleSystem];
  }

  // 設定の保存
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