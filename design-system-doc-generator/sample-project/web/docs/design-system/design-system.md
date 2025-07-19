# デザインシステムドキュメント

生成日時: 2025/7/18 14:16:22

## プロジェクト情報

- **名前**: sample-react-app
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
| primary-50 | #eff6ff | rgb(239, 246, 255) | - |
| primary-100 | #dbeafe | rgb(219, 234, 254) | - |
| primary-200 | #bfdbfe | rgb(191, 219, 254) | - |
| primary-300 | #93c5fd | rgb(147, 197, 253) | - |
| primary-400 | #60a5fa | rgb(96, 165, 250) | - |
| primary-500 | #3b82f6 | rgb(59, 130, 246) | - |
| primary-600 | #2563eb | rgb(37, 99, 235) | - |
| primary-700 | #1d4ed8 | rgb(29, 78, 216) | - |
| primary-800 | #1e40af | rgb(30, 64, 175) | - |
| primary-900 | #1e3a8a | rgb(30, 58, 138) | - |
| secondary-50 | #f9fafb | rgb(249, 250, 251) | - |
| secondary-100 | #f3f4f6 | rgb(243, 244, 246) | - |
| secondary-200 | #e5e7eb | rgb(229, 231, 235) | - |
| secondary-300 | #d1d5db | rgb(209, 213, 219) | - |
| secondary-400 | #9ca3af | rgb(156, 163, 175) | - |
| secondary-500 | #6b7280 | rgb(107, 114, 128) | - |
| secondary-600 | #4b5563 | rgb(75, 85, 99) | - |
| secondary-700 | #374151 | rgb(55, 65, 81) | - |
| secondary-800 | #1f2937 | rgb(31, 41, 55) | - |
| secondary-900 | #111827 | rgb(17, 24, 39) | - |
| ... | 他30色 | | |

### スペーシング

| トークン | 値 |
|----------|----|
| 18 | 4.5rem |
| 88 | 22rem |
| 128 | 32rem |

### タイポグラフィ

**フォントサイズ:**

| サイズ | 値 |
|-------|----|
| 2xs | 0.625rem |
| 3xl | 1.875rem |
| 4xl | 2.25rem |
| 5xl | 3rem |
| 6xl | 3.75rem |
| 7xl | 4.5rem |

## コンポーネント一覧


### Atoms

#### TestComponent

基本的なUI要素「TestComponent」。

**使用方法**: `<TestComponent title={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | `any` | ✓ | タイトルテキスト |
| count | `any` | - | countプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**関連コンポーネント**: Input, Button, Badge

---

#### Input

基本的なUI要素「Input」。

**使用方法**: `<Input id={{}} name={{}} value={{}} placeholder={{}} onChange={{}} onFocus={{}} onBlur={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| id | `any` | ✓ | DOM要素のID |
| name | `any` | ✓ | フォーム要素の名前 |
| type | `any` | - | インプットタイプまたはバリアント |
| value | `any` | ✓ | コンポーネントの値 |
| placeholder | `any` | ✓ | プレースホルダーテキスト |
| disabled | `any` | - | コンポーネントの無効化状態 |
| required | `any` | - | requiredプロパティ |
| error | `any` | - | エラー状態の表示 |
| size | `any` | - | コンポーネントのサイズ |
| fullWidth | `any` | - | fullWidthプロパティ |
| onChange | `any` | ✓ | 値変更時のイベントハンドラ |
| onFocus | `any` | ✓ | onFocusプロパティ |
| onBlur | `any` | ✓ | onBlurプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**関連コンポーネント**: TestComponent, Button, Badge

---

#### Button

基本的なUI要素「Button」。アニメーション効果付き。

**使用方法**: `<Button children={{}} onClick={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | `any` | ✓ | コンポーネントの子要素 |
| onClick | `any` | ✓ | クリック時のイベントハンドラ |
| disabled | `any` | - | コンポーネントの無効化状態 |
| variant | `any` | - | コンポーネントのバリアント |
| size | `any` | - | コンポーネントのサイズ |
| fullWidth | `any` | - | fullWidthプロパティ |
| loading | `any` | - | ローディング状態の表示 |
| type | `any` | - | インプットタイプまたはバリアント |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- アニメーション: animate-spin

**関連コンポーネント**: TestComponent, Input, Badge

---

#### Badge

基本的なUI要素「Badge」。

**使用方法**: `<Badge children={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | `any` | ✓ | コンポーネントの子要素 |
| variant | `any` | - | コンポーネントのバリアント |
| size | `any` | - | コンポーネントのサイズ |
| rounded | `any` | - | roundedプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**関連コンポーネント**: TestComponent, Input, Button

---


### Molecules

#### Modal

複数の要素を組み合わせた「Modal」コンポーネント。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<Modal isOpen={{}} onClose={{}} title={{}} children={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| isOpen | `any` | ✓ | isOpenプロパティ |
| onClose | `any` | ✓ | onCloseプロパティ |
| title | `any` | ✓ | タイトルテキスト |
| children | `any` | ✓ | コンポーネントの子要素 |
| size | `any` | - | コンポーネントのサイズ |
| showCloseButton | `any` | - | showCloseButtonプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- アニメーション: transition-all, transition-opacity

**関連コンポーネント**: Button, FormField, Card

---

#### FormField

複数の要素を組み合わせた「FormField」コンポーネント。フレックスボックスレイアウトを使用。

**使用方法**: `<FormField label={{}} error={{}} helper={{}} required={{}} id={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| label | `any` | ✓ | ラベルテキスト |
| error | `any` | ✓ | エラー状態の表示 |
| helper | `any` | ✓ | helperプロパティ |
| required | `any` | ✓ | requiredプロパティ |
| id | `any` | ✓ | DOM要素のID |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**関連コンポーネント**: Input, Modal, Card

---

#### Card

複数の要素を組み合わせた「Card」コンポーネント。

**使用方法**: `<Card children={{}} className={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | `any` | ✓ | コンポーネントの子要素 |
| className | `any` | ✓ | 追加のCSSクラス名 |
| padding | `any` | - | paddingプロパティ |
| shadow | `any` | - | shadowプロパティ |
| rounded | `any` | - | roundedプロパティ |
| hoverable | `any` | - | hoverableプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**関連コンポーネント**: Modal, FormField

---


### Organisms

#### ProductList

複雑な機能を持つ「ProductList」セクション。フレックスボックスレイアウトを使用、グリッドレイアウトを使用、アニメーション効果付き、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<ProductList products={{}} onProductClick={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| products | `any` | ✓ | productsプロパティ |
| loading | `any` | - | ローディング状態の表示 |
| onProductClick | `any` | ✓ | onProductClickプロパティ |
| showCategory | `any` | - | showCategoryプロパティ |
| showRating | `any` | - | showRatingプロパティ |
| gridCols | `any` | - | gridColsプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- アニメーション: animate-pulse

**関連コンポーネント**: Card, Button, Badge, Header

---

#### Header

複雑な機能を持つ「Header」セクション。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<Header title={{}} subtitle={{}} actions={{}} navigation={{}} user={{}} />`

**Props**:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| title | `any` | ✓ | タイトルテキスト |
| subtitle | `any` | ✓ | subtitleプロパティ |
| actions | `any` | ✓ | actionsプロパティ |
| navigation | `any` | ✓ | navigationプロパティ |
| showNotification | `any` | - | showNotificationプロパティ |
| notificationCount | `any` | - | notificationCountプロパティ |
| user | `any` | ✓ | userプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- アニメーション: duration-200, transition-colors

**関連コンポーネント**: Button, Badge, ProductList

---


### Pages

#### HomePage

完全なページコンポーネント「HomePage」。フレックスボックスレイアウトを使用、レスポンシブ対応。

**使用方法**: `<HomePage />`

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗

**関連コンポーネント**: Header, ProductList, Modal, Button

---


## デザインパターン

### カードシステム

コンテンツを整理して表示するためのカードコンポーネントパターン。

**使用コンポーネント**: Card

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

1. カラーパレット: 50色のカラートークンが定義されています。プライマリカラーやセカンダリカラーを一貫して使用してください。

2. スペーシング: 3種類のスペーシングトークンが利用可能です。一貫した余白を保つため、定義されたスペーシング値を使用してください。

3. レスポンシブデザイン: 4個のコンポーネントがレスポンシブ対応しています。モバイルファーストのアプローチを維持してください。

4. コンポーネント構成: Atoms(4), Molecules(3), Organisms(2)。Atomic Designの原則に従ってコンポーネントを構築してください。

