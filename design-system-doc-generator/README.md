# Design System Documentation Generator

React/TypeScriptプロジェクトのデザインシステムを自動的に抽出し、AI理解可能な形式でドキュメント化するCLIツールです。

## 特徴

- 🎨 **Tailwind CSSクラスの自動抽出** - React/TypeScriptコンポーネントからTailwindクラスを自動検出
- 📦 **コンポーネントの自動カテゴライズ** - Atomic Designに基づいた自動分類
- 🔍 **デザイントークンの検出と整理** - tailwind.configからのトークン抽出
- 📊 **スナップショットと差分検出** - 変更の追跡と比較
- 🤖 **AI向けに最適化されたドキュメント生成** - LLMが理解しやすい構造化データ
- 📝 **JSON/Markdown形式での出力** - 人間とAIの両方に対応
- 👀 **ファイル監視機能** - リアルタイムでの変更検出

## インストール

### グローバルインストール

```bash
npm install -g design-system-doc-generator
```

### プロジェクトローカルインストール

```bash
npm install --save-dev design-system-doc-generator
```

## 使い方

### 基本的なコマンド

#### スナップショット生成

```bash
design-system-doc snapshot --source ./src --output ./design-system-snapshot.json
```

#### AI向けドキュメント生成

```bash
design-system-doc generate --source ./src --output ./docs/design-system
```

#### ファイル監視モード

```bash
design-system-doc watch --source ./src
```

#### 差分表示

```bash
design-system-doc diff --from ./old-snapshot.json --to ./new-snapshot.json
```

### コマンドオプション

#### `snapshot`
- `--source, -s <dir>`: ソースディレクトリ (デフォルト: `./src`)
- `--output, -o <path>`: 出力ファイルパス (デフォルト: `./.design-system-snapshots/snapshot.json`)
- `--config, -c <path>`: 設定ファイルパス
- `--format, -f <type>`: 出力形式 (json|markdown, デフォルト: json)

#### `generate`
- `--source, -s <dir>`: ソースディレクトリ (デフォルト: `./src`)
- `--output, -o <path>`: 出力ディレクトリ (デフォルト: `./docs/design-system`)
- `--include-examples`: コード例を含める

#### `watch`
- `--source, -s <dir>`: ソースディレクトリ (デフォルト: `./src`)
- `--config, -c <path>`: 設定ファイルパス

#### `diff`
- `--from <path>`: 比較元のスナップショット
- `--to <path>`: 比較先のスナップショット (省略時は最新のスナップショット)

## 設定

`.design-system-doc.config.js` ファイルを作成して設定をカスタマイズできます：

```javascript
module.exports = {
  source: './src',
  output: './docs/design-system',
  categories: {
    atoms: ['atoms', 'components/atoms'],
    molecules: ['molecules', 'components/molecules'],
    organisms: ['organisms', 'components/organisms'],
    templates: ['templates', 'components/templates'],
    pages: ['pages', 'components/pages'],
  },
  ignore: [
    '**/*.test.tsx',
    '**/*.test.ts',
    '**/*.stories.tsx',
    '**/*.stories.ts',
    '**/node_modules/**',
  ],
  tailwindConfig: './tailwind.config.js',
};
```

## 出力フォーマット

### JSON形式（AI向け）

```json
{
  "version": "1.0.0",
  "generated": "2024-01-15T10:00:00.000Z",
  "project": {
    "name": "my-react-app",
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
      }
    }
  },
  "components": [
    {
      "id": "atoms-button",
      "name": "Button",
      "category": "atoms",
      "description": "基本的なボタンコンポーネント",
      "tailwindClasses": ["bg-blue-500", "hover:bg-blue-700", "text-white"],
      "props": [
        {
          "name": "onClick",
          "type": "() => void",
          "required": false,
          "description": "クリックイベントハンドラ"
        }
      ]
    }
  ]
}
```

### Markdown形式（人間向け）

自動生成されるMarkdownドキュメントには以下が含まれます：

- プロジェクト情報
- デザイントークン一覧
- コンポーネント詳細（カテゴリ別）
- デザインパターン
- ガイドライン

## 対応フレームワーク・ライブラリ

- **React** 16.8+
- **TypeScript** 4.0+
- **Tailwind CSS** 3.0+
- **Next.js** 12+
- **Vite** 4.0+

## サポートされる機能

### コンポーネント解析

- JSX/TSXファイルの解析
- Tailwindクラス名の抽出
- Props定義の検出
- 依存関係の追跡
- コンポーネントカテゴリの自動判定

### デザイントークン抽出

- カラーパレット
- スペーシング
- タイポグラフィ
- ブレークポイント
- シャドウ
- ボーダー半径

### 差分検出

- 追加/削除されたコンポーネント
- 変更されたTailwindクラス
- Props変更
- デザイントークンの変更

## CI/CD統合

### GitHub Actions

```yaml
name: Update Design System Docs

on:
  push:
    branches: [main]
    paths:
      - 'src/components/**'
      - 'tailwind.config.js'

jobs:
  update-docs:
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
        run: npm run design:generate
      
      - name: Upload docs
        uses: actions/upload-artifact@v3
        with:
          name: design-system-docs
          path: docs/design-system/
```

### package.jsonスクリプト

```json
{
  "scripts": {
    "design:snapshot": "design-system-doc snapshot",
    "design:generate": "design-system-doc generate",
    "design:watch": "design-system-doc watch",
    "design:diff": "design-system-doc diff"
  }
}
```

## トラブルシューティング

### よくある問題

1. **TypeScriptパースエラー**
   ```bash
   # tsconfig.jsonの設定を確認
   npx tsc --noEmit
   ```

2. **Tailwindクラスが検出されない**
   - tailwind.config.jsのパスを確認
   - カスタムクラス名のパターンを設定に追加

3. **メモリ不足（大規模プロジェクト）**
   ```bash
   NODE_OPTIONS="--max-old-space-size=8192" design-system-doc generate
   ```

### デバッグ

```bash
# 詳細ログを表示
DEBUG=design-system-doc:* design-system-doc generate

# 特定のファイルのみ処理
design-system-doc snapshot --source ./src/components/atoms
```

## 開発

### ローカル開発

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/design-system-doc-generator.git
cd design-system-doc-generator

# 依存関係をインストール
npm install

# ビルド
npm run build

# テスト
npm test

# ローカルでリンク
npm link
```

### コントリビューション

1. Issueを作成して問題を報告
2. Forkしてfeatureブランチを作成
3. 変更をコミット
4. Pull Requestを作成

## ライセンス

MIT License

## 作者

Your Name <your.email@example.com>

## サポート

- GitHub Issues: https://github.com/yourusername/design-system-doc-generator/issues
- Discord: https://discord.gg/yourserver
- Email: support@yourproject.com