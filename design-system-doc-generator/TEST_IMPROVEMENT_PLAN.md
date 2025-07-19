# テスト修正計画書

## 📋 概要

現在のテスト成功率は81%（152/187 tests）で、CLI機能の核心部分は動作していますが、個別コンポーネントのテストに課題があります。本計画書では、残り19%のテスト修正を優先度別に整理し、段階的な修正アプローチを提案します。

## 🎯 修正対象と優先度

### 🔥 高優先度（Phase 1）
**対象**: CLI機能に直接影響する重要なコンポーネント

#### 1. **TailwindExtractor**
- **問題**: ComponentAnalyzerのモックが正しく動作していない
- **影響**: メインのTailwindクラス抽出機能
- **修正内容**:
  ```typescript
  // テストでのモック設定を修正
  ComponentAnalyzer.prototype.analyzeFile = jest.fn().mockResolvedValue({
    content: 'mock content',
    ast: mockAst,
    componentName: 'TestComponent',
    isComponentFile: true
  });
  ```
- **期待する結果**: extractFromFileメソッドが正常に動作
- **所要時間**: 1-2時間

#### 2. **ComponentAnalyzer**
- **問題**: 変数宣言からのコンポーネント名抽出が失敗
- **影響**: コンポーネント解析の基盤機能
- **修正内容**:
  - extractComponentNameメソッドの変数宣言パターン対応
  - テストケースのAST構造を実際のケースに合わせて修正
- **期待する結果**: 全てのコンポーネント名抽出パターンが動作
- **所要時間**: 2-3時間

#### 3. **StyleExtractorFactory (StyleSheetExtractor)**
- **問題**: StyleSheet.create()の解析とバリデーションが動作していない
- **影響**: React Native対応の重要機能
- **修正内容**:
  - extractStyleObjectsメソッドの実装修正
  - validateStylesメソッドのReact Native固有プロパティチェック
- **期待する結果**: React NativeのStyleSheet解析が正常動作
- **所要時間**: 2-3時間

### 📋 中優先度（Phase 2）
**対象**: 警告やエラーハンドリングの改善

#### 4. **DesignTokenExtractor**
- **問題**: tailwind.config.jsファイルが見つからない警告
- **影響**: テスト実行時の警告ログ
- **修正内容**:
  - テスト用のモックtailwind.config.jsファイル作成
  - パス解決ロジックの改善
- **期待する結果**: 警告ログの除去
- **所要時間**: 1時間

#### 5. **ConfigManager**
- **問題**: プラットフォーム固有設定のプロパティアクセスエラー
- **影響**: 設定管理機能
- **修正内容**:
  - platformSpecific設定のマージロジック修正
  - 型定義の調整
- **期待する結果**: 設定ファイルの完全対応
- **所要時間**: 1-2時間

### 🚀 低優先度（Phase 3）
**対象**: 環境依存や追加機能のテスト

#### 6. **CodeValidation**
- **問題**: TypeScript型チェック機能が正しく動作していない
- **影響**: コード検証機能
- **修正内容**:
  - TypeScript設定の調整
  - テスト環境での型チェック有効化
- **期待する結果**: TypeScript検証が動作
- **所要時間**: 2-3時間

## 📅 実装スケジュール

### Week 1: Phase 1（高優先度）
- **Day 1-2**: TailwindExtractor修正
- **Day 3-4**: ComponentAnalyzer修正  
- **Day 5**: StyleExtractorFactory修正

### Week 2: Phase 2-3（中・低優先度）
- **Day 1**: DesignTokenExtractor修正
- **Day 2**: ConfigManager修正
- **Day 3**: CodeValidation修正
- **Day 4-5**: 統合テスト・最終調整

## 🎯 成功指標

### Phase 1完了時の目標
- **テスト成功率**: 90%以上
- **CLI機能**: 完全動作保証
- **コアコンポーネント**: 全て正常動作

### 最終目標
- **テスト成功率**: 95%以上
- **警告ログ**: 0件
- **CI/CD**: 安定動作

## 🔧 修正アプローチ

### 1. **段階的修正**
```bash
# Phase 1: 高優先度のテストのみ実行
npm test -- --testPathPattern="(TailwindExtractor|ComponentAnalyzer|StyleExtractorFactory)"

# Phase 2: 中優先度追加
npm test -- --testPathPattern="(DesignTokenExtractor|ConfigManager)"

# Phase 3: 全体確認
npm test
```

### 2. **モック戦略**
- **実装に依存しないモック**: 安定したテスト環境
- **リアルなデータ使用**: 実際の使用ケースに近いテスト
- **環境分離**: テスト環境でのファイルシステム依存除去

### 3. **リグレッション防止**
- **修正前後の動作比較**: 既存機能に影響しないことを確認
- **CI/CD統合**: 自動テスト実行
- **カバレッジ監視**: テストカバレッジの維持・向上

## 📊 リスク評価

| リスク | 影響度 | 確率 | 対策 |
|--------|---------|------|------|
| Phase 1修正が既存機能に影響 | 高 | 低 | 段階的修正、十分なテスト |
| TypeScript設定問題が解決困難 | 中 | 中 | 代替手法の検討 |
| 環境依存の問題が継続 | 低 | 高 | モック化、環境分離 |

## 🚀 次のアクション

### 即座に開始可能
1. **TailwindExtractorのモック修正**
2. **ComponentAnalyzerの変数宣言対応**

### 準備が必要
1. **StyleSheetExtractorの詳細調査**
2. **TypeScript設定の環境調査**

## 📈 現在の状況

### ✅ 動作中のコンポーネント
- TailwindClassExtractor
- TailwindUtils
- JSXStructureExtractor
- ComponentDocumentGenerator
- CLI integration tests
- Hash utilities
- File utilities (Permission error は環境的なもの)

### ❌ 修正が必要なコンポーネント
- ComponentAnalyzer (変数宣言からのコンポーネント名抽出)
- DesignTokenExtractor (tailwind.config.js 参照)
- TailwindExtractor (ComponentAnalyzer モック)
- StyleExtractorFactory (StyleSheet.create() 解析)
- CodeValidation (TypeScript 型チェック)
- ConfigManager (プラットフォーム固有設定)

## 🎖️ 結論

この計画に従って修正を進めることで、**2週間以内に95%以上のテスト成功率**を達成し、安定したCI/CD環境を構築できます。

重要な点は、CLI機能の核心部分（81%のテスト）は既に動作しているため、段階的な修正アプローチにより**リスクを最小化**しながら品質向上を図ることができることです。