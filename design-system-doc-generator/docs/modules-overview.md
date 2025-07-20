# モジュール機能概要ドキュメント

## 概要

このドキュメントは、デザインシステムドキュメント生成ツールで使用されている全モジュール・ライブラリの機能、選択理由、使用方法について包括的に説明します。外部依存関係から内部ユーティリティまで、システム全体で活用されている技術要素を詳しく解説します。

## 外部依存関係

### 1. コア言語・ランタイム

#### Node.js
**バージョン**: 18.x以上  
**用途**: サーバーサイドJavaScript実行環境  
**選択理由**: 
- TypeScriptの実行環境として最適
- 豊富なエコシステム
- ファイルシステムAPIの充実
- 並列処理サポート

```typescript
// 使用例
import * as fs from 'fs';
import * as path from 'path';

// ファイル操作での活用
await fs.promises.readFile(filePath, 'utf-8');
```

#### TypeScript
**バージョン**: 4.9.x以上  
**用途**: 型安全なJavaScript開発  
**選択理由**:
- 大規模プロジェクトでの保守性向上
- AST操作の型安全性
- IDEサポートの充実
- リファクタリングの安全性

```typescript
// 型安全な設計例
interface ExtractedComponent {
  componentName: string;
  filePath: string;
  tailwindClasses: string[];
  props: PropInfo[];
  category: AtomicDesignCategory;
}
```

### 2. AST解析・コンパイラ関連

#### TypeScript Compiler API
**パッケージ**: `typescript`  
**用途**: TypeScript ASTの解析・操作  
**主要機能**:
- TypeScriptファイルのAST生成
- 型情報の抽出
- ノード走査・検索

```typescript
import * as ts from 'typescript';

// AST生成とノード解析
const sourceFile = ts.createSourceFile(
  fileName,
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

// 特定ノードタイプの検索
ts.forEachChild(sourceFile, (node) => {
  if (ts.isInterfaceDeclaration(node)) {
    // Props インターフェースの処理
  }
});
```

**なぜTypeScript Compiler APIか？**:
- React/TypeScriptプロジェクトの標準的な解析ツール
- 型情報の精密な抽出
- 公式サポートによる安定性
- babel AST よりもTypeScript固有の型情報が豊富

### 3. JSON操作・差分検出

#### jsondiffpatch
**パッケージ**: `jsondiffpatch`  
**用途**: JSON オブジェクトの精密な差分検出  
**主要機能**:
- オブジェクト間の詳細な差分計算
- 配列要素の移動検出
- カスタムハッシュ関数サポート

```typescript
import * as jsondiffpatch from 'jsondiffpatch';

// DiffEngine での使用例
const differ = jsondiffpatch.create({
  objectHash: (obj: any) => {
    if (obj.filePath) return obj.filePath;
    return JSON.stringify(obj);
  },
  arrays: {
    detectMove: true,
    includeValueOnMove: false,
  }
});

const delta = differ.diff(oldSnapshot, newSnapshot);
```

**なぜjsondiffpatchか？**:
- 高度な差分検出アルゴリズム
- カスタマイズ可能なハッシュ関数
- 大きなオブジェクトの効率的な処理
- 視覚的な差分表示サポート

### 4. ターミナル・CLI関連

#### chalk
**パッケージ**: `chalk`  
**用途**: ターミナル出力の色付け・装飾  
**主要機能**:
- テキストの色変更
- 背景色の変更
- 太字・斜体などのスタイリング

```typescript
import chalk from 'chalk';

// 差分表示での色分け
console.log(chalk.green('+ 追加されたコンポーネント:'));
console.log(chalk.red('- 削除されたコンポーネント:'));
console.log(chalk.yellow('~ 変更されたコンポーネント:'));
```

**なぜchalkか？**:
- ターミナル環境の差異を吸収
- 豊富な色・スタイルオプション
- TypeScript サポート
- クロスプラットフォーム対応

#### commander (想定)
**パッケージ**: `commander`  
**用途**: コマンドライン引数の解析  
**主要機能**:
- サブコマンドの定義
- オプション解析
- ヘルプの自動生成

```typescript
import { Command } from 'commander';

const program = new Command();
program
  .command('generate')
  .option('-s, --source <path>', 'Source directory')
  .option('-o, --output <path>', 'Output directory')
  .action((options) => {
    // generate コマンドの実行
  });
```

### 5. ファイル操作・パス処理

#### Node.js 標準モジュール
**モジュール**: `fs`, `path`  
**用途**: ファイルシステム操作  
**主要機能**:

```typescript
import * as fs from 'fs';
import * as path from 'path';

// ファイル読み込み（非同期）
const content = await fs.promises.readFile(filePath, 'utf-8');

// ディレクトリ作成
await fs.promises.mkdir(outputDir, { recursive: true });

// パス結合・正規化
const resolvedPath = path.resolve(basePath, relativePath);
const extension = path.extname(fileName);
```

**なぜ標準モジュールか？**:
- 外部依存なしでの軽量性
- Node.js との完全互換性
- セキュリティリスクの最小化
- パフォーマンスの最適化

### 6. 開発・テスト環境

#### Jest
**パッケージ**: `jest`, `@types/jest`  
**用途**: 単体テスト・統合テストフレームワーク  
**主要機能**:
- テストケースの実行
- モック機能
- カバレッジ計測

```typescript
// テスト例
describe('ConfigManager', () => {
  test('should return singleton instance', () => {
    const instance1 = ConfigManager.getInstance();
    const instance2 = ConfigManager.getInstance();
    expect(instance1).toBe(instance2);
  });
});
```

## 内部モジュール・ユーティリティ

### 1. 設定管理モジュール

#### ConfigManager
**場所**: `src/config/ConfigManager.ts`  
**機能**:
- Singleton パターンによる設定の一元管理
- プラットフォーム/スタイルシステムの管理
- カスタム設定の登録・検索

```typescript
class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;
  
  // Singleton アクセス
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  // プラットフォーム設定
  setPlatform(platform: Platform): void;
  getPlatform(): Platform;
  
  // カスタムスタイルシステム登録
  registerCustomStyleSystem(name: string, config: CustomStyleSystemConfig): void;
}
```

**なぜConfigManagerが必要か？**:
- 複数クラス間での設定共有
- プラットフォーム固有設定の統一管理
- 実行時設定変更の対応
- カスタム拡張のサポート

### 2. ファイル操作ユーティリティ

#### FileUtils
**場所**: `src/utils/fileUtils.ts`  
**機能**:
- 安全なファイル読み書き
- ディレクトリ操作
- パターンマッチング

```typescript
export class FileUtils {
  // 安全なファイル読み込み
  static async readFilesSafely(patterns: string[]): Promise<FileInfo[]> {
    const files = await glob(patterns);
    return Promise.all(files.map(async (file) => {
      try {
        const content = await fs.promises.readFile(file, 'utf-8');
        return { path: file, content, success: true };
      } catch (error) {
        return { path: file, error, success: false };
      }
    }));
  }
  
  // ディレクトリの確実な作成
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }
}
```

**なぜFileUtilsが必要か？**:
- エラー耐性のあるファイル操作
- 統一されたファイル処理インターフェース
- セキュリティ考慮（パストラバーサル対策）
- パフォーマンス最適化（バッチ処理）

### 3. ハッシュ生成ユーティリティ

#### Hash
**場所**: `src/utils/hash.ts`  
**機能**:
- 一意IDの生成
- 内容ベースハッシュ
- 衝突回避

```typescript
export class Hash {
  // コンポーネントID生成
  static generateComponentId(category: string, name: string): string {
    return `${category}-${this.createHash(name)}`;
  }
  
  // 内容ベースハッシュ
  static createContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
  }
  
  // 安全なファイル名生成
  static toSafeFileName(input: string): string {
    return input.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }
}
```

**なぜHashが必要か？**:
- 一意識別子の確実な生成
- ファイル名の安全性保証
- キャッシュキーの生成
- データ整合性の検証

### 4. コード検証ユーティリティ

#### CodeValidator
**場所**: `src/utils/codeValidation.ts`  
**機能**:
- TypeScript構文検証
- Tailwindクラス検証
- コンポーネント使用法検証

```typescript
export class CodeValidator {
  // TypeScript 構文検証
  validateSyntax(code: string): ValidationResult {
    try {
      const sourceFile = ts.createSourceFile(
        'temp.tsx',
        code,
        ts.ScriptTarget.Latest,
        true
      );
      
      const diagnostics = sourceFile.parseDiagnostics;
      return {
        isValid: diagnostics.length === 0,
        errors: diagnostics.map(d => ({
          message: d.messageText.toString(),
          line: d.start ? ts.getLineAndCharacterOfPosition(sourceFile, d.start).line : 0
        }))
      };
    } catch (error) {
      return { isValid: false, errors: [{ message: error.message }] };
    }
  }
  
  // Tailwind クラス検証
  validateTailwindClasses(classes: string[]): ValidationResult {
    const invalidClasses = classes.filter(cls => !this.isTailwindClass(cls));
    return {
      isValid: invalidClasses.length === 0,
      warnings: invalidClasses.map(cls => ({
        message: `'${cls}' is not a valid Tailwind CSS class`,
        code: 'INVALID_TAILWIND_CLASS'
      }))
    };
  }
}
```

**なぜCodeValidatorが必要か？**:
- 生成されたコード例の品質保証
- 実際に動作するコードの提供
- 開発者体験の向上
- エラーの早期発見

### 5. スタイル変換ユーティリティ

#### StyleConverter
**場所**: `src/utils/StyleConverter.ts`  
**機能**:
- プラットフォーム間のスタイル変換
- Tailwind ⇔ React Native StyleSheet
- CSS-in-JS形式変換

```typescript
export class StyleConverter {
  // Tailwind → React Native StyleSheet 変換
  static tailwindToStyleSheet(classes: string[]): StyleSheetStyles {
    const styles: StyleSheetStyles = {};
    
    classes.forEach(className => {
      const rnStyle = TailwindUtils.convertToReactNative(className);
      if (rnStyle) {
        Object.assign(styles, rnStyle);
      }
    });
    
    return styles;
  }
  
  // React Native StyleSheet → Tailwind 変換
  static styleSheetToTailwind(styles: StyleSheetStyles): string[] {
    const classes: string[] = [];
    
    Object.entries(styles).forEach(([prop, value]) => {
      const tailwindClass = TailwindUtils.findEquivalentClass(prop, value);
      if (tailwindClass) {
        classes.push(tailwindClass);
      }
    });
    
    return classes;
  }
}
```

**なぜStyleConverterが必要か？**:
- マルチプラットフォーム対応
- スタイルの互換性保証
- 移行作業の支援
- 統一されたデザインシステム

### 6. AST関連ユーティリティ

#### ASTUtils
**場所**: `src/utils/ast/ASTUtils.ts`  
**機能**:
- AST ノードの型判定
- ノード検索・抽出
- 安全なAST操作

```typescript
export class ASTUtils {
  // React コンポーネント判定
  static isReactComponent(node: ts.Node): boolean {
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
      // JSX を返すかチェック
      return this.returnsJSX(node);
    }
    return false;
  }
  
  // JSX 要素検索
  static findJSXElements(node: ts.Node): ts.JsxElement[] {
    const elements: ts.JsxElement[] = [];
    
    ts.forEachChild(node, (child) => {
      if (ts.isJsxElement(child)) {
        elements.push(child);
      }
      elements.push(...this.findJSXElements(child));
    });
    
    return elements;
  }
  
  // Props インターフェース抽出
  static extractPropsInterface(node: ts.Node): ts.InterfaceDeclaration | undefined {
    if (ts.isInterfaceDeclaration(node) && 
        node.name.text.endsWith('Props')) {
      return node;
    }
    return undefined;
  }
}
```

#### ComponentUtils
**場所**: `src/utils/ast/ComponentUtils.ts`  
**機能**:
- コンポーネント特有の操作
- 依存関係の解析
- コンポーネント分類支援

```typescript
export class ComponentUtils {
  // Atomic Design カテゴリ推定
  static inferAtomicCategory(filePath: string, componentInfo: ComponentInfo): AtomicDesignCategory {
    // ファイルパスから推定
    const pathCategory = this.getCategoryFromPath(filePath);
    if (pathCategory) return pathCategory;
    
    // コンポーネント複雑度から推定
    const complexity = this.calculateComplexity(componentInfo);
    return this.categoryByComplexity(complexity);
  }
  
  // コンポーネント依存関係抽出
  static extractDependencies(sourceFile: ts.SourceFile): string[] {
    const dependencies: string[] = [];
    
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
        if (this.isComponentImport(moduleName)) {
          dependencies.push(moduleName);
        }
      }
    });
    
    return dependencies;
  }
}
```

#### StringUtils
**場所**: `src/utils/ast/StringUtils.ts`  
**機能**:
- 文字列操作の共通処理
- 名前変換・正規化
- テキスト処理

```typescript
export class StringUtils {
  // PascalCase → kebab-case 変換
  static toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  // camelCase → snake_case 変換
  static toSnakeCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  }
  
  // 日本語文字列の安全な処理
  static sanitizeForMarkdown(text: string): string {
    return text
      .replace(/\|/g, '\\|')  // Markdown テーブル対応
      .replace(/\n/g, ' ')    // 改行を空白に
      .trim();
  }
  
  // 複数行テキストのインデント調整
  static adjustIndentation(text: string, level: number): string {
    const indent = '  '.repeat(level);
    return text.split('\n').map(line => indent + line).join('\n');
  }
}
```

#### TailwindUtils
**場所**: `src/utils/ast/TailwindUtils.ts`  
**機能**:
- Tailwind CSS固有の処理
- クラス名の検証・変換
- レスポンシブ・バリアント処理

```typescript
export class TailwindUtils {
  // Tailwind クラス判定
  static isTailwindClass(className: string): boolean {
    // 基本パターンチェック
    const patterns = [
      /^(p|m|w|h|bg|text|border|flex|grid)-/,
      /^(hover|focus|active|disabled|dark|sm|md|lg|xl|2xl):/,
      // ... 他のパターン
    ];
    
    return patterns.some(pattern => pattern.test(className));
  }
  
  // レスポンシブクラス分離
  static separateResponsiveClasses(classes: string[]): {
    base: string[];
    responsive: { [breakpoint: string]: string[] };
  } {
    const base: string[] = [];
    const responsive: { [breakpoint: string]: string[] } = {};
    
    classes.forEach(cls => {
      const match = cls.match(/^(sm|md|lg|xl|2xl):(.+)$/);
      if (match) {
        const [, breakpoint, baseClass] = match;
        if (!responsive[breakpoint]) responsive[breakpoint] = [];
        responsive[breakpoint].push(baseClass);
      } else {
        base.push(cls);
      }
    });
    
    return { base, responsive };
  }
  
  // React Native への変換
  static convertToReactNative(tailwindClass: string): StyleSheetStyles | null {
    const conversions: { [key: string]: StyleSheetStyles } = {
      'bg-red-500': { backgroundColor: '#EF4444' },
      'text-white': { color: '#FFFFFF' },
      'p-4': { padding: 16 },
      'flex': { display: 'flex' },
      // ... 変換表
    };
    
    return conversions[tailwindClass] || null;
  }
}
```

## 依存関係の選定理由と代替案

### 1. TypeScript Compiler API vs Babel

**選択**: TypeScript Compiler API  
**理由**:
- TypeScript固有の型情報が必要
- React + TypeScript プロジェクトが主な対象
- 公式サポートによる安定性

**代替案**: Babel AST
- より汎用的だが型情報が少ない
- プラグインシステムが複雑
- JavaScript特化でTypeScript対応が限定的

### 2. jsondiffpatch vs lodash.isEqual

**選択**: jsondiffpatch  
**理由**:
- 詳細な差分情報が必要
- 配列要素の移動検出
- 大きなオブジェクトの効率的処理

**代替案**: lodash.isEqual
- 等価性判定のみ
- 差分詳細が不明
- カスタマイゼーション制限

### 3. chalk vs colors

**選択**: chalk  
**理由**:
- TypeScript サポートが優秀
- API の直感性
- アクティブなメンテナンス

**代替案**: colors
- 機能は類似
- TypeScript サポートが限定的
- 最近の更新が少ない

## パフォーマンス最適化のためのモジュール選択

### 1. 並列処理

```typescript
// Worker Threads の活用
import { Worker, isMainThread, parentPort } from 'worker_threads';

if (isMainThread) {
  // メインスレッド: 複数ファイルを並列処理
  const workers = files.map(file => 
    new Worker(__filename, { workerData: { file } })
  );
} else {
  // ワーカースレッド: 個別ファイル処理
  const { file } = workerData;
  const result = processFile(file);
  parentPort?.postMessage(result);
}
```

### 2. メモリ効率

```typescript
// ストリーミング処理
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function processLargeFile(filePath: string) {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({ input: fileStream });
  
  for await (const line of rl) {
    // 行ごとの処理でメモリ使用量を抑制
    processLine(line);
  }
}
```

### 3. キャッシュ戦略

```typescript
// LRU キャッシュの実装
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value) {
      // アクセス順序を更新
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 最も古いエントリを削除
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## セキュリティ考慮事項

### 1. ファイルアクセス制御

```typescript
import * as path from 'path';

class SecureFileAccess {
  private allowedPaths: string[];
  
  constructor(allowedPaths: string[]) {
    this.allowedPaths = allowedPaths.map(p => path.resolve(p));
  }
  
  validatePath(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);
    
    // パストラバーサル攻撃防止
    return this.allowedPaths.some(allowed => 
      resolvedPath.startsWith(allowed)
    );
  }
  
  async readFileSafely(filePath: string): Promise<string> {
    if (!this.validatePath(filePath)) {
      throw new Error('Access denied: Path not allowed');
    }
    
    return fs.promises.readFile(filePath, 'utf-8');
  }
}
```

### 2. 動的コード実行の制御

```typescript
// require の安全な使用
class SafeRequire {
  private allowedModules: Set<string>;
  
  constructor(allowedModules: string[]) {
    this.allowedModules = new Set(allowedModules);
  }
  
  safeRequire(modulePath: string): any {
    const resolvedPath = require.resolve(modulePath);
    
    // 許可されたモジュールのみ
    if (!this.isAllowedModule(resolvedPath)) {
      throw new Error(`Module not allowed: ${modulePath}`);
    }
    
    return require(resolvedPath);
  }
  
  private isAllowedModule(resolvedPath: string): boolean {
    return this.allowedModules.has(resolvedPath) ||
           resolvedPath.includes('node_modules');
  }
}
```

## 今後の拡張とモジュール追加計画

### 1. 追加予定のモジュール

#### Webpack Integration
```typescript
// Webpack プラグインとしての統合
class DesignSystemWebpackPlugin {
  apply(compiler: Webpack.Compiler) {
    compiler.hooks.emit.tapAsync('DesignSystemPlugin', (compilation, callback) => {
      // ビルド時にドキュメント生成
      this.generateDocs(compilation.assets);
      callback();
    });
  }
}
```

#### VS Code Extension
```typescript
// VS Code 拡張での活用
export function activate(context: vscode.ExtensionContext) {
  const provider = new DesignSystemDocProvider();
  
  vscode.window.registerTreeDataProvider('designSystem', provider);
  
  vscode.commands.registerCommand('designSystem.generateDocs', () => {
    // エディタからドキュメント生成
  });
}
```

### 2. AI機能強化モジュール

#### OpenAI Integration
```typescript
import { OpenAI } from 'openai';

class AIEnhancedDocumentGenerator {
  private openai: OpenAI;
  
  async generateImprovedDescription(component: ExtractedComponent): Promise<string> {
    const prompt = `
      コンポーネント: ${component.componentName}
      Props: ${JSON.stringify(component.props)}
      Tailwind Classes: ${component.tailwindClasses.join(', ')}
      
      このコンポーネントの用途と特徴を説明してください。
    `;
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.choices[0].message.content || '';
  }
}
```

この包括的なモジュール概要により、システム全体の技術スタック、各モジュールの選択理由、使用方法、拡張可能性を深く理解できます。