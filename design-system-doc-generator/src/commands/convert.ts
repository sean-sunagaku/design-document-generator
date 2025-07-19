import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { StyleConverter } from '../utils/StyleConverter';
import { findFiles } from '../utils/fileUtils';
import { StyleSystem } from '../types';

export interface ConvertOptions {
  from: StyleSystem;
  to: StyleSystem;
  source: string;
  output?: string;
  file?: string;
}

export class ConvertCommand {
  private options: ConvertOptions;
  private converter: StyleConverter;

  constructor(options: ConvertOptions) {
    this.options = options;
    this.converter = new StyleConverter();
  }

  async execute(): Promise<void> {
    // バリデーション
    this.validateOptions();

    if (this.options.file) {
      // 単一ファイルの変換
      await this.convertSingleFile(this.options.file);
    } else {
      // ディレクトリ全体の変換
      await this.convertDirectory();
    }
  }

  private validateOptions(): void {
    const supportedSystems: StyleSystem[] = ['tailwind', 'stylesheet'];
    
    if (!supportedSystems.includes(this.options.from)) {
      throw new Error(`Unsupported source style system: ${this.options.from}`);
    }
    
    if (!supportedSystems.includes(this.options.to)) {
      throw new Error(`Unsupported target style system: ${this.options.to}`);
    }
    
    if (this.options.from === this.options.to) {
      throw new Error('Source and target style systems cannot be the same');
    }
  }

  private async convertSingleFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(chalk.blue(`Converting file: ${filePath}`));
    
    const content = await fs.promises.readFile(absolutePath, 'utf-8');
    const convertedContent = await this.convertContent(content, filePath);
    
    const outputPath = this.getOutputPath(filePath);
    await fs.promises.writeFile(outputPath, convertedContent, 'utf-8');
    
    console.log(chalk.green(`Converted: ${outputPath}`));
  }

  private async convertDirectory(): Promise<void> {
    const sourcePath = path.resolve(this.options.source);
    
    // ファイルパターンを決定
    const patterns = this.getFilePatterns();
    
    console.log(chalk.blue(`Scanning directory: ${sourcePath}`));
    
    const allFiles = [];
    for (const pattern of patterns) {
      const files = await findFiles(`${sourcePath}/${pattern}`);
      allFiles.push(...files);
    }

    const filteredFiles = allFiles.filter(file => 
      !file.includes('node_modules') &&
      !file.includes('.test.') &&
      !file.includes('.spec.') &&
      !file.includes('.stories.')
    );

    console.log(chalk.gray(`Found ${filteredFiles.length} files to convert`));

    for (const file of filteredFiles) {
      try {
        await this.convertSingleFile(file);
      } catch (error) {
        console.warn(chalk.yellow(`Failed to convert ${file}: ${error}`));
      }
    }
  }

  private getFilePatterns(): string[] {
    // ファイル拡張子を決定
    if (this.options.from === 'tailwind' || this.options.to === 'tailwind') {
      return ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'];
    } else {
      return ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'];
    }
  }

  private async convertContent(content: string, filePath: string): Promise<string> {
    if (this.options.from === 'tailwind' && this.options.to === 'stylesheet') {
      return this.convertTailwindToStyleSheet(content);
    } else if (this.options.from === 'stylesheet' && this.options.to === 'tailwind') {
      return this.convertStyleSheetToTailwind(content);
    }
    
    throw new Error(`Conversion from ${this.options.from} to ${this.options.to} is not supported`);
  }

  private convertTailwindToStyleSheet(content: string): string {
    // className="..." パターンを探して変換
    const classNameRegex = /className=["']([^"']+)["']/g;
    
    let convertedContent = content;
    let match;
    let stylesObject: Record<string, any> = {};
    
    while ((match = classNameRegex.exec(content)) !== null) {
      const classNames = match[1].split(' ').filter(Boolean);
      const result = this.converter.tailwindToStyleSheet(classNames);
      
      if (result.success && Object.keys(result.styles).length > 0) {
        // スタイルオブジェクトに追加
        const styleKey = `style${Object.keys(stylesObject).length + 1}`;
        stylesObject[styleKey] = result.styles;
        
        // classNameをstyleに置換
        convertedContent = convertedContent.replace(
          match[0],
          `style={styles.${styleKey}}`
        );
      }
    }
    
    // StyleSheetのimportを追加
    if (Object.keys(stylesObject).length > 0) {
      const importRegex = /import.*from ['"]react-native['"];?/;
      if (importRegex.test(convertedContent)) {
        // 既存のreact-nativeインポートにStyleSheetを追加
        convertedContent = convertedContent.replace(
          /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"];?/,
          (match, imports) => {
            if (!imports.includes('StyleSheet')) {
              return match.replace(imports, `${imports.trim()}, StyleSheet`);
            }
            return match;
          }
        );
      } else {
        // 新しいStyleSheetインポートを追加
        const reactImportMatch = convertedContent.match(/import.*from ['"]react['"];?/);
        if (reactImportMatch) {
          const insertIndex = convertedContent.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
          convertedContent = 
            convertedContent.slice(0, insertIndex) +
            '\nimport { StyleSheet } from \'react-native\';' +
            convertedContent.slice(insertIndex);
        }
      }
      
      // StyleSheetオブジェクトを追加
      const stylesDefinition = `\nconst styles = StyleSheet.create(${JSON.stringify(stylesObject, null, 2)});\n`;
      convertedContent += stylesDefinition;
    }
    
    return convertedContent;
  }

  private convertStyleSheetToTailwind(content: string): string {
    // style={styles.xxx} パターンを探して変換
    const styleRegex = /style=\{styles\.(\w+)\}/g;
    
    let convertedContent = content;
    let match;
    
    // StyleSheet.create()からスタイルオブジェクトを抽出
    const styleSheetMatch = content.match(/const\s+styles\s*=\s*StyleSheet\.create\s*\(\s*({[\s\S]*?})\s*\)/);
    let stylesObject: Record<string, any> = {};
    
    if (styleSheetMatch) {
      try {
        // 簡単なJavaScriptオブジェクト解析（実際の実装では抽象構文木解析が必要）
        stylesObject = JSON.parse(styleSheetMatch[1].replace(/(\w+):/g, '"$1":'));
      } catch (error) {
        console.warn('Failed to parse StyleSheet object');
      }
    }
    
    while ((match = styleRegex.exec(content)) !== null) {
      const styleKey = match[1];
      const styleObj = stylesObject[styleKey];
      
      if (styleObj) {
        const result = this.converter.styleSheetToTailwind(styleObj);
        
        if (result.success && result.classes.length > 0) {
          // style={}をclassName=""に置換
          convertedContent = convertedContent.replace(
            match[0],
            `className="${result.classes.join(' ')}"`
          );
        }
      }
    }
    
    // StyleSheetのインポートを削除
    convertedContent = convertedContent.replace(
      /import\s*\{([^}]*),?\s*StyleSheet\s*,?([^}]*)\}\s*from\s*['"]react-native['"];?/,
      (match, before, after) => {
        const imports = [before, after].filter(Boolean).join(', ').trim();
        if (imports) {
          return `import { ${imports} } from 'react-native';`;
        } else {
          return '';
        }
      }
    );
    
    // StyleSheet定義を削除
    convertedContent = convertedContent.replace(/const\s+styles\s*=\s*StyleSheet\.create\s*\([^)]*\);\s*/g, '');
    
    return convertedContent;
  }

  private getOutputPath(inputPath: string): string {
    if (this.options.output) {
      const outputDir = path.resolve(this.options.output);
      const fileName = path.basename(inputPath);
      return path.join(outputDir, fileName);
    } else {
      // 元のファイルに .converted を追加
      const dir = path.dirname(inputPath);
      const name = path.basename(inputPath, path.extname(inputPath));
      const ext = path.extname(inputPath);
      return path.join(dir, `${name}.converted${ext}`);
    }
  }
}