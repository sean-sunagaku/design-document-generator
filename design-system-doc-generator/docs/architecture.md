# アーキテクチャドキュメント

## 概要

このドキュメントは、デザインシステムドキュメント生成ツールの包括的なアーキテクチャについて説明します。本ツールは、React/React NativeプロジェクトからTailwindCSSクラスやデザイントークンを自動抽出し、AI最適化されたドキュメントを生成するための高度なシステムです。

## アーキテクチャ原則

### 1. 拡張性（Extensibility）
- **プラグインアーキテクチャ**: カスタムスタイルシステムや新しいプラットフォームの追加が容易
- **設定駆動**: 動的な設定変更による柔軟な動作調整
- **モジュラー設計**: 各コンポーネントが独立し、置換・拡張が可能

### 2. マルチプラットフォーム対応
- **Web**: TailwindCSS + React
- **React Native**: StyleSheet.create() + React Native Components
- **ハイブリッド**: 両プラットフォームの統合対応

### 3. AI最適化
- **構造化データ**: LLMが理解しやすい形式でのドキュメント生成
- **メタデータ豊富**: コンテキスト情報を豊富に含む
- **関係性明示**: コンポーネント間の依存関係を明確化

### 4. 堅牢性
- **エラー耐性**: 個別のエラーがシステム全体に影響しない設計
- **段階的フォールバック**: 設定ファイル → StyleSheet → デフォルト値
- **型安全性**: TypeScriptによる厳密な型チェック

## システム全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Entry Point                      │
│                         (cli.ts)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                      Command Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ GenerateCmd │ │ SnapshotCmd │ │ DiffCommand │ │ etc... │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 Configuration Layer                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              ConfigManager (Singleton)                 │ │
│  │  • Platform/StyleSystem management                     │ │
│  │  • Custom platform registration                        │ │
│  │  • Validation rules                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                   Extraction Layer                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                TailwindExtractor                        │ │
│  │              (Main Orchestrator)                       │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                       │
│  ┌─────────────────┴──┐ ┌───────────────────────────────────┐ │
│  │ DesignTokenExtract │ │       StyleExtractorFactory      │ │
│  │ • TailwindConfig   │ │    (Multi-platform Support)      │ │
│  │ • StyleSheet       │ │  ┌─────────┐ ┌──────────────────┐ │ │
│  │ • Default tokens   │ │  │Tailwind │ │ StyleSheet       │ │ │
│  └────────────────────┘ │  │Extractor│ │ Extractor        │ │ │
│                         │  └─────────┘ └──────────────────┘ │ │
│                         │  ┌─────────┐ ┌──────────────────┐ │ │
│                         │  │Styled   │ │ CSS Modules      │ │ │
│                         │  │Comp     │ │ Extractor        │ │ │
│                         │  └─────────┘ └──────────────────┘ │ │
│                         └───────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                      AST Layer                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  ASTTraverser                           │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                       │
│  ┌─────────────────┴──┐ ┌──────────────┐ ┌─────────────────┐ │
│  │ ComponentAnalyzer  │ │PropExtractor │ │JSXStructureExtr │ │
│  │ • React detection  │ │ • TypeScript │ │ • JSX parsing   │ │
│  │ • AST generation   │ │ • Props info │ │ • Structure     │ │
│  └────────────────────┘ └──────────────┘ └─────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            TailwindClassExtractor                       │ │
│  │  • Pattern matching                                    │ │
│  │  • Class utility support (clsx, cn, twMerge)           │ │
│  │  • Custom class filtering                              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                  Generation Layer                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                AIDocumentGenerator                      │ │
│  │              (Main Orchestrator)                       │ │
│  └──────────────────┬──────────────────────────────────────┘ │
│                     │                                       │
│  ┌─────────────────┴──┐ ┌──────────────┐ ┌─────────────────┐ │
│  │ComponentDocGenerat │ │PatternDetect │ │GuidelineGenerat │ │
│  │ • Individual docs  │ │ • Reusable   │ │ • Best practices│ │
│  │ • Props validation │ │   patterns   │ │ • Recommendations│ │
│  └────────────────────┘ └──────────────┘ └─────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               MarkdownFormatter                         │ │
│  │  • Structured to Markdown conversion                   │ │
│  │  • Japanese localization                               │ │
│  │  • GitHub compatibility                                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                     Diff Layer                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   DiffEngine                            │ │
│  │  • Snapshot comparison                                 │ │
│  │  • Change detection                                    │ │
│  │  • CI/CD integration                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## レイヤー別詳細説明

### 1. CLI Entry Point
**責務**: コマンドライン引数の解析とコマンドディスパッチ

**主要コンポーネント**:
- `cli.ts` - メインエントリーポイント
- Command routing - コマンドベースの処理分岐

### 2. Command Layer
**責務**: 各種コマンドの実装と実行

**主要コンポーネント**:
- `GenerateCommand` - ドキュメント生成
- `SnapshotCommand` - スナップショット作成
- `DiffCommand` - 差分検出
- `ConvertCommand` - スタイル変換
- `ValidateCommand` - 設定検証
- `WatchCommand` - ファイル監視

**設計パターン**: Command Pattern

### 3. Configuration Layer
**責務**: アプリケーション全体の設定管理

**主要コンポーネント**:
- `ConfigManager` - 中央設定管理（Singleton）
  - プラットフォーム/スタイルシステム管理
  - カスタムプラットフォーム登録
  - 検証ルール管理
  - 設定ファイル読み込み

**設計パターン**: Singleton Pattern

### 4. Extraction Layer
**責務**: コンポーネントとデザイントークンの抽出

**主要コンポーネント**:

#### TailwindExtractor（メインオーケストレーター）
- 抽出プロセス全体の調整
- 複数エクストラクターの協調動作
- 結果の統合とフィルタリング

#### DesignTokenExtractor
- TailwindCSS設定ファイルからのトークン抽出
- React Native StyleSheetからのトークン抽出
- デフォルトトークンの提供

#### StyleExtractorFactory
- プラットフォーム固有エクストラクターの生成
- Factory Patternによる統一インターフェース
- カスタムエクストラクターサポート

**設計パターン**: 
- Orchestrator Pattern (TailwindExtractor)
- Factory Pattern (StyleExtractorFactory)
- Strategy Pattern (各エクストラクター)

### 5. AST Layer
**責務**: TypeScript/JSXのAST解析

**主要コンポーネント**:

#### ASTTraverser
- TypeScript ASTの効率的な走査
- コールバックベースの処理
- パフォーマンス最適化

#### ComponentAnalyzer
- Reactコンポーネントの検出
- AST生成とコンポーネント名抽出
- 型安全なAST操作

#### PropExtractor
- TypeScript Propsインターフェースの解析
- 型情報の抽出と構造化
- デフォルト値の検出

#### JSXStructureExtractor
- JSX要素の構造解析
- ネストした要素の階層化
- 属性情報の抽出

#### TailwindClassExtractor
- Tailwindクラスの包括的抽出
- クラスユーティリティ関数サポート
- パターンマッチングによる高速処理

**設計パターン**: 
- Visitor Pattern (AST走査)
- Template Method Pattern (共通解析処理)

### 6. Generation Layer
**責務**: AI最適化ドキュメントの生成

**主要コンポーネント**:

#### AIDocumentGenerator（メインオーケストレーター）
- ドキュメント生成プロセス全体の調整
- 各専門ジェネレーターの協調動作
- メタデータ収集と統合

#### ComponentDocumentGenerator
- 個別コンポーネントドキュメント生成
- Propsの詳細説明
- コード例の生成と検証

#### PatternDetector
- 再利用可能デザインパターンの検出
- コンポーネント間関係の分析
- パターンのカテゴリ化

#### GuidelineGenerator
- ベストプラクティスの自動生成
- 推奨事項の提案
- 警告・注意事項の生成

#### MarkdownFormatter
- 構造化データからMarkdownへの変換
- 日本語最適化
- GitHub Flavored Markdown対応

**設計パターン**: 
- Orchestrator Pattern (AIDocumentGenerator)
- Builder Pattern (段階的構築)
- Template Method Pattern (共通フォーマット処理)

### 7. Diff Layer
**責務**: スナップショット比較と変更検出

**主要コンポーネント**:

#### DiffEngine
- スナップショット間の詳細比較
- コンポーネント、トークン、クラスの変更検出
- CI/CD統合のための構造化結果

**設計パターン**: 
- Strategy Pattern (比較戦略)
- Observer Pattern (変更通知)

## データフロー

### 1. 入力段階
```
Source Files (TypeScript/JSX)
           ↓
    ASTTraverser & Analyzers
           ↓
  Extracted Components Data
```

### 2. 抽出段階
```
Components Data + Config Files
           ↓
   TailwindExtractor (Orchestrator)
           ↓
   StyleExtractors + DesignTokenExtractor
           ↓
   Structured Component + Token Data
```

### 3. 生成段階
```
Structured Data
           ↓
AIDocumentGenerator (Orchestrator)
           ↓
Component Docs + Patterns + Guidelines
           ↓
    MarkdownFormatter
           ↓
Final Documentation (JSON + Markdown)
```

### 4. 比較段階（オプション）
```
Old Snapshot + New Snapshot
           ↓
       DiffEngine
           ↓
   Change Detection Report
```

## 設計パターンの活用

### 1. Singleton Pattern
**適用箇所**: ConfigManager
**目的**: アプリケーション全体で統一された設定管理

### 2. Factory Pattern
**適用箇所**: StyleExtractorFactory
**目的**: プラットフォーム固有エクストラクターの統一生成

### 3. Strategy Pattern
**適用箇所**: 各StyleExtractor、比較戦略
**目的**: プラットフォーム/スタイルシステム固有の処理の切り替え

### 4. Orchestrator Pattern
**適用箇所**: TailwindExtractor、AIDocumentGenerator
**目的**: 複数の専門コンポーネントの協調動作

### 5. Template Method Pattern
**適用箇所**: StyleExtractor基底クラス、AST解析処理
**目的**: 共通処理フローの定義と各実装での差異の吸収

### 6. Visitor Pattern
**適用箇所**: AST走査処理
**目的**: ASTノードの型安全な走査と処理

### 7. Command Pattern
**適用箇所**: CLI command処理
**目的**: コマンドの実行と取り消し、履歴管理

### 8. Builder Pattern
**適用箇所**: ドキュメント生成プロセス
**目的**: 複雑なドキュメント構造の段階的構築

## 拡張ポイント

### 1. 新しいプラットフォーム追加
```typescript
// 1. カスタムStyleExtractor実装
class MyPlatformExtractor extends StyleExtractor {
  extractStyles(node: any): ExtractedStyleInfo[] {
    // プラットフォーム固有の抽出ロジック
  }
}

// 2. ConfigManagerに登録
ConfigManager.getInstance().registerCustomStyleSystem('my-platform', {
  extractor: './path/to/MyPlatformExtractor',
  validation: {...}
});
```

### 2. 新しいスタイルシステム追加
```typescript
// StyleExtractorFactoryで新しいケースを追加
case 'my-style-system':
  return new MyStyleSystemExtractor(config);
```

### 3. カスタムジェネレーター追加
```typescript
// AIDocumentGeneratorにカスタムジェネレーターを統合
const customResult = this.customGenerator.generate(components);
document.customSection = customResult;
```

## パフォーマンス考慮事項

### 1. AST処理の最適化
- **キャッシュ機能**: 解析済みASTの再利用
- **並列処理**: 複数ファイルの同時解析
- **差分更新**: 変更されたファイルのみ再解析

### 2. メモリ使用量の最適化
- **ストリーミング処理**: 大量ファイルの段階的処理
- **ガベージコレクション**: 不要オブジェクトの適切な解放
- **データ構造最適化**: 効率的なデータ構造の選択

### 3. I/O処理の最適化
- **非同期処理**: ファイル読み込みの並列化
- **バッチ処理**: 複数ファイルの一括処理
- **キャッシュ戦略**: 頻繁に使用される設定の高速アクセス

## エラーハンドリング戦略

### 1. 段階的フォールバック
```
TailwindConfig → StyleSheet → Default Values
```

### 2. 局所的エラー封じ込め
- 個別コンポーネントのエラーがシステム全体に影響しない
- エラー発生箇所の特定と詳細ログ
- 部分的成功での処理継続

### 3. 型安全性による事前防止
- TypeScriptによる厳密な型チェック
- ランタイム検証の最小化
- 設定ファイルのスキーマ検証

## テスト戦略

### 1. 単体テスト（Unit Testing）
- 各クラスの個別機能テスト
- モックを使用した依存関係の分離
- エッジケースとエラー条件のテスト

### 2. 統合テスト（Integration Testing）
- レイヤー間の連携テスト
- 実際のプロジェクトファイルを使用したテスト
- エンドツーエンドのワークフローテスト

### 3. パフォーマンステスト
- 大量ファイル処理の性能測定
- メモリ使用量の監視
- 処理時間の最適化検証

## セキュリティ考慮事項

### 1. ファイルアクセス制御
- 許可されたディレクトリ内でのみ動作
- シンボリックリンクによる不正アクセス防止
- 設定ファイルの検証

### 2. 実行コード制御
- requireによる動的読み込みの制限
- カスタムエクストラクターの検証
- サンドボックス化された実行環境

### 3. 出力データの検証
- 生成されたドキュメントの無害性確認
- 機密情報の漏洩防止
- ログ出力の適切な制御

## 今後の拡張計画

### 1. フレームワーク対応拡張
- Vue.js support
- Angular support
- Svelte support

### 2. スタイルシステム対応拡張
- Emotion support
- Styled System support
- Custom CSS-in-JS solutions

### 3. AI機能強化
- 自動改善提案
- 使用パターン分析
- パフォーマンス最適化提案

### 4. 開発ツール統合
- VS Code extension
- Webpack plugin
- Next.js integration

この包括的なアーキテクチャにより、拡張性、保守性、性能を兼ね備えたデザインシステムドキュメント生成ツールを実現しています。