# 使用例ドキュメント

## 概要

このドキュメントは、デザインシステムドキュメント生成ツールの実践的な使用例を包括的に説明します。初心者から上級者まで、様々なレベルのユーザーが効果的にツールを活用できるよう、豊富な実例とベストプラクティスを提供します。

## 基本的な使用例

### 1. 最初のドキュメント生成

#### Webプロジェクト（TailwindCSS）
```bash
# 基本的なドキュメント生成
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/design-system \
  --platform web \
  --style-system tailwind

# 詳細なオプション付き
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/design-system \
  --platform web \
  --style-system tailwind \
  --include-examples \
  --config ./tailwind.config.js
```

**生成されるファイル**:
```
docs/design-system/
├── design-system.json     # 構造化データ（AI/プログラム用）
├── design-system.md       # 人間が読みやすいMarkdown
└── index.md              # 概要・目次
```

#### React Nativeプロジェクト
```bash
# React Native StyleSheetからの抽出
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/react-native \
  --platform react-native \
  --style-system stylesheet \
  --include-examples
```

### 2. 設定ファイルを使用した生成

#### design-system.config.js の作成
```javascript
// design-system.config.js
module.exports = {
  platform: 'web',
  styleSystem: 'tailwind',
  source: './src/components',
  output: './docs/design-system',
  includeExamples: true,
  tailwindConfig: './tailwind.config.js',
  ignore: [
    '**/node_modules/**',
    '**/*.test.tsx',
    '**/*.stories.tsx'
  ],
  atomicDesign: {
    atoms: ['./src/components/atoms/**'],
    molecules: ['./src/components/molecules/**'],
    organisms: ['./src/components/organisms/**'],
    templates: ['./src/components/templates/**'],
    pages: ['./src/components/pages/**']
  }
};
```

```bash
# 設定ファイルを使用した生成
npx design-system-doc-generator generate --config ./design-system.config.js
```

## 実際のプロジェクト例

### 1. Eコマースサイトのデザインシステム

#### プロジェクト構造
```
src/
├── components/
│   ├── atoms/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Avatar.tsx
│   ├── molecules/
│   │   ├── SearchBox.tsx
│   │   ├── ProductCard.tsx
│   │   ├── FormField.tsx
│   │   └── Navigation.tsx
│   ├── organisms/
│   │   ├── Header.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ShoppingCart.tsx
│   │   └── Footer.tsx
│   └── pages/
│       ├── HomePage.tsx
│       ├── ProductPage.tsx
│       └── CheckoutPage.tsx
└── styles/
    └── tailwind.config.js
```

#### 具体的なコンポーネント例

**atoms/Button.tsx**
```tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### 生成されるドキュメント例

**design-system.md（抜粋）**
```markdown
# デザインシステムドキュメント

## Atoms

### Button

基本的なUI要素「Button」。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<Button variant="primary" size="md">Click me</Button>`

**Props**:
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | ReactNode | ✓ | - | コンポーネントの子要素 |
| variant | 'primary' \| 'secondary' \| 'danger' | - | 'primary' | コンポーネントのバリアント |
| size | 'sm' \| 'md' \| 'lg' | - | 'md' | コンポーネントのサイズ |
| disabled | boolean | - | false | コンポーネントの無効化状態 |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- 使用クラス: `font-semibold`, `rounded-lg`, `transition-colors`, `bg-blue-600`, `text-white` +8個

**使用例**:

**基本的な使用方法**
```tsx
import { Button } from './Button';

function Example() {
  return <Button variant="primary" size="md">Click me</Button>;
}
```
```

### 2. React Nativeアプリのデザインシステム

#### プロジェクト構造とStyleSheet例

**atoms/Button.tsx（React Native版）**
```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  onPress,
  disabled = false
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, styles[`text${variant}`]]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: '#3B82F6',
  },
  secondary: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  textprimary: {
    color: '#FFFFFF',
  },
  textsecondary: {
    color: '#374151',
  },
});
```

#### React Native用の生成コマンド
```bash
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/react-native \
  --platform react-native \
  --style-system stylesheet \
  --include-examples
```

## 高度な使用例

### 1. マルチプラットフォーム対応

#### 共通コンポーネントの管理
```bash
# Web版とReact Native版を同時生成
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/web \
  --platform web \
  --style-system tailwind

npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/react-native \
  --platform react-native \
  --style-system stylesheet
```

#### クロスプラットフォーム設定
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

### 2. CI/CDパイプラインでの活用

#### GitHub Actions設定例
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

### 3. 変更検出とバージョン管理

#### スナップショット作成
```bash
# 現在の状態でスナップショット作成
npx design-system-doc-generator snapshot \
  --source ./src/components \
  --output ./snapshots/v1.0.0.json \
  --platform web \
  --style-system tailwind
```

#### 変更の検出
```bash
# 前回のスナップショットとの比較
npx design-system-doc-generator diff \
  --old ./snapshots/v1.0.0.json \
  --new ./snapshots/v1.1.0.json
```

**出力例**:
```
📊 デザインシステム変更レポート

+ 追加されたコンポーネント:
  + src/components/atoms/IconButton.tsx
    カテゴリ: atoms
    クラス数: 15

~ 変更されたコンポーネント:
  ~ src/components/atoms/Button.tsx
    追加クラス: focus:ring-offset-2, shadow-sm
    削除クラス: focus:outline-none

📈 サマリー:
  総変更数: 2
  追加コンポーネント: 1
  削除コンポーネント: 0
  変更コンポーネント: 1
  新規クラス: focus:ring-offset-2, shadow-sm
```

### 4. カスタム設定とスタイルシステム

#### Styled Components対応
```bash
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/styled \
  --platform web \
  --style-system styled-components \
  --include-examples
```

#### CSS Modules対応
```bash
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/css-modules \
  --platform web \
  --style-system css-modules \
  --include-examples
```

## ワークフロー例

### 1. 新しいコンポーネント開発フロー

```bash
# 1. 開発開始前にスナップショット作成
npx design-system-doc-generator snapshot \
  --source ./src/components \
  --output ./snapshots/before-feature.json

# 2. コンポーネント開発
# ... Button.tsx の実装 ...

# 3. 開発完了後にドキュメント生成
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/design-system \
  --include-examples

# 4. 変更の確認
npx design-system-doc-generator snapshot \
  --source ./src/components \
  --output ./snapshots/after-feature.json

npx design-system-doc-generator diff \
  --old ./snapshots/before-feature.json \
  --new ./snapshots/after-feature.json

# 5. ドキュメントをレビュー
open ./docs/design-system/design-system.md
```

### 2. リファクタリング時のフロー

```bash
# 1. リファクタリング前のスナップショット
npx design-system-doc-generator snapshot \
  --source ./src/components \
  --output ./snapshots/before-refactor.json

# 2. Tailwindクラスの一括変換
npx design-system-doc-generator convert \
  --source ./src/components/atoms/Button.tsx \
  --from 'bg-blue-500' \
  --to 'bg-primary-500' \
  --output ./src/components/atoms/Button.converted.tsx

# 3. リファクタリング後の検証
npx design-system-doc-generator snapshot \
  --source ./src/components \
  --output ./snapshots/after-refactor.json

npx design-system-doc-generator diff \
  --old ./snapshots/before-refactor.json \
  --new ./snapshots/after-refactor.json

# 4. 期待される変更のみかチェック
```

### 3. デザインシステム監査フロー

```bash
# 1. 包括的なドキュメント生成
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs/audit \
  --include-examples \
  --verbose

# 2. 設定の検証
npx design-system-doc-generator validate \
  --config ./design-system.config.js \
  --tailwind-config ./tailwind.config.js

# 3. ファイル監視モードで継続的チェック
npx design-system-doc-generator watch \
  --source ./src/components \
  --output ./docs/live \
  --include-examples
```

## プロジェクトタイプ別推奨設定

### 1. スタートアップ・小規模プロジェクト

```javascript
// design-system.config.js（シンプル設定）
module.exports = {
  platform: 'web',
  styleSystem: 'tailwind',
  source: './src/components',
  output: './docs',
  includeExamples: true,
  ignore: ['**/*.test.*', '**/*.stories.*']
};
```

### 2. エンタープライズ・大規模プロジェクト

```javascript
// design-system.config.js（高度な設定）
module.exports = {
  platform: 'web',
  styleSystem: 'tailwind',
  source: './packages/ui/src',
  output: './docs/design-system',
  includeExamples: true,
  tailwindConfig: './tailwind.config.js',
  
  // 詳細な分類設定
  atomicDesign: {
    atoms: ['./packages/ui/src/atoms/**'],
    molecules: ['./packages/ui/src/molecules/**'],
    organisms: ['./packages/ui/src/organisms/**'],
    templates: ['./packages/ui/src/templates/**'],
    pages: ['./packages/ui/src/pages/**']
  },
  
  // 除外パターン
  ignore: [
    '**/node_modules/**',
    '**/*.test.{ts,tsx}',
    '**/*.stories.{ts,tsx}',
    '**/*.spec.{ts,tsx}',
    '**/lib/**',
    '**/dist/**'
  ],
  
  // カスタムバリデーション
  validation: {
    requireProps: true,
    requireExamples: true,
    maxComplexity: 10
  },
  
  // 出力オプション
  output: {
    formats: ['json', 'markdown'],
    language: 'ja',
    includeMetadata: true
  }
};
```

### 3. React Nativeプロジェクト

```javascript
// design-system.config.js（React Native専用）
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

## トラブルシューティング

### 1. よくある問題と解決方法

#### TailwindCSSクラスが検出されない
```bash
# デバッグモードで詳細ログを確認
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs \
  --verbose \
  --debug

# 設定ファイルパスの確認
npx design-system-doc-generator validate \
  --tailwind-config ./tailwind.config.js
```

#### React Nativeで StyleSheet が抽出されない
```bash
# 特定のファイルをテスト
npx design-system-doc-generator generate \
  --source ./src/components/Button.tsx \
  --output ./debug \
  --platform react-native \
  --style-system stylesheet \
  --verbose
```

#### メモリ不足エラー
```bash
# バッチサイズを調整
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs \
  --batch-size 10 \
  --max-memory 4096
```

### 2. パフォーマンス最適化

```bash
# 並列処理の調整
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs \
  --parallel 4

# キャッシュの活用
npx design-system-doc-generator generate \
  --source ./src/components \
  --output ./docs \
  --cache ./cache \
  --incremental
```

## ベストプラクティス

### 1. ディレクトリ構成
```
project/
├── src/components/           # ソースコンポーネント
├── docs/design-system/       # 生成ドキュメント
├── snapshots/               # バージョン管理用スナップショット
├── design-system.config.js  # ツール設定
└── tailwind.config.js       # Tailwind設定
```

### 2. 命名規則
- **コンポーネント**: PascalCase（`Button.tsx`）
- **ファイル**: kebab-case（`user-profile.tsx`）
- **CSS クラス**: Tailwind形式（`bg-blue-500`）

### 3. ドキュメント更新のタイミング
- 新しいコンポーネント追加時
- 既存コンポーネントの大幅変更時
- リリース前の最終チェック
- CI/CDでの自動更新

この包括的な使用例ドキュメントにより、あらゆるレベルのユーザーが効果的にツールを活用し、高品質なデザインシステムドキュメントを生成できるようになります。