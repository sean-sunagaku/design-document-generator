# デザインシステムドキュメント生成ツール

React/React NativeプロジェクトからTailwind CSSクラスやStyleSheet.create()スタイルを自動抽出し、AI最適化されたデザインシステムドキュメントを生成する包括的なCLIツールです。

## 🌟 主な特徴

- 🎨 **マルチプラットフォーム対応** - Web（TailwindCSS）とReact Native（StyleSheet）を統一的にサポート
- 🤖 **AI最適化ドキュメント** - 大規模言語モデル（LLM）が理解しやすい構造化データ生成
- 📦 **自動コンポーネント分類** - Atomic Design原則に基づいた高精度な自動カテゴライズ
- 🔍 **包括的デザイントークン抽出** - TailwindCSS設定とStyleSheetから統一トークン生成
- 📊 **詳細な変更追跡** - スナップショット比較による精密な差分検出
- 🏗️ **拡張可能アーキテクチャ** - カスタムスタイルシステムとプラットフォームの追加対応
- 💡 **開発者体験の最適化** - リアルタイム監視、検証、自動化機能

## 🚀 インストール

### グローバルインストール
```bash
npm install -g design-system-doc-generator
```

### プロジェクトローカルインストール
```bash
npm install --save-dev design-system-doc-generator
# または
yarn add -D design-system-doc-generator
# または
pnpm add -D design-system-doc-generator
```

## 📖 基本的な使い方

### 1. Webプロジェクト（TailwindCSS）のドキュメント生成

```bash
# 基本的なコマンド
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/design-system \
  --platform web \
  --style-system tailwind

# 詳細オプション付き
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/design-system \
  --platform web \
  --style-system tailwind \
  --include-examples \
  --config ./tailwind.config.js
```

### 2. React Nativeプロジェクトのドキュメント生成

```bash
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/react-native \
  --platform react-native \
  --style-system stylesheet \
  --include-examples
```

### 3. スナップショット作成と変更追跡

```bash
# 現在の状態でスナップショット作成
npx design-system-doc-generator snapshot \
  --source ./src/components \
  --output ./snapshots/current.json

# 前回のスナップショットとの差分表示
npx design-system-doc-generator diff \
  --old ./snapshots/previous.json \
  --new ./snapshots/current.json
```

### 4. リアルタイム監視

```bash
# ファイル変更を監視してドキュメントを自動更新
npx design-system-doc-generator watch \
  --source ./src/components \
  --output ./docs/design-system \
  --include-examples
```

## ⚙️ 設定ファイル

プロジェクトルートに`design-system.config.js`を作成して詳細な設定が可能です：

### Web（TailwindCSS）プロジェクト用設定

```javascript
// design-system.config.js
module.exports = {
  platform: 'web',
  styleSystem: 'tailwind',
  source: './src/components',
  output: './docs/design-system',
  includeExamples: true,
  tailwindConfig: './tailwind.config.js',
  
  // Atomic Design分類設定
  atomicDesign: {
    atoms: ['./src/components/atoms/**'],
    molecules: ['./src/components/molecules/**'],
    organisms: ['./src/components/organisms/**'],
    templates: ['./src/components/templates/**'],
    pages: ['./src/components/pages/**']
  },
  
  // 除外パターン
  ignore: [
    '**/node_modules/**',
    '**/*.test.{ts,tsx}',
    '**/*.stories.{ts,tsx}',
    '**/*.spec.{ts,tsx}'
  ],
  
  // 検証ルール
  validation: {
    requireProps: true,
    requireExamples: true,
    maxComplexity: 10
  }
};
```

### React Native専用設定

```javascript
// design-system.config.js
module.exports = {
  platform: 'react-native',
  styleSystem: 'stylesheet',
  source: './src/components',
  output: './docs/react-native',
  includeExamples: true,
  
  // React Native固有設定
  reactNative: {
    detectPlatformSpecific: true, // Platform.OS分岐の検出
    includeAndroidStyles: true,   // Android固有スタイル
    includeIOSStyles: true,       // iOS固有スタイル
  },
  
  ignore: [
    '**/__tests__/**',
    '**/*.test.{js,ts,tsx}',
    '**/android/**',
    '**/ios/**'
  ]
};
```

### マルチプラットフォーム設定

```javascript
// design-system.config.js
module.exports = {
  multiPlatform: {
    web: {
      platform: 'web',
      styleSystem: 'tailwind',
      source: './src/components',
      output: './docs/web',
      tailwindConfig: './tailwind.config.js'
    },
    'react-native': {
      platform: 'react-native',
      styleSystem: 'stylesheet',
      source: './src/components',
      output: './docs/react-native'
    }
  }
};
```

## 📋 全コマンドリファレンス

### `generate` - ドキュメント生成

```bash
npx design-system-doc-generator generate [options]
```

**オプション:**
- `--source, -s <path>`: ソースディレクトリ (デフォルト: `./src`)
- `--output, -o <path>`: 出力ディレクトリ (デフォルト: `./docs/design-system`)
- `--platform <type>`: プラットフォーム (`web` | `react-native`)
- `--style-system <type>`: スタイルシステム (`tailwind` | `stylesheet` | `styled-components` | `css-modules`)
- `--include-examples`: コード例を含める
- `--config <path>`: 設定ファイルパス
- `--verbose`: 詳細ログ出力

### `snapshot` - スナップショット作成

```bash
npx design-system-doc-generator snapshot [options]
```

**オプション:**
- `--source, -s <path>`: ソースディレクトリ
- `--output, -o <path>`: 出力ファイルパス
- `--platform <type>`: プラットフォーム
- `--style-system <type>`: スタイルシステム

### `diff` - 差分表示

```bash
npx design-system-doc-generator diff [options]
```

**オプション:**
- `--old <path>`: 比較元スナップショット
- `--new <path>`: 比較先スナップショット

### `watch` - ファイル監視

```bash
npx design-system-doc-generator watch [options]
```

**オプション:**
- `--source, -s <path>`: 監視対象ディレクトリ
- `--output, -o <path>`: 出力ディレクトリ
- `--include-examples`: コード例を含める

### `convert` - スタイル変換

```bash
npx design-system-doc-generator convert [options]
```

**オプション:**
- `--source <path>`: 変換対象ファイル
- `--from <style>`: 変換元スタイル
- `--to <style>`: 変換先スタイル
- `--output <path>`: 出力ファイル

### `validate` - 設定検証

```bash
npx design-system-doc-generator validate [options]
```

**オプション:**
- `--config <path>`: 設定ファイルパス
- `--tailwind-config <path>`: TailwindCSS設定ファイル

## 📊 出力形式

### JSON形式（AI/プログラム向け）

```json
{
  "version": "1.0.0",
  "generated": "2024-01-15T10:00:00.000Z",
  "project": {
    "name": "my-design-system",
    "version": "2.1.0",
    "framework": "react",
    "styling": "tailwindcss"
  },
  "tokens": {
    "colors": {
      "primary-500": {
        "value": "#3B82F6",
        "rgb": "rgb(59, 130, 246)",
        "usage": ["Button", "Link", "Header"]
      },
      "text-gray-900": {
        "value": "#111827",
        "rgb": "rgb(17, 24, 39)",
        "usage": ["Text", "Heading"]
      }
    },
    "spacing": {
      "4": "1rem",
      "8": "2rem",
      "16": "4rem"
    },
    "typography": {
      "fontSize": {
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem"
      },
      "fontFamily": {
        "sans": "ui-sans-serif, system-ui, sans-serif",
        "mono": "ui-monospace, SFMono-Regular, monospace"
      }
    }
  },
  "components": [
    {
      "id": "atoms-button",
      "name": "Button",
      "category": "atoms",
      "description": "基本的なUI要素「Button」。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。",
      "usage": "<Button variant=\"primary\" size=\"md\">Click me</Button>",
      "props": [
        {
          "name": "children",
          "type": "React.ReactNode",
          "required": true,
          "description": "コンポーネントの子要素"
        },
        {
          "name": "variant",
          "type": "'primary' | 'secondary' | 'danger'",
          "required": false,
          "defaultValue": "primary",
          "description": "コンポーネントのバリアント"
        },
        {
          "name": "size",
          "type": "'sm' | 'md' | 'lg'",
          "required": false,
          "defaultValue": "md",
          "description": "コンポーネントのサイズ"
        }
      ],
      "styles": {
        "type": "tailwind",
        "tailwindClasses": [
          "bg-blue-600", "text-white", "px-4", "py-2", 
          "rounded-lg", "hover:bg-blue-700", "focus:ring-2", "focus:ring-blue-500"
        ],
        "responsive": false,
        "darkMode": false,
        "animations": ["transition-colors"]
      },
      "examples": [
        {
          "title": "基本的な使用方法",
          "description": "最もシンプルな使用例",
          "code": "import { Button } from './Button';\n\nfunction Example() {\n  return <Button>Click me</Button>;\n}"
        }
      ],
      "relatedComponents": ["Link", "IconButton"],
      "jsxStructure": {
        "type": "JSXElement",
        "tagName": "button",
        "children": ["text"]
      }
    }
  ],
  "patterns": [
    {
      "name": "Card Pattern",
      "description": "カード形式のレイアウトパターン",
      "components": ["Card", "CardHeader", "CardBody", "CardFooter"],
      "examples": [
        "<Card>\n  <CardHeader>Title</CardHeader>\n  <CardBody>Content</CardBody>\n  <CardFooter>Actions</CardFooter>\n</Card>"
      ]
    }
  ],
  "guidelines": [
    "プライマリカラーは重要なアクションにのみ使用してください",
    "ボタンのサイズは用途に応じて適切に選択してください",
    "レスポンシブデザインを考慮してブレークポイントを使用してください"
  ]
}
```

### Markdown形式（人間向け）

生成されるMarkdownドキュメントには以下の構造が含まれます：

```markdown
# デザインシステムドキュメント

生成日時: 2024-01-15 19:00:00

## プロジェクト情報

- **名前**: my-design-system
- **バージョン**: 2.1.0
- **フレームワーク**: React + TypeScript
- **スタイリング**: Tailwind CSS

## 目次

1. [デザイントークン](#デザイントークン)
2. [コンポーネント一覧](#コンポーネント一覧)
3. [デザインパターン](#デザインパターン)
4. [ガイドライン](#ガイドライン)

## デザイントークン

### カラーパレット

| 名前 | 値 | RGB | 使用場所 |
|------|-----|-----|----------|
| primary-500 | #3B82F6 | rgb(59, 130, 246) | Button, Link, Header |
| text-gray-900 | #111827 | rgb(17, 24, 39) | Text, Heading |

### スペーシング

| トークン | 値 |
|----------|-----|
| 4 | 1rem |
| 8 | 2rem |
| 16 | 4rem |

## コンポーネント一覧

### Atoms

#### Button

基本的なUI要素「Button」。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<Button variant="primary" size="md">Click me</Button>`

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ✓ | - | コンポーネントの子要素 |
| variant | 'primary' \| 'secondary' \| 'danger' | - | 'primary' | コンポーネントのバリアント |
| size | 'sm' \| 'md' \| 'lg' | - | 'md' | コンポーネントのサイズ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- アニメーション: transition-colors
- 使用クラス: `bg-blue-600`, `text-white`, `px-4`, `py-2`, `rounded-lg` +3個

**使用例**:

**基本的な使用方法**
```tsx
import { Button } from './Button';

function Example() {
  return <Button>Click me</Button>;
}
```
```

## 🔧 対応技術

### フレームワーク・ライブラリ

- **React** 16.8+ (Hooks対応)
- **React Native** 0.60+
- **TypeScript** 4.0+
- **Next.js** 12+
- **Vite** 4.0+
- **Expo** 47+

### スタイルシステム

- **Tailwind CSS** 3.0+
- **React Native StyleSheet**
- **Styled Components** 5.0+
- **CSS Modules**
- **Emotion** (将来対応予定)

### ビルドツール・開発環境

- **Webpack** 5.0+
- **Vite** 4.0+
- **Metro** (React Native)
- **ESBuild**
- **SWC**

## 📈 CI/CD統合

### GitHub Actions

```yaml
# .github/workflows/design-system.yml
name: Design System Documentation

on:
  push:
    branches: [main]
    paths: ['src/components/**']
  pull_request:
    branches: [main]
    paths: ['src/components/**']

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate design system docs
        run: |
          npx design-system-doc-generator generate \
            --source ./src/components \
            --output ./docs/design-system \
            --platform web \
            --style-system tailwind \
            --include-examples
            
      - name: Create snapshot
        run: |
          npx design-system-doc-generator snapshot \
            --source ./src/components \
            --output ./snapshots/current.json
            
      - name: Compare with previous snapshot
        run: |
          if [ -f ./snapshots/previous.json ]; then
            npx design-system-doc-generator diff \
              --old ./snapshots/previous.json \
              --new ./snapshots/current.json
          fi
          
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### package.json scripts

```json
{
  "scripts": {
    "docs:generate": "design-system-doc-generator generate",
    "docs:watch": "design-system-doc-generator watch",
    "docs:snapshot": "design-system-doc-generator snapshot",
    "docs:diff": "design-system-doc-generator diff",
    "docs:validate": "design-system-doc-generator validate"
  }
}
```

## 🛠️ 高度な使用例

### 1. カスタムスタイルシステムの追加

```javascript
// カスタムエクストラクターの実装
class MyCustomExtractor extends StyleExtractor {
  extractStyles(node) {
    // カスタム抽出ロジック
    return extractedStyles;
  }
  
  validateStyles(styles) {
    // カスタム検証ロジック
    return validationResult;
  }
}

// 設定に登録
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

### 2. プラグインシステムの活用

```javascript
// design-system.config.js
module.exports = {
  plugins: [
    {
      name: 'custom-analyzer',
      hooks: {
        beforeExtraction: (context) => {
          // 抽出前の前処理
        },
        afterGeneration: (document) => {
          // ドキュメント生成後の後処理
        }
      }
    }
  ]
};
```

### 3. マルチテナント対応

```javascript
// 複数のデザインシステムを並行管理
module.exports = {
  tenants: {
    'brand-a': {
      source: './src/components/brand-a',
      output: './docs/brand-a',
      tailwindConfig: './tailwind.brand-a.config.js'
    },
    'brand-b': {
      source: './src/components/brand-b',
      output: './docs/brand-b',
      tailwindConfig: './tailwind.brand-b.config.js'
    }
  }
};
```

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. TypeScriptパースエラー

```bash
# TypeScript設定の確認
npx tsc --noEmit

# 特定のファイルのみテスト
npx design-system-doc-generator generate \
  --source ./src/components/Button.tsx \
  --verbose
```

#### 2. TailwindCSSクラスが検出されない

```bash
# 設定ファイルの検証
npx design-system-doc-generator validate \
  --tailwind-config ./tailwind.config.js

# デバッグモードで詳細確認
npx design-system-doc-generator generate \
  --source ./src/components \
  --verbose \
  --debug
```

#### 3. React NativeでStyleSheetが抽出されない

```bash
# React Native固有の設定確認
npx design-system-doc-generator generate \
  --source ./src/components \
  --platform react-native \
  --style-system stylesheet \
  --verbose
```

#### 4. メモリ不足エラー（大規模プロジェクト）

```bash
# Node.jsヒープサイズを増加
NODE_OPTIONS="--max-old-space-size=8192" \
npx design-system-doc-generator generate

# バッチサイズの調整
npx design-system-doc-generator generate \
  --batch-size 10 \
  --max-memory 4096
```

#### 5. パフォーマンス最適化

```bash
# 並列処理の調整
npx design-system-doc-generator generate \
  --parallel 4

# キャッシュの活用
npx design-system-doc-generator generate \
  --cache ./cache \
  --incremental
```

### デバッグオプション

```bash
# 詳細ログの有効化
DEBUG=design-system-doc:* npx design-system-doc-generator generate

# 特定のモジュールのログのみ
DEBUG=design-system-doc:extractor npx design-system-doc-generator generate

# ログレベルの調整
LOG_LEVEL=debug npx design-system-doc-generator generate
```

## 🧪 開発者向け情報

### ローカル開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/your-org/design-system-doc-generator.git
cd design-system-doc-generator

# 依存関係のインストール
npm install

# TypeScriptビルド
npm run build

# テストの実行
npm test

# ウォッチモードでの開発
npm run dev

# ローカルリンクの作成
npm link
```

### テスト

```bash
# 全テストの実行
npm test

# 特定のテストファイル
npm test -- --testPathPattern=ConfigManager

# カバレッジ付きテスト
npm run test:coverage

# 統合テスト
npm run test:integration

# React Nativeサンプルでのテスト
npm run test:rn-sample
```

### アーキテクチャドキュメント

詳細なアーキテクチャについては以下のドキュメントをご参照ください：

- [アーキテクチャ概要](./docs/architecture.md)
- [クラス関係図](./docs/class-relationships.md)
- [モジュール機能](./docs/modules-overview.md)
- [使用例詳細](./docs/usage-examples.md)

## 🤝 コントリビューション

### 貢献の流れ

1. **Issue作成**: バグレポートや機能提案のIssueを作成
2. **フォーク**: プロジェクトをフォーク
3. **ブランチ作成**: 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
4. **開発**: 変更を実装し、テストを追加
5. **コミット**: 変更をコミット (`git commit -m 'Add amazing feature'`)
6. **プッシュ**: ブランチをプッシュ (`git push origin feature/amazing-feature`)
7. **Pull Request**: Pull Requestを作成

### 開発ガイドライン

- TypeScriptを使用し、型安全性を保つ
- ESLint/Prettierの設定に従う
- テストカバレッジ80%以上を維持
- コミットメッセージは[Conventional Commits](https://conventionalcommits.org/)に準拠
- 新機能にはドキュメントとテストを含める

### バグレポート

バグを発見した場合は、以下の情報を含めてIssueを作成してください：

- 使用しているNode.jsバージョン
- プラットフォーム（Web/React Native）
- 再現手順
- 期待される動作
- 実際の動作
- エラーメッセージ（ある場合）

## 📞 サポート

### コミュニティ

- **GitHub Issues**: [Issues](https://github.com/your-org/design-system-doc-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/design-system-doc-generator/discussions)
- **Discord**: [Discordサーバー](https://discord.gg/your-server)

### エンタープライズサポート

エンタープライズ向けのサポートやカスタマイゼーションについては、お問い合わせください：

- **Email**: enterprise@yourproject.com
- **専用サポート**: プレミアムサポートプランをご利用いただけます

## 📄 ライセンス

このプロジェクトは[MIT License](./LICENSE)の下で公開されています。

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトに依存しています：

- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript
- [TailwindCSS](https://tailwindcss.com/) - ユーティリティファーストのCSSフレームワーク
- [React](https://react.dev/) - ユーザーインターフェース構築ライブラリ
- [jsondiffpatch](https://github.com/benjamine/jsondiffpatch) - JSON差分検出ライブラリ
- [chalk](https://github.com/chalk/chalk) - ターミナル文字装飾ライブラリ

## 🗺️ ロードマップ

### 近期予定（v1.1）

- [ ] Vue.js サポート
- [ ] Angular サポート
- [ ] Figma連携機能
- [ ] ビジュアル差分表示

### 中期予定（v1.5）

- [ ] Web Components サポート
- [ ] Storybook統合
- [ ] デザイントークンの自動生成
- [ ] AI駆動のコンポーネント改善提案

### 長期予定（v2.0）

- [ ] リアルタイムコラボレーション機能
- [ ] クラウドベースのドキュメント管理
- [ ] 多言語対応の拡張
- [ ] エンタープライズ向け管理ダッシュボード

---

**Made with ❤️ by the Design System Community**