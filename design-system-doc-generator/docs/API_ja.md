# API リファレンス

このドキュメントは、デザインシステムドキュメント生成ツールの詳細なAPIドキュメントを提供します。

## CLIコマンド

### `design-system-doc snapshot`

現在のデザインシステムの状態のスナップショットを生成します。

```bash
design-system-doc snapshot [options]
```

#### オプション

| オプション | エイリアス | 説明 | デフォルト |
|------------|------------|------|------------|
| `--source <dir>` | `-s` | 解析対象のソースディレクトリ | `./src` |
| `--config <path>` | `-c` | 設定ファイルのパス | - |
| `--output <path>` | `-o` | 出力ファイルのパス | `./.design-system-snapshots/snapshot.json` |
| `--format <type>` | `-f` | 出力形式 (json\|markdown) | `json` |

#### 使用例

```bash
# 基本的なスナップショット
design-system-doc snapshot

# カスタムソースと出力
design-system-doc snapshot --source ./components --output ./snapshots/current.json

# Markdown形式で生成
design-system-doc snapshot --format markdown --output ./docs/snapshot.md
```

### `design-system-doc generate`

デザインシステムからAI最適化されたドキュメントを生成します。

```bash
design-system-doc generate [options]
```

#### オプション

| オプション | エイリアス | 説明 | デフォルト |
|------------|------------|------|------------|
| `--source <dir>` | `-s` | 解析対象のソースディレクトリ | `./src` |
| `--output <path>` | `-o` | 出力ディレクトリ | `./docs/design-system` |
| `--include-examples` | - | コード例を含める | `false` |

#### 使用例

```bash
# 基本的なドキュメント生成
design-system-doc generate

# コード例を含める
design-system-doc generate --include-examples

# カスタム出力ディレクトリ
design-system-doc generate --output ./documentation
```

### `design-system-doc watch`

ファイルの変更を監視し、自動的にスナップショットを更新します。

```bash
design-system-doc watch [options]
```

#### オプション

| オプション | エイリアス | 説明 | デフォルト |
|------------|------------|------|------------|
| `--source <dir>` | `-s` | 監視対象のソースディレクトリ | `./src` |
| `--config <path>` | `-c` | 設定ファイルのパス | - |

#### 使用例

```bash
# 現在のディレクトリを監視
design-system-doc watch

# 特定のディレクトリを監視
design-system-doc watch --source ./components
```

### `design-system-doc diff`

2つのスナップショットを比較し、差分を表示します。

```bash
design-system-doc diff [options]
```

#### オプション

| オプション | 説明 | デフォルト |
|------------|------|------------|
| `--from <path>` | 比較元のスナップショットファイル | `./.design-system-snapshots/snapshot.json` |
| `--to <path>` | 比較先のスナップショットファイル | 最新のスナップショット |

#### 使用例

```bash
# 前回のスナップショットと比較
design-system-doc diff

# 特定のスナップショットを比較
design-system-doc diff --from ./old.json --to ./new.json
```

## TypeScript API

### コアクラス

#### `TailwindExtractor`

React/TypeScriptコンポーネントからTailwind CSSクラスを抽出します。

```typescript
import { TailwindExtractor } from 'design-system-doc-generator';

const extractor = new TailwindExtractor({
  sourceDir: './src',
  ignore: ['**/*.test.tsx']
});

const component = await extractor.extractFromFile('./Button.tsx');
```

##### コンストラクタオプション

```typescript
interface ExtractorConfig {
  sourceDir: string;
  tsConfigPath?: string;
  ignore?: string[];
}
```

##### メソッド

```typescript
class TailwindExtractor {
  constructor(config: ExtractorConfig);
  
  async extractFromFile(filePath: string): Promise<ExtractedComponent | null>;
}
```

#### `DesignTokenExtractor`

Tailwind設定からデザイントークンを抽出します。

```typescript
import { DesignTokenExtractor } from 'design-system-doc-generator';

const extractor = new DesignTokenExtractor();
const tokens = await extractor.extractFromTailwindConfig('./tailwind.config.js');
```

##### メソッド

```typescript
class DesignTokenExtractor {
  async extractFromTailwindConfig(configPath: string): Promise<DesignTokens>;
}
```

#### `AIDocumentGenerator`

AI最適化されたドキュメントを生成します。

```typescript
import { AIDocumentGenerator } from 'design-system-doc-generator';

const generator = new AIDocumentGenerator();
const document = await generator.generate(components, tokens, options);
```

##### メソッド

```typescript
class AIDocumentGenerator {
  async generate(
    components: ExtractedComponent[],
    tokens: DesignTokens,
    options: GeneratorOptions
  ): Promise<AIDocument>;
  
  async saveAsJSON(document: AIDocument, outputPath: string): Promise<void>;
  async saveAsMarkdown(document: AIDocument, outputPath: string): Promise<void>;
}
```

#### `DiffEngine`

スナップショットを比較し、変更を検出します。

```typescript
import { DiffEngine } from 'design-system-doc-generator';

const diffEngine = new DiffEngine();
const result = await diffEngine.compareSnapshots(oldSnapshot, newSnapshot);
diffEngine.displayDiff(result);
```

##### メソッド

```typescript
class DiffEngine {
  async compareSnapshots(
    oldSnapshot: Snapshot,
    newSnapshot: Snapshot
  ): Promise<DiffResult>;
  
  displayDiff(result: DiffResult): void;
}
```

### 型定義

#### `ExtractedComponent`

コードベースから抽出されたコンポーネントを表します。

```typescript
interface ExtractedComponent {
  filePath: string;
  componentName: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'templates' | 'pages';
  tailwindClasses: string[];
  props: PropInfo[];
  dependencies: string[];
  hash: string;
}
```

#### `PropInfo`

コンポーネントのPropsに関する情報。

```typescript
interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}
```

#### `DesignTokens`

Tailwind設定から抽出されたデザイントークン。

```typescript
interface DesignTokens {
  colors: Record<string, ColorToken>;
  spacing: Record<string, string>;
  typography: TypographyTokens;
  breakpoints: Record<string, string>;
  shadows: Record<string, string>;
  borderRadius: Record<string, string>;
  custom: Record<string, any>;
}
```

#### `ColorToken`

メタデータを含むカラートークン。

```typescript
interface ColorToken {
  value: string;
  rgb?: string;
  usage?: string[];
}
```

#### `TypographyTokens`

タイポグラフィ関連のトークン。

```typescript
interface TypographyTokens {
  fontFamily: Record<string, string>;
  fontSize: Record<string, string>;
  fontWeight: Record<string, string>;
  lineHeight: Record<string, string>;
}
```

#### `Snapshot`

デザインシステムの状態の完全なスナップショット。

```typescript
interface Snapshot {
  version: string;
  timestamp: string;
  components: ExtractedComponent[];
  tokens: DesignTokens;
  project: ProjectInfo;
}
```

#### `DiffResult`

2つのスナップショットを比較した結果。

```typescript
interface DiffResult {
  hasChanges: boolean;
  changes: {
    components: {
      added: ExtractedComponent[];
      removed: ExtractedComponent[];
      modified: ModifiedComponent[];
    };
    tokens: {
      added: Record<string, any>;
      removed: Record<string, any>;
      modified: Record<string, any>;
    };
  };
  summary: DiffSummary;
}
```

#### `AIDocument`

AI最適化されたドキュメント構造。

```typescript
interface AIDocument {
  version: string;
  generated: string;
  project: ProjectInfo;
  tokens: DesignTokens;
  components: ComponentDoc[];
  patterns: DesignPattern[];
  guidelines: string[];
}
```

#### `ComponentDoc`

詳細なコンポーネントドキュメント。

```typescript
interface ComponentDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  usage: string;
  props: PropDoc[];
  styles: StyleInfo;
  examples: CodeExample[];
  relatedComponents: string[];
}
```

### ユーティリティ関数

#### ファイルユーティリティ

```typescript
import { fileUtils } from 'design-system-doc-generator';

// ファイル存在確認
const exists = await fileUtils.fileExists('./path/to/file.tsx');

// JSONファイル読み込み
const data = await fileUtils.readJsonFile<MyType>('./data.json');

// JSONファイル書き込み
await fileUtils.writeJsonFile('./output.json', data);

// パターンに一致するファイル検索
const files = await fileUtils.findFiles('**/*.tsx');

// ディレクトリ存在確認
await fileUtils.ensureDirectoryExists('./output/directory');
```

#### ハッシュユーティリティ

```typescript
import { hashUtils } from 'design-system-doc-generator';

// コンテンツハッシュ生成
const hash = hashUtils.generateHash('file content');

// コンポーネントID生成
const id = hashUtils.generateComponentId('atoms', 'Button');
```

## 設定

### 設定ファイル形式

プロジェクトルートに`.design-system-doc.config.js`ファイルを作成します：

```javascript
module.exports = {
  // 解析対象のソースディレクトリ
  source: './src',
  
  // 生成されるドキュメントの出力ディレクトリ
  output: './docs/design-system',
  
  // コンポーネント分類ルール
  categories: {
    atoms: ['atoms', 'components/atoms'],
    molecules: ['molecules', 'components/molecules'],
    organisms: ['organisms', 'components/organisms'],
    templates: ['templates', 'components/templates'],
    pages: ['pages', 'components/pages'],
  },
  
  // 無視するファイル
  ignore: [
    '**/*.test.tsx',
    '**/*.test.ts',
    '**/*.stories.tsx',
    '**/*.stories.ts',
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
  ],
  
  // Tailwind設定ファイルのパス
  tailwindConfig: './tailwind.config.js',
  
  // TypeScript設定ファイルのパス
  tsConfig: './tsconfig.json',
  
  // カスタムTailwindクラスパターン
  tailwindPatterns: [
    /^custom-/,
    /^app-/,
  ],
  
  // 出力オプション
  output: {
    // ドキュメントにコード例を含める
    includeExamples: true,
    
    // 生成する出力形式
    formats: ['json', 'markdown'],
    
    // プライベートコンポーネントを含める（_で始まるもの）
    includePrivate: false,
  },
  
  // カスタム処理のためのフック
  hooks: {
    // 各コンポーネント処理前に呼ばれる
    beforeComponent: (component) => {
      // カスタム処理
      return component;
    },
    
    // 全コンポーネント処理後に呼ばれる
    afterExtraction: (components, tokens) => {
      // カスタム処理
      return { components, tokens };
    },
  },
};
```

### 環境変数

環境変数を使用してツールを設定することもできます：

```bash
# ソースディレクトリ
DESIGN_SYSTEM_SOURCE=./src

# 出力ディレクトリ
DESIGN_SYSTEM_OUTPUT=./docs

# 設定ファイルのパス
DESIGN_SYSTEM_CONFIG=./config.js

# Tailwind設定のパス
DESIGN_SYSTEM_TAILWIND_CONFIG=./tailwind.config.js
```

## エラーハンドリング

ライブラリは構造化されたエラーハンドリングを使用します。すべてのエラーは基底の`DesignSystemError`クラスを継承します：

```typescript
class DesignSystemError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DesignSystemError';
  }
}
```

### 一般的なエラーコード

| コード | 説明 |
|--------|------|
| `FILE_NOT_FOUND` | ソースファイルまたはディレクトリが見つからない |
| `PARSE_ERROR` | TypeScript/JSXファイルの解析に失敗 |
| `CONFIG_ERROR` | 設定が無効 |
| `TAILWIND_CONFIG_ERROR` | Tailwind設定の読み込みに失敗 |
| `WRITE_ERROR` | 出力ファイルの書き込みに失敗 |

### エラーハンドリングの例

```typescript
try {
  const extractor = new TailwindExtractor(config);
  const component = await extractor.extractFromFile('./Button.tsx');
} catch (error) {
  if (error instanceof DesignSystemError) {
    console.error(`エラー ${error.code}: ${error.message}`);
  } else {
    console.error('予期しないエラー:', error);
  }
}
```

## パフォーマンスの考慮事項

### 大規模コードベース

大規模なコードベースの場合、以下を検討してください：

1. **増分処理**: スナップショットと差分を使用して変更されたファイルのみを処理
2. **並列処理**: ツールは自動的にファイルを並列処理します
3. **メモリ管理**: 必要に応じてNode.jsのメモリ制限を増やす

```bash
NODE_OPTIONS="--max-old-space-size=8192" design-system-doc generate
```

### 最適化のヒント

1. **無視パターン**: 不要なファイルを除外する包括的な無視パターンを使用
2. **結果キャッシュ**: スナップショットは変更されていないファイルのキャッシュとして機能
3. **監視モード**: 開発時は監視モードを使用して完全な再構築を回避

## 統合例

### Next.jsとの統合

```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // ビルド時にデザインシステムドキュメントを生成
      require('./scripts/generate-design-docs');
    }
    return config;
  },
};
```

### Viteとの統合

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { generateDesignSystemDocs } from './scripts/design-system';

export default defineConfig({
  plugins: [
    {
      name: 'design-system-docs',
      buildStart() {
        generateDesignSystemDocs();
      },
    },
  ],
});
```

### Webpackとの統合

```javascript
// webpack.config.js
const { DesignSystemDocsPlugin } = require('./plugins/design-system-docs');

module.exports = {
  plugins: [
    new DesignSystemDocsPlugin({
      source: './src',
      output: './docs/design-system',
    }),
  ],
};
```

## ベストプラクティス

1. **定期的なスナップショット**: 大きな変更前にスナップショットを生成
2. **バージョン管理**: デザインシステムの進化を追跡するためにスナップショットをコミット
3. **CI統合**: CI/CDでドキュメント生成を自動化
4. **レビュープロセス**: コードレビューにデザインシステムの変更を含める
5. **ドキュメント**: 生成されたドキュメントをデプロイと同期して最新に保つ

## 高度な機能

### カスタムスタイル抽出器

独自のスタイルシステムをサポートするカスタム抽出器を作成できます：

```typescript
import { StyleExtractor } from 'design-system-doc-generator';

class MyCustomExtractor extends StyleExtractor {
  extractStyles(node: any): ExtractedStyleInfo[] {
    // カスタム抽出ロジック
    return extractedStyles;
  }
  
  validateStyles(styles: string[]): ValidationResult {
    // カスタム検証ロジック
    return validationResult;
  }
  
  generateExamples(styles: ExtractedStyleInfo[]): string {
    // カスタム例生成ロジック
    return exampleCode;
  }
}

// 設定で登録
module.exports = {
  customStyleSystems: {
    'my-system': {
      extractor: './path/to/MyCustomExtractor',
      validation: {
        // カスタム検証ルール
      }
    }
  }
};
```

### プラグインシステム

処理の様々な段階でカスタムロジックを注入できます：

```typescript
module.exports = {
  plugins: [
    {
      name: 'custom-analyzer',
      hooks: {
        beforeExtraction: (context) => {
          // 抽出前の前処理
          console.log('抽出開始:', context.sourceDir);
        },
        afterGeneration: (document) => {
          // ドキュメント生成後の後処理
          document.customMetadata = { generatedBy: 'my-plugin' };
        },
        onError: (error, context) => {
          // エラー処理
          console.error('処理エラー:', error.message);
        }
      }
    }
  ]
};
```

### マルチテナント対応

複数のデザインシステムを並行して管理できます：

```javascript
module.exports = {
  tenants: {
    'brand-a': {
      source: './src/components/brand-a',
      output: './docs/brand-a',
      tailwindConfig: './tailwind.brand-a.config.js',
      customTokens: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4'
      }
    },
    'brand-b': {
      source: './src/components/brand-b',
      output: './docs/brand-b',
      tailwindConfig: './tailwind.brand-b.config.js',
      customTokens: {
        primary: '#45B7D1',
        secondary: '#96CEB4'
      }
    }
  }
};
```

### AI機能拡張

将来的なAI機能拡張のためのインターフェース：

```typescript
interface AIEnhancedGenerator {
  generateImprovedDescription(component: ExtractedComponent): Promise<string>;
  suggestImprovements(component: ExtractedComponent): Promise<Suggestion[]>;
  detectPatterns(components: ExtractedComponent[]): Promise<DesignPattern[]>;
  generateAccessibilityGuidelines(component: ExtractedComponent): Promise<string[]>;
}

// 使用例（将来実装予定）
const aiGenerator = new AIEnhancedGenerator({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY
});

const enhancedDoc = await aiGenerator.generateImprovedDescription(component);
```

このAPIリファレンスにより、デザインシステムドキュメント生成ツールの全機能を効果的に活用し、プロジェクトのニーズに合わせてカスタマイズできます。