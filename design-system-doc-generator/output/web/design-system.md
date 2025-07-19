# デザインシステムドキュメント

生成日時: 2025/7/19 15:42:05

## プロジェクト情報

- **名前**: design-system-doc-generator
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

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { App } from './App';

function Example() {
  return <App />;
}
```

**関連コンポーネント**: HomePage, TestComponent, Input, Button, Badge

---

#### TestComponent

基本的なUI要素「TestComponent」。

**使用方法**: `<TestComponent title={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | `any` | ✓ | - | タイトルテキスト |
| count | `any` | - | `0` | countプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- 使用クラス: `bg-blue-500`, `bg-white`, `font-bold`, `mt-2`, `mt-4`, `p-4`, `px-4`, `py-2`, `rounded`, `rounded-lg` +4個

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { TestComponent } from './TestComponent';

function Example() {
  return (
    <TestComponent
    title={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { TestComponent } from './TestComponent';

function Example() {
  return (
    <TestComponent
    title={{}}
    count={{}}
    />
  );
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// bg-blue-500, bg-white, font-bold, mt-2, mt-4, p-4, px-4, py-2, rounded, rounded-lg, text-blue-500, text-gray-100, text-white, text-xl
```

**関連コンポーネント**: App, Input, Button, Badge

---

#### Input

基本的なUI要素「Input」。

**使用方法**: `<Input id={{}} name={{}} value={{}} placeholder={{}} onChange={{}} onFocus={{}} onBlur={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| id | `any` | ✓ | - | DOM要素のID |
| name | `any` | ✓ | - | フォーム要素の名前 |
| type | `any` | - | `text` | インプットタイプまたはバリアント |
| value | `any` | ✓ | - | コンポーネントの値 |
| placeholder | `any` | ✓ | - | プレースホルダーテキスト |
| disabled | `any` | - | `false` | コンポーネントの無効化状態 |
| required | `any` | - | `false` | requiredプロパティ |
| error | `any` | - | `false` | エラー状態の表示 |
| size | `any` | - | `md` | コンポーネントのサイズ |
| fullWidth | `any` | - | `false` | fullWidthプロパティ |
| onChange | `any` | ✓ | - | 値変更時のイベントハンドラ |
| onFocus | `any` | ✓ | - | onFocusプロパティ |
| onBlur | `any` | ✓ | - | onBlurプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { Input } from './Input';

function Example() {
  return (
    <Input
    id={{}}
    name={{}}
    value={{}}
    placeholder={{}}
    onChange={{}}
    onFocus={{}}
    onBlur={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { Input } from './Input';

function Example() {
  return (
    <Input
    id={{}}
    name={{}}
    type={{}}
    value={{}}
    placeholder={{}}
    disabled={{}}
    required={{}}
    error={{}}
    size={{}}
    fullWidth={{}}
    onChange={{}}
    onFocus={{}}
    onBlur={{}}
    />
  );
}
```

**関連コンポーネント**: App, TestComponent, Button, Badge

---

#### Button

基本的なUI要素「Button」。アニメーション効果付き。

**使用方法**: `<Button children={{}} onClick={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| onClick | `any` | ✓ | - | クリック時のイベントハンドラ |
| disabled | `any` | - | `false` | コンポーネントの無効化状態 |
| variant | `any` | - | `primary` | コンポーネントのバリアント |
| size | `any` | - | `md` | コンポーネントのサイズ |
| fullWidth | `any` | - | `false` | fullWidthプロパティ |
| loading | `any` | - | `false` | ローディング状態の表示 |
| type | `any` | - | `button` | インプットタイプまたはバリアント |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- アニメーション: animate-spin
- 使用クラス: `animate-spin`, `h-4`, `mr-2`, `opacity-25`, `opacity-75`, `w-4`

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { Button } from './Button';

function Example() {
  return (
    <Button
    children={{}}
    onClick={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { Button } from './Button';

function Example() {
  return (
    <Button
    children={{}}
    onClick={{}}
    disabled={{}}
    variant={{}}
    size={{}}
    fullWidth={{}}
    loading={{}}
    type={{}}
    />
  );
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// animate-spin, h-4, mr-2, opacity-25, opacity-75, w-4
```

**関連コンポーネント**: App, TestComponent, Input, Badge

---

#### Badge

基本的なUI要素「Badge」。

**使用方法**: `<Badge children={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| variant | `any` | - | `primary` | コンポーネントのバリアント |
| size | `any` | - | `md` | コンポーネントのサイズ |
| rounded | `any` | - | `false` | roundedプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { Badge } from './Badge';

function Example() {
  return (
    <Badge
    children={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { Badge } from './Badge';

function Example() {
  return (
    <Badge
    children={{}}
    variant={{}}
    size={{}}
    rounded={{}}
    />
  );
}
```

**関連コンポーネント**: App, TestComponent, Input, Button

---

### Molecules

#### Modal

複数の要素を組み合わせた「Modal」コンポーネント。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<Modal isOpen={{}} onClose={{}} title={{}} children={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| isOpen | `any` | ✓ | - | isOpenプロパティ |
| onClose | `any` | ✓ | - | onCloseプロパティ |
| title | `any` | ✓ | - | タイトルテキスト |
| children | `any` | ✓ | - | コンポーネントの子要素 |
| size | `any` | - | `md` | コンポーネントのサイズ |
| showCloseButton | `any` | - | `true` | showCloseButtonプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- アニメーション: transition-all, transition-opacity
- 使用クラス: `bg-black`, `bg-opacity-50`, `bg-white`, `fixed`, `flex`, `focus:outline-none`, `focus:ring-2`, `focus:ring-offset-2`, `focus:ring-primary-500`, `font-semibold` +31個

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { Modal } from './Modal';

function Example() {
  return (
    <Modal
    isOpen={{}}
    onClose={{}}
    title={{}}
    children={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { Modal } from './Modal';

function Example() {
  return (
    <Modal
    isOpen={{}}
    onClose={{}}
    title={{}}
    children={{}}
    size={{}}
    showCloseButton={{}}
    />
  );
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// bg-black, bg-opacity-50, bg-white, fixed, flex, focus:outline-none, focus:ring-2, focus:ring-offset-2, focus:ring-primary-500, font-semibold, h-6, hover:text-secondary-600, inset-0, items-center, justify-between, justify-center, mb-4, overflow-hidden, p-4, pb-4, pt-5, px-4, relative, rounded-md, rounded-xl, shadow-xl, sm:my-8, sm:p-0, sm:p-6, sm:w-full, sr-only, text-center, text-left, text-lg, text-secondary-400, text-secondary-700, text-secondary-900, transition-all, transition-opacity, w-6, z-50
```

**関連コンポーネント**: Button, FormField, Card

---

#### FormField

複数の要素を組み合わせた「FormField」コンポーネント。フレックスボックスレイアウトを使用。

**使用方法**: `<FormField label={{}} error={{}} helper={{}} required={{}} id={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| label | `any` | ✓ | - | ラベルテキスト |
| error | `any` | ✓ | - | エラー状態の表示 |
| helper | `any` | ✓ | - | helperプロパティ |
| required | `any` | ✓ | - | requiredプロパティ |
| id | `any` | ✓ | - | DOM要素のID |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- 使用クラス: `block`, `flex`, `font-medium`, `h-4`, `items-center`, `mr-1`, `space-y-1`, `text-danger-600`, `text-secondary-500`, `text-secondary-700` +2個

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { FormField } from './FormField';

function Example() {
  return (
    <FormField
    label={{}}
    error={{}}
    helper={{}}
    required={{}}
    id={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { FormField } from './FormField';

function Example() {
  return (
    <FormField
    label={{}}
    error={{}}
    helper={{}}
    required={{}}
    id={{}}
    />
  );
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// block, flex, font-medium, h-4, items-center, mr-1, space-y-1, text-danger-600, text-secondary-500, text-secondary-700, text-sm, w-4
```

**関連コンポーネント**: Input, Modal, Card

---

#### Card

複数の要素を組み合わせた「Card」コンポーネント。

**使用方法**: `<Card children={{}} className={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| className | `any` | ✓ | - | 追加のCSSクラス名 |
| padding | `any` | - | `md` | paddingプロパティ |
| shadow | `any` | - | `soft` | shadowプロパティ |
| rounded | `any` | - | `true` | roundedプロパティ |
| hoverable | `any` | - | `false` | hoverableプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { Card } from './Card';

function Example() {
  return (
    <Card
    children={{}}
    className={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { Card } from './Card';

function Example() {
  return (
    <Card
    children={{}}
    className={{}}
    padding={{}}
    shadow={{}}
    rounded={{}}
    hoverable={{}}
    />
  );
}
```

**関連コンポーネント**: Modal, FormField

---

### Organisms

#### ProductList

複雑な機能を持つ「ProductList」セクション。フレックスボックスレイアウトを使用、グリッドレイアウトを使用、アニメーション効果付き、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<ProductList products={{}} onProductClick={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| products | `any` | ✓ | - | productsプロパティ |
| loading | `any` | - | `false` | ローディング状態の表示 |
| onProductClick | `any` | ✓ | - | onProductClickプロパティ |
| showCategory | `any` | - | `true` | showCategoryプロパティ |
| showRating | `any` | - | `true` | showRatingプロパティ |
| gridCols | `any` | - | `3` | gridColsプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- アニメーション: animate-pulse
- 使用クラス: `animate-pulse`, `bg-secondary-100`, `bg-secondary-200`, `border-secondary-100`, `border-t`, `flex`, `flex-1`, `flex-col`, `font-bold`, `font-semibold` +34個

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { ProductList } from './ProductList';

function Example() {
  return (
    <ProductList
    products={{}}
    onProductClick={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { ProductList } from './ProductList';

function Example() {
  return (
    <ProductList
    products={{}}
    loading={{}}
    onProductClick={{}}
    showCategory={{}}
    showRating={{}}
    gridCols={{}}
    />
  );
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// animate-pulse, bg-secondary-100, bg-secondary-200, border-secondary-100, border-t, flex, flex-1, flex-col, font-bold, font-semibold, gap-6, grid, grid-cols-1, group-hover:opacity-75, h-4, h-48, h-full, items-center, items-start, justify-between, lg:grid-cols-3, mb-4, md:grid-cols-2, object-center, object-cover, overflow-hidden, pt-3, rounded, rounded-lg, space-x-1, space-x-2, space-y-2, space-y-3, space-y-4, text-lg, text-secondary-500, text-secondary-600, text-secondary-900, text-sm, text-xl, w-1/2, w-3/4, w-4, w-full
```

**関連コンポーネント**: Card, Button, Badge, Header

---

#### Header

複雑な機能を持つ「Header」セクション。フレックスボックスレイアウトを使用、ホバー効果あり、レスポンシブ対応。

**使用方法**: `<Header title={{}} subtitle={{}} actions={{}} navigation={{}} user={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | `any` | ✓ | - | タイトルテキスト |
| subtitle | `any` | ✓ | - | subtitleプロパティ |
| actions | `any` | ✓ | - | actionsプロパティ |
| navigation | `any` | ✓ | - | navigationプロパティ |
| showNotification | `any` | - | `false` | showNotificationプロパティ |
| notificationCount | `any` | - | `0` | notificationCountプロパティ |
| user | `any` | ✓ | - | userプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- アニメーション: duration-200, transition-colors
- 使用クラス: `absolute`, `bg-primary-500`, `bg-white`, `border-b`, `border-secondary-200`, `duration-200`, `flex`, `flex-shrink-0`, `focus:outline-none`, `focus:ring-2` +38個

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { Header } from './Header';

function Example() {
  return (
    <Header
    title={{}}
    subtitle={{}}
    actions={{}}
    navigation={{}}
    user={{}}
    />
  );
}
```

**全プロパティを使用した例**

全ての利用可能なプロパティを含む例 ✅

```tsx
import { Header } from './Header';

function Example() {
  return (
    <Header
    title={{}}
    subtitle={{}}
    actions={{}}
    navigation={{}}
    showNotification={{}}
    notificationCount={{}}
    user={{}}
    />
  );
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// absolute, bg-primary-500, bg-white, border-b, border-secondary-200, duration-200, flex, flex-shrink-0, focus:outline-none, focus:ring-2, focus:ring-offset-2, focus:ring-primary-500, font-bold, font-medium, font-normal, h-16, h-6, h-8, hidden, hover:text-secondary-600, items-center, justify-between, justify-center, lg:px-8, max-w-7xl, md:block, md:flex, ml-2, mx-auto, p-2, px-4, relative, rounded-full, rounded-md, shadow-soft, sm:px-6, space-x-3, space-x-4, space-x-8, text-secondary-400, text-secondary-500, text-secondary-900, text-sm, text-white, text-xl, transition-colors, w-6, w-8
```

**関連コンポーネント**: Button, Badge, ProductList

---

### Pages

#### HomePage

完全なページコンポーネント「HomePage」。フレックスボックスレイアウトを使用、レスポンシブ対応。

**使用方法**: `<HomePage />`

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗
- 使用クラス: `bg-secondary-100`, `bg-secondary-50`, `flex`, `font-bold`, `font-medium`, `h-full`, `items-center`, `items-start`, `justify-between`, `lg:px-8` +28個

**使用例**:

**基本的な使用方法**

最もシンプルな使用例 ✅

```tsx
import { HomePage } from './HomePage';

function Example() {
  return <HomePage />;
}
```

**Tailwindクラス検証**

Tailwindクラスの有効性チェック ✅

```tsx
// 使用されているTailwindクラス:
// bg-secondary-100, bg-secondary-50, flex, font-bold, font-medium, h-full, items-center, items-start, justify-between, lg:px-8, max-w-7xl, mb-2, mb-8, mt-1, mx-auto, object-center, object-cover, overflow-hidden, pt-4, px-4, py-8, rounded-lg, sm:px-6, space-x-2, space-x-3, space-y-4, space-y-6, text-2xl, text-3xl, text-danger-600, text-lg, text-right, text-secondary-500, text-secondary-600, text-secondary-900, text-sm, text-success-600, w-full
```

**関連コンポーネント**: Header, ProductList, Modal, Button

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

1. レスポンシブデザイン: 4個のコンポーネントがレスポンシブ対応しています。モバイルファーストのアプローチを維持してください。

2. ブレークポイント: smが最も使用されているブレークポイントです。一貫したブレークポイント使用を心がけてください。

3. コンポーネント構成: Atoms(5), Molecules(3), Organisms(2), Templates(0), Pages(1)。Atomic Designの原則に従ってコンポーネントを構築してください。

4. アクセシビリティ: インタラクティブな要素には適切なfocus状態を提供し、キーボードナビゲーションを考慮してください。

5. フォーカススタイル: 一部のインタラクティブコンポーネントにfocus状態が定義されていません。全てのインタラクティブ要素にfocus状態を追加してください。

6. アニメーション: 4個のコンポーネントでアニメーションを使用しています。パフォーマンスを考慮し、必要な場合のみアニメーションを使用してください。

7. コンポーネント複雑度: 5個のコンポーネントが複雑です。パフォーマンスと保守性のため、コンポーネントの分割を検討してください。

