import * as path from 'path';
import chalk from 'chalk';
import { ConfigManager } from '../config/ConfigManager';
import { StyleExtractorFactory } from '../extractors/StyleExtractorFactory';
import { PlatformExtractorFactory } from '../extractors/PlatformExtractorFactory';
import { Platform, ValidationResult } from '../types';

export interface ValidateOptions {
  source: string;
  config?: string;
  rules: string;
  platform?: Platform;
}

export interface ValidationSummary {
  totalFiles: number;
  totalComponents: number;
  errors: number;
  warnings: number;
  results: ValidationResult[];
}

export class ValidateCommand {
  private options: ValidateOptions;

  constructor(options: ValidateOptions) {
    this.options = options;
  }

  async execute(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    
    console.log(chalk.blue('🔍 Loading configuration...'));
    
    // ConfigManagerから設定を取得
    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig(this.options.config);
    
    const finalPlatform = (this.options.platform || config.platform) as Platform;
    const rules = this.parseRules(this.options.rules);
    
    console.log(chalk.gray(`Platform: ${finalPlatform}`));
    console.log(chalk.gray(`Rules: ${rules.join(', ')}`));
    
    // Factory patternで適切なextractorを作成
    const extractorConfig = {
      sourceDir: sourcePath,
      platform: finalPlatform,
      ignore: [
        '**/node_modules/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
        '**/dist/**',
        '**/build/**',
      ],
    };

    // 既存のTailwindExtractorを使用（一時的な修正）
    const tailwindExtractor = new (await import('../extractors/TailwindExtractor')).TailwindExtractor({
      sourceDir: sourcePath,
      ignore: [
        '**/node_modules/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.stories.*',
        '**/dist/**',
        '**/build/**',
      ],
    });
    
    console.log(chalk.blue('🔍 Finding component files...'));
    
    // プラットフォーム固有のファイル検索（一時的な修正）
    const { findFiles } = await import('../utils/fileUtils');
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

    const componentFiles = allFiles.filter(file => 
      !file.includes('node_modules') &&
      !file.includes('.test.') &&
      !file.includes('.spec.') &&
      !file.includes('.stories.') &&
      (file.endsWith('.tsx') || file.endsWith('.jsx'))
    );
    console.log(chalk.gray(`Found ${componentFiles.length} component files`));
    
    const summary: ValidationSummary = {
      totalFiles: componentFiles.length,
      totalComponents: 0,
      errors: 0,
      warnings: 0,
      results: []
    };
    
    console.log(chalk.blue('🔍 Validating components...'));
    
    // 各ファイルをバリデーション
    for (const file of componentFiles) {
      try {
        const result = await this.validateFile(file, rules, tailwindExtractor, null);
        summary.results.push(result);
        summary.totalComponents += result.componentCount || 1;
        summary.errors += result.errors.length;
        summary.warnings += result.warnings.length;
        
        this.printFileResult(file, result);
      } catch (error) {
        console.error(chalk.red(`Error validating ${file}: ${error}`));
        summary.errors++;
      }
    }
    
    // サマリーを表示
    this.printSummary(summary);
    
    // エラーがある場合は非ゼロで終了
    if (summary.errors > 0) {
      process.exit(1);
    }
  }

  private parseRules(rulesString: string): string[] {
    return rulesString.split(',').map(rule => rule.trim()).filter(Boolean);
  }

  private async validateFile(
    filePath: string,
    rules: string[],
    tailwindExtractor: any,
    platformExtractor: any
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      filePath,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // コンポーネント抽出（一時的な修正）
      const component = await tailwindExtractor.extractFromFile(filePath);
      result.componentCount = component ? 1 : 0;

      // スタイルバリデーション
      if (rules.includes('style') && component) {
        // 簡易実装：Tailwindクラスの基本的なバリデーション
        if (component.styles?.tailwindClasses) {
          component.styles.tailwindClasses.forEach((className: string) => {
            if (className.includes('undefined') || className.includes('null')) {
              result.errors.push({
                message: `Invalid class name: ${className}`,
                code: 'INVALID_CLASS_NAME',
                severity: 'error'
              });
            }
          });
        }
      }

      // 構文バリデーション（簡易実装）
      if (rules.includes('syntax')) {
        const fs = await import('fs');
        const content = await fs.promises.readFile(filePath, 'utf-8');
        if (content.includes('console.log')) {
          result.warnings.push({
            message: 'Consider removing console.log statements in production code',
            code: 'CONSOLE_LOG_FOUND',
            severity: 'warning'
          });
        }
      }

      // アクセシビリティバリデーション（簡易実装）
      if (rules.includes('accessibility')) {
        const fs = await import('fs');
        const content = await fs.promises.readFile(filePath, 'utf-8');
        if (content.includes('onPress') && !content.includes('accessibilityLabel')) {
          result.warnings.push({
            message: 'Interactive elements should have accessibility labels',
            code: 'MISSING_ACCESSIBILITY_LABEL',
            severity: 'warning'
          });
        }
      }
    } catch (error) {
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: `Failed to validate file: ${error}`,
        severity: 'error'
      });
    }

    return result;
  }

  private validateAccessibility(component: any): { warnings: any[], suggestions: any[] } {
    const warnings = [];
    const suggestions = [];

    // アクセシビリティラベルのチェック
    if (component.props?.some((prop: any) => 
      ['onPress', 'onTouchStart', 'onClick'].includes(prop.name)
    )) {
      const hasA11yLabel = component.props?.some((prop: any) => 
        ['accessibilityLabel', 'aria-label', 'title'].includes(prop.name)
      );
      
      if (!hasA11yLabel) {
        warnings.push({
          code: 'MISSING_ACCESSIBILITY_LABEL',
          message: 'Interactive element should have an accessibility label',
          severity: 'warning'
        });
      }
    }

    // カラーコントラストのチェック
    if (component.styles?.backgroundColor && component.styles?.color) {
      // 簡単なコントラストチェック（実際の実装ではより詳細な計算が必要）
      suggestions.push({
        code: 'CHECK_COLOR_CONTRAST',
        message: 'Consider checking color contrast ratio for accessibility',
        severity: 'info'
      });
    }

    return { warnings, suggestions };
  }

  private validatePerformance(component: any): { warnings: any[], suggestions: any[] } {
    const warnings = [];
    const suggestions = [];

    // 大きなコンポーネントの警告
    if (component.lines && component.lines > 200) {
      warnings.push({
        code: 'LARGE_COMPONENT',
        message: `Component is large (${component.lines} lines). Consider splitting into smaller components.`,
        severity: 'warning'
      });
    }

    // インラインスタイルの警告
    if (component.styles?.inline && Object.keys(component.styles.inline).length > 10) {
      suggestions.push({
        code: 'MANY_INLINE_STYLES',
        message: 'Consider moving inline styles to a StyleSheet for better performance',
        severity: 'info'
      });
    }

    return { warnings, suggestions };
  }

  private printFileResult(filePath: string, result: ValidationResult): void {
    const relativePath = path.relative(process.cwd(), filePath);
    
    if (result.errors.length > 0) {
      console.log(chalk.red(`❌ ${relativePath} (${result.errors.length} errors, ${result.warnings.length} warnings)`));
      result.errors.forEach(error => {
        console.log(chalk.red(`   Error: ${error.message} (${error.code})`));
      });
    } else if (result.warnings.length > 0) {
      console.log(chalk.yellow(`⚠️  ${relativePath} (${result.warnings.length} warnings)`));
    } else {
      console.log(chalk.green(`✅ ${relativePath}`));
    }

    // 警告を表示
    result.warnings.forEach(warning => {
      console.log(chalk.yellow(`   Warning: ${warning.message} (${warning.code})`));
    });

    // 提案を表示（詳細モードの場合）
    if (process.env.VERBOSE) {
      result.suggestions.forEach(suggestion => {
        console.log(chalk.blue(`   Suggestion: ${suggestion.message} (${suggestion.code})`));
      });
    }
  }

  private printSummary(summary: ValidationSummary): void {
    console.log(chalk.bold('\n📊 Validation Summary:'));
    console.log(`  Files scanned: ${summary.totalFiles}`);
    console.log(`  Components found: ${summary.totalComponents}`);
    
    if (summary.errors > 0) {
      console.log(chalk.red(`  Errors: ${summary.errors}`));
    } else {
      console.log(chalk.green(`  Errors: ${summary.errors}`));
    }
    
    if (summary.warnings > 0) {
      console.log(chalk.yellow(`  Warnings: ${summary.warnings}`));
    } else {
      console.log(chalk.green(`  Warnings: ${summary.warnings}`));
    }

    // 最も多いエラータイプを表示
    const errorCounts: Record<string, number> = {};
    summary.results.forEach(result => {
      result.errors.forEach(error => {
        errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
      });
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topErrors.length > 0) {
      console.log(chalk.bold('\n🔍 Most common issues:'));
      topErrors.forEach(([code, count]) => {
        console.log(chalk.gray(`  ${code}: ${count} occurrences`));
      });
    }

    if (summary.errors === 0 && summary.warnings === 0) {
      console.log(chalk.green('\n🎉 All validations passed!'));
    } else if (summary.errors === 0) {
      console.log(chalk.yellow('\n✨ No errors found, but there are some warnings to address.'));
    } else {
      console.log(chalk.red('\n❌ Validation failed. Please fix the errors above.'));
    }
  }
}