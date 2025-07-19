# デザインシステムドキュメント

生成日時: 2025/7/19 5:04:55

## プロジェクト情報

- **名前**: sample-project-react-native
- **バージョン**: 1.0.0
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

### スペーシング

| トークン | 値 |
|----------|----|

## コンポーネント一覧

### Atoms

#### App

基本的なUI要素「App」。

**使用方法**: `<App />`

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: Header, HomePage, Input, Button, Badge

---

#### Input

基本的なUI要素「Input」。

**使用方法**: `<Input label={{}} error={{}} helpText={{}} onFocus={{}} onBlur={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | `any` | ✓ | - | ラベルテキスト |
| error | `any` | ✓ | - | エラー状態の表示 |
| helpText | `any` | ✓ | - | helpTextプロパティ |
| required | `any` | - | `false` | requiredプロパティ |
| size | `any` | - | `medium` | コンポーネントのサイズ |
| onFocus | `any` | ✓ | - | onFocusプロパティ |
| onBlur | `any` | ✓ | - | onBlurプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: App, Button, Badge

---

#### Button

基本的なUI要素「Button」。

**使用方法**: `<Button children={{}} onPress={{}} accessibilityLabel={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| variant | `any` | - | `primary` | コンポーネントのバリアント |
| size | `any` | - | `medium` | コンポーネントのサイズ |
| disabled | `any` | - | `false` | コンポーネントの無効化状態 |
| onPress | `any` | ✓ | - | onPressプロパティ |
| accessibilityLabel | `any` | ✓ | - | accessibilityLabelプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: App, Input, Badge

---

#### Badge

基本的なUI要素「Badge」。

**使用方法**: `<Badge children={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| variant | `any` | - | `default` | コンポーネントのバリアント |
| size | `any` | - | `medium` | コンポーネントのサイズ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: App, Input, Button

---

### Molecules

#### Modal

複数の要素を組み合わせた「Modal」コンポーネント。

**使用方法**: `<Modal visible={{}} title={{}} children={{}} actionButtonText={{}} onClose={{}} onAction={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| visible | `any` | ✓ | - | visibleプロパティ |
| title | `any` | ✓ | - | タイトルテキスト |
| children | `any` | ✓ | - | コンポーネントの子要素 |
| closeButtonText | `any` | - | `キャンセル` | closeButtonTextプロパティ |
| actionButtonText | `any` | ✓ | - | actionButtonTextプロパティ |
| onClose | `any` | ✓ | - | onCloseプロパティ |
| onAction | `any` | ✓ | - | onActionプロパティ |
| size | `any` | - | `medium` | コンポーネントのサイズ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: Button, Card

---

#### Card

複数の要素を組み合わせた「Card」コンポーネント。

**使用方法**: `<Card title={{}} children={{}} footer={{}} onPress={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | `any` | ✓ | - | タイトルテキスト |
| children | `any` | ✓ | - | コンポーネントの子要素 |
| footer | `any` | ✓ | - | footerプロパティ |
| onPress | `any` | ✓ | - | onPressプロパティ |
| elevation | `any` | - | `small` | elevationプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: Modal

---

### Organisms

#### ProductList

複雑な機能を持つ「ProductList」セクション。

**使用方法**: `<ProductList products={{}} onProductPress={{}} onAddToCart={{}} header={{}} emptyState={{}} item={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| products | `any` | ✓ | - | productsプロパティ |
| onProductPress | `any` | ✓ | - | onProductPressプロパティ |
| onAddToCart | `any` | ✓ | - | onAddToCartプロパティ |
| header | `any` | ✓ | - | headerプロパティ |
| emptyState | `any` | ✓ | - | emptyStateプロパティ |
| item | `any` | ✓ | - | itemプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: Card, Button, Badge, Header

---

#### Header

複雑な機能を持つ「Header」セクション。

**使用方法**: `<Header leftAction={{}} rightAction={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | `any` | - | `Design System RN` | タイトルテキスト |
| leftAction | `any` | ✓ | - | leftActionプロパティ |
| rightAction | `any` | ✓ | - | rightActionプロパティ |
| backgroundColor | `any` | - | `#3B82F6` | backgroundColorプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: Badge, ProductList

---

### Pages

#### HomePage

完全なページコンポーネント「HomePage」。

**使用方法**: `<HomePage />`

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
**関連コンポーネント**: ProductList, Button, Input, Modal

---

## デザインパターン

### カードシステム

コンテンツを整理して表示するためのカードコンポーネントパターン。

**使用コンポーネント**: Card

**使用例**:

```tsx
// カード使用例
<Card>
  <CardHeader title="タイトル" />
  <CardBody>
    <p>カードのコンテンツ</p>
  </CardBody>
  <CardFooter>
    <Button>アクション</Button>
  </CardFooter>
</Card>
```

## ガイドライン

1. コンポーネント構成: Atoms(4), Molecules(2), Organisms(2), Templates(0), Pages(1)。Atomic Designの原則に従ってコンポーネントを構築してください。

2. アクセシビリティ: インタラクティブな要素には適切なfocus状態を提供し、キーボードナビゲーションを考慮してください。

3. フォーカススタイル: 一部のインタラクティブコンポーネントにfocus状態が定義されていません。全てのインタラクティブ要素にfocus状態を追加してください。

