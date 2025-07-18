# デザインシステムドキュメント

生成日時: 2025/7/18 8:28:59

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

---


### Molecules

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

**関連コンポーネント**: Input

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

**関連コンポーネント**: Header

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

**関連コンポーネント**: ProductList

---


### Pages

#### HomePage

完全なページコンポーネント「HomePage」。フレックスボックスレイアウトを使用、レスポンシブ対応。

**使用方法**: `<HomePage />`

**スタイル情報**:
- レスポンシブ対応: ✓
- ダークモード対応: ✗

**関連コンポーネント**: Header, ProductList

---


## ガイドライン

1. レスポンシブデザイン: 3個のコンポーネントがレスポンシブ対応しています。モバイルファーストのアプローチを維持してください。

2. コンポーネント構成: Atoms(1), Molecules(1), Organisms(2)。Atomic Designの原則に従ってコンポーネントを構築してください。

