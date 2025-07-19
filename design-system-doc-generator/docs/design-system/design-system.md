# デザインシステムドキュメント

生成日時: 2025/7/18 19:03:33

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

#### Button

基本的なUI要素「Button」。

**使用方法**: `<Button children={{}} onClick={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| onClick | `any` | ✓ | - | クリック時のイベントハンドラ |
| disabled | `any` | - | `false` | コンポーネントの無効化状態 |
| variant | `any` | - | `primary` | コンポーネントのバリアント |
| size | `any` | - | `md` | コンポーネントのサイズ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗

---

### Molecules

#### Card

複数の要素を組み合わせた「Card」コンポーネント。

**使用方法**: `<Card children={{}} className={{}} />`

**Props**:

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| children | `any` | ✓ | - | コンポーネントの子要素 |
| className | `any` | ✓ | - | 追加のCSSクラス名 |
| padding | `any` | - | `md` | paddingプロパティ |
| shadow | `any` | - | `true` | shadowプロパティ |
| rounded | `any` | - | `true` | roundedプロパティ |

**スタイル情報**:
- レスポンシブ対応: ✗
- ダークモード対応: ✗
- 使用クラス: `bg-white`, `border-gray-200`, `p-4`, `p-6`, `p-8`, `rounded-lg`, `shadow-sm`

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

1. コンポーネント構成: Atoms(1), Molecules(1), Organisms(0), Templates(0), Pages(0)。Atomic Designの原則に従ってコンポーネントを構築してください。

2. アクセシビリティ: インタラクティブな要素には適切なfocus状態を提供し、キーボードナビゲーションを考慮してください。

3. フォーカススタイル: 一部のインタラクティブコンポーネントにfocus状態が定義されていません。全てのインタラクティブ要素にfocus状態を追加してください。

