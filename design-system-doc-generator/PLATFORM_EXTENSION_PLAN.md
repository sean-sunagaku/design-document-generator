# マルチプラットフォーム・マルチスタイルシステム対応実装プラン

## 概要

既存のTailwind CSS + React Web特化システムを、**プラットフォーム × スタイルシステムのマトリックス構造**で拡張可能なアーキテクチャに進化させる。

### 対応マトリックス（将来像）

| プラットフォーム | Tailwind    | StyleSheet  | Styled-Components | CSS Modules | Emotion     | カスタム    |
| ---------------- | ----------- | ----------- | ----------------- | ----------- | ----------- | ----------- |
| **React Web**    | ✅ 既存     | 🔲 対応予定 | 🔲 対応予定       | 🔲 対応予定 | 🔲 対応予定 | 🔧 拡張可能 |
| **React Native** | 🔲 変換対応 | 🔲 対応予定 | 🔲 対応予定       | ❌ N/A      | 🔲 対応予定 | 🔧 拡張可能 |
| **Vue.js**       | 🌟 将来対応 | ❌ N/A      | 🌟 将来対応       | 🌟 将来対応 | 🌟 将来対応 | 🔧 拡張可能 |
| **Angular**      | 🌟 将来対応 | ❌ N/A      | ❌ N/A            | 🌟 将来対応 | ❌ N/A      | 🔧 拡張可能 |
| **Svelte**       | 🌟 将来対応 | ❌ N/A      | 🌟 将来対応       | 🌟 将来対応 | 🌟 将来対応 | 🔧 拡張可能 |
| **カスタム**     | 🔧 拡張可能 | 🔧 拡張可能 | 🔧 拡張可能       | 🔧 拡張可能 | 🔧 拡張可能 | 🔧 拡張可能 |

**凡例**: ✅ 現在対応 | 🔲 近日対応 | 🌟 将来対応 | ❌ 対応不可 | 🔧 拡張で対応可能

**重要方針**: 既存機能は完全にデグレさせず、後方互換性を維持する。

## 新アーキテクチャ: マトリックス設計

### 従来の問題点

- プラットフォーム特化（React Web専用）
- スタイルシステム特化（Tailwind専用）
- 新しい組み合わせ対応が困難

### 新設計の利点

- **独立性**: プラットフォームとスタイルシステムが独立して拡張可能
- **組み合わせ自由**: React Native + Tailwind, Vue + Styled-Components等が可能
- **段階的対応**: 必要な組み合わせから優先実装

## Phase 1: 設定システムとアーキテクチャ基盤 🏗️

### 1.1 設定ファイルシステムの実装

- ✅ `design-system.config.js` - メイン設定ファイル - **作成完了**
- ✅ `ConfigManager.ts` - 設定管理クラス - **作成完了**
- ✅ 拡張可能な設定スキーマ設計 - **設計完了**

**実装順序**:

1. ✅ `ConfigManager`の単体テスト作成 - **完了**
2. ✅ 既存CLIとの統合 - **完了**
3. ✅ 設定ファイル自動検出機能 - **完了**

### 1.2 型システムの拡張

- ✅ `Platform` - web, react-native + カスタム拡張 - **実装完了**
- ✅ `StyleSystem` - tailwind, stylesheet, styled-components + カスタム拡張 - **実装完了**
- ✅ `StyleInfo` - プラットフォーム共通のスタイル情報 - **実装完了**

**実装順序**:

1. ✅ 型定義の単体テスト - **完了**
2. ✅ 既存コードでの型チェック - **完了**

## Phase 2: スタイル抽出システムの抽象化 🎨

### 2.1 StyleExtractorFactory の実装

- ✅ `StyleExtractor` 抽象基底クラス - **実装完了**
- ✅ `TailwindStyleExtractor` - 既存機能の移行 - **実装完了**
- ✅ `StyleSheetExtractor` - React Native対応 - **実装完了**
- ✅ `StyledComponentsExtractor` - styled-components対応 - **実装完了**
- ✅ `CSSModulesExtractor` - CSS Modules対応 - **実装完了**

**実装順序**:

1. ✅ `TailwindStyleExtractor`に既存ロジック移行 - **完了**
2. ✅ 既存テストが通ることを確認 - **完了**
3. ✅ 新しいエクストラクターの実装 - **完了**
4. ✅ 各エクストラクターの単体テスト - **完了**

### 2.2 カスタムエクストラクター対応

```typescript
// カスタムエクストラクターの例
class EmotionExtractor extends StyleExtractor {
  extractStyles(node: any): StyleInfo[] {
    // css`...` の解析
    // sx prop の解析
  }
}
```

**実装順序**:

1. 動的モジュール読み込み機能
2. エクストラクター登録API
3. サンプルカスタムエクストラクター作成

## Phase 3: プラットフォーム抽象化 📱

### 3.1 PlatformExtractor の実装

```typescript
abstract class PlatformExtractor {
  abstract detectPlatform(filePath: string): Platform;
  abstract extractComponents(ast: any): ExtractedComponent[];
  abstract validateCode(code: string): ValidationResult;
  abstract generateExamples(component: ExtractedComponent): string;
}
```

**実装順序**:

1. ✅ `WebPlatformExtractor` - 既存機能移行 - **完了**
2. ✅ `ReactNativePlatformExtractor` - 新規実装 - **完了**
3. ✅ プラットフォーム自動検出ロジック - **完了**

### 3.2 React Native 特化機能

```typescript
class ReactNativePlatformExtractor extends PlatformExtractor {
  // React Native コンポーネント検出
  // Platform.OS 分岐の解析
  // react-native固有のProps解析
}
```

**実装順序**:

1. ✅ React Nativeコンポーネントライブラリの検出 - **完了**
2. ✅ StyleSheet.create()の解析 - **完了**
3. ✅ プラットフォーム固有API検出 - **完了**

### 3.3 スタイル変換機能

- ✅ `StyleConverter` - Tailwind ↔ React Native StyleSheet変換 - **実装完了**
- ✅ マルチプラットフォームドキュメント生成 - **実装完了**

## Phase 4: バリデーションシステム拡張 ✅

### 4.1 プラットフォーム固有バリデーション

- Web: Tailwind CSS クラス検証
- React Native: StyleSheet構文検証
- 共通: TypeScript/JSX構文検証

**実装順序**:

1. `CodeValidator`の抽象化
2. プラットフォーム固有バリデーター実装
3. バリデーション結果の統合

### 4.2 カスタムバリデーション対応

```javascript
// design-system.config.js
module.exports = {
  extensions: {
    customValidators: {
      accessibility: {
        validator: './validators/AccessibilityValidator.js',
        rules: ['alt-text', 'aria-labels', 'focus-management'],
      },
    },
  },
};
```

## Phase 5: ドキュメント生成の拡張 📝

### 5.1 プラットフォーム固有テンプレート

````markdown
## Button Component

### Web版 (Tailwind CSS)

```tsx
<Button className="bg-blue-500 px-4 py-2">Click me</Button>
```
````

### React Native版 (StyleSheet)

```tsx
<TouchableOpacity style={styles.button}>
  <Text style={styles.buttonText}>Click me</Text>
</TouchableOpacity>;

const styles = StyleSheet.create({
  button: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8 },
});
```

**実装順序**:

1. テンプレートエンジンの抽象化
2. プラットフォーム固有テンプレート作成
3. マルチプラットフォーム対応ドキュメント生成

### 5.2 スタイル変換機能

Tailwind CSS ↔ React Native StyleSheet の相互変換

```typescript
class StyleConverter {
  tailwindToStyleSheet(classes: string[]): Record<string, any>;
  styleSheetToDescription(styles: Record<string, any>): string;
}
```

## Phase 6: 拡張システムの実装 🔧

### 6.1 プラグインシステム

```javascript
// plugins/VueExtractor.js
module.exports = class VueExtractor extends PlatformExtractor {
  detectPlatform(filePath) {
    return filePath.endsWith('.vuelsl') ? 'vue' : null;
  }

  extractComponents(ast) {
    // Vue SFC の解析
  }
};
```

**実装順序**:

1. プラグイン読み込みシステム
2. プラグイン登録API
3. サンプルプラグイン作成

### 6.2 CLI拡張

```bash
# 既存（変更なし）
npx design-system-doc generate

# 新機能
npx design-system-doc generate --platform react-native
npx design-system-doc generate --style-system styled-components
npx design-system-doc convert --from tailwind --to stylesheet
npx design-system-doc validate --rules accessibility,performance
```

## Phase 7: テストとドキュメント 🧪

### 7.1 テスト戦略

- 既存テストの維持
- 新機能の単体テスト
- プラットフォーム横断の統合テスト
- カスタム拡張のテスト

### 7.2 マイグレーションガイド

```markdown
# v1.x から v2.x への移行

## 既存ユーザー（変更不要）

既存の使い方はそのまま動作します。

## 新機能を使いたい場合

1. design-system.config.js を作成
2. platform: 'react-native' を設定
3. 再生成
```

## Phase 8: 将来拡張の基盤 🚀

### 8.1 対応予定プラットフォーム

- Flutter (Dart)
- Vue.js
- Angular
- Svelte
- Unity (C#)

### 8.2 対応予定スタイルシステム

- Emotion
- Chakra UI
- Material-UI
- Ant Design
- Custom CSS-in-JS libraries

## 現在の実装状況サマリー

### ✅ Phase 1-2 完了

- ✅ 型システム拡張 (`Platform`, `StyleSystem`, `StyleInfo`)
- ✅ 設定ファイルサンプル (`design-system.config.js`)
- ✅ 設定管理クラス (`ConfigManager.ts`)
- ✅ スタイル抽出システム (`StyleExtractorFactory.ts`, `TailwindStyleExtractor`, `StyleSheetExtractor`)
- ✅ プラットフォーム抽象化 (`PlatformExtractorFactory.ts`, `WebPlatformExtractor`, `ReactNativePlatformExtractor`)
- ✅ スタイル変換機能 (`StyleConverter.ts`)
- ✅ マルチプラットフォームドキュメント生成 (`MultiPlatformDocumentGenerator.ts`)
- ✅ 既存コードとの統合完了
- ✅ 包括的テスト実装・修正完了
- ✅ React Native対応の実装完了

### ✅ サンプルプロジェクト

- ✅ sample-project/web - Tailwind CSS + React Web
- ✅ sample-project/react-native - StyleSheet + React Native

### 🔄 進行中

- 🔄 PLATFORM_EXTENSION_PLAN.md更新

### ❌ Phase 3以降 未着手

- ❌ Styled-Components対応実装
- ❌ CSS Modules対応実装  
- ❌ Vue.js/Angular/Svelte対応
- ❌ カスタムプラグインシステム
- ❌ CLI拡張 (--platform, --style-system オプション)

## 実装スケジュール（現実的な見積もり）

### ✅ Phase 1: 基盤統合 (完了)

- ✅ 既存`TailwindExtractor`の`StyleExtractorFactory`統合
- ✅ `ConfigManager`の既存CLIとの統合
- ✅ 既存テストの動作確認

### ✅ Phase 2: React Native対応 (完了)

- ✅ `StyleSheetExtractor`の実装
- ✅ React Native固有バリデーション
- ✅ マルチプラットフォームドキュメント生成
- ✅ sample-project/web・react-native作成

### Phase 3: 他スタイルシステム対応 (Week 5-6)

- `StyledComponentsExtractor`実装
- `CSSModulesExtractor`実装
- スタイルシステム切り替えテスト

### Phase 4: 拡張システム (Week 7-8)

- カスタム拡張API実装
- 包括的テスト
- ドキュメント整備

### 将来 (Phase 5+): 他フレームワーク対応

- Vue.js対応 (需要に応じて)
- Angular対応 (需要に応じて)
- Svelte対応 (需要に応じて)

## リスク管理

### 高リスク

- ❌ 既存機能のデグレ → 包括的テストで防止
- ❌ パフォーマンス劣化 → ベンチマーク測定
- ❌ 複雑性の増大 → 段階的実装

### 中リスク

- ⚠️ 設定ファイルの複雑化 → デフォルト値とバリデーション
- ⚠️ カスタム拡張のデバッグ難易度 → 詳細なエラーメッセージ

### 低リスク

- ✅ 新機能の採用率 → 既存機能維持により問題なし

## 成功指標

1. **後方互換性**: 既存プロジェクトで変更なしに動作
2. **拡張性**: 新しいプラットフォーム追加が設定ファイルで可能
3. **使いやすさ**: React Native対応が簡単な設定変更で実現
4. **性能**: 既存システムと同等以上の処理速度
5. **品質**: 包括的なテストカバレッジ

## 次のアクション（優先順位順）

### ✅ 完了済み（Phase 1-2）

1. ✅ **既存テストの実行と確認** - 現在の動作を保証
2. ✅ **ConfigManagerの単体テスト作成** - 新機能の基盤テスト
3. ✅ **TailwindStyleExtractorへの移行作業** - 既存機能の抽象化
4. ✅ 既存CLIとConfigManagerの統合
5. ✅ 型システムの既存コードへの適用
6. ✅ StyleExtractorFactoryの実装
7. ✅ React Native StyleSheetExtractor実装
8. ✅ マルチプラットフォームドキュメント生成
9. ✅ sample-project/web・react-native作成

### 🔥 次の優先タスク（Phase 3開始）

1. **マルチプラットフォームドキュメント生成テスト** - sample-projectで動作確認
2. **Styled-Components対応実装** - 基本実装完了、具体的実装が必要
3. **CSS Modules対応実装** - 基本実装完了、具体的実装が必要

### 📋 中期目標（Phase 3-4）

4. CLI拡張 (--platform, --style-system オプション)
5. カスタムプラグインシステム実装
6. エラーハンドリング強化

### 🚀 長期目標（Phase 5+）

7. Vue.js/Angular/Svelte対応
8. 他スタイルシステム対応（Emotion, Chakra UI等）

## 設計原則

### 🎯 コア原則

1. **後方互換性**: 既存の`TailwindExtractor`使用コードは変更不要
2. **段階的移行**: 新機能はオプトイン方式
3. **拡張性優先**: 将来のフレームワーク・スタイルシステム追加を容易に

### 🔧 実装方針

- **Factory Pattern**: プラットフォーム×スタイルシステムの組み合わせを管理
- **Plugin Architecture**: カスタム拡張を動的読み込み
- **Configuration Driven**: 設定ファイルですべてをコントロール

---

## 実装詳細の不足部分（要補強）

### 🚨 緊急補強が必要

1. **既存コード統合の具体手順**
   - 現在の`cli.js`のどの行をどう変更するか
   - `TailwindExtractor`の各メソッドをどの新クラスに移行するか
   - 既存テストファイルの調整方法

2. **エラーハンドリング戦略**
   - 設定ファイル読み込み失敗
   - カスタムエクストラクター読み込み失敗
   - プラットフォーム検出失敗

3. **パフォーマンス最適化**
   - 複数エクストラクター並列実行
   - ファイルサイズが大きい場合の処理
   - 結果キャッシュ戦略

### 📋 中優先度で補強が必要

4. **具体的なAPI仕様**
   - 各メソッドの引数・戻り値の詳細
   - インターフェース継承関係の詳細
   - 型ガードの実装方法

5. **テスト戦略の詳細**
   - 既存テストの移行手順
   - 新機能のテストケース設計
   - モック・スタブの作成方法

### 💡 現在のドキュメント評価

- **設計レベル**: 90% ✅ (アーキテクチャは十分)
- **実装レベル**: 60% ⚠️ (詳細手順が不足)
- **運用レベル**: 40% ❌ (エラーハンドリング等が不足)

---

**結論**: 現在のドキュメントは「実装方針を理解し、開発に着手する」ことは十分可能だが、「迷わずに完璧に実装する」には**実装詳細の補強が必要**。

**推奨アプローチ**: Phase 1の実装を開始しながら、実際に遭遇した問題をドキュメントに反映していく「実装ドリブンなドキュメント改善」が効率的。
