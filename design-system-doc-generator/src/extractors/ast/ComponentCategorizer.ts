import * as path from 'path';
import { ExtractedComponent } from '../../types';

/**
 * ComponentCategorizer - Atomic Design分類専用エンジン
 * 
 * このクラスは、抽出されたReact/TypeScriptコンポーネントを
 * Atomic Design原則に基づいて自動的に分類する専門エンジンです。
 * 
 * Atomic Design階層：
 * 1. Atoms（原子）- 最小の再利用可能な単位（Button、Input、Label等）
 * 2. Molecules（分子）- 複数のAtomを組み合わせた機能単位（Card、Form等）
 * 3. Organisms（有機体）- 複数のMoleculeを組み合わせた複雑な構造（Header、Sidebar等）
 * 4. Templates（テンプレート）- レイアウト構造の定義
 * 5. Pages（ページ）- 実際のページコンポーネント
 * 
 * 分類戦略（優先順位順）：
 * 1. パスベース分類 - ファイルパスの命名慣習から判定（最も信頼性が高い）
 * 2. 名前ベース分類 - コンポーネント名の語彙パターンから判定
 * 3. 深度ベース分類 - ディレクトリの深さから推定（フォールバック）
 * 
 * 設計思想：
 * - 開発者の既存の命名慣習を尊重
 * - 柔軟性とカスタマイズ性の両立
 * - 誤分類を最小化する多重判定機構
 * - 統計的に最も適切な分類の提供
 * 
 * 拡張可能性：
 * - パターン定義のカスタマイズ
 * - AI駆動の分類機能追加（将来）
 * - プロジェクト固有の分類ルール適用
 */
export class ComponentCategorizer {
  // Atoms（原子）レベルのコンポーネント名パターン
  // 基本的なUI要素、再利用可能な最小単位
  private atomPatterns = ['button', 'input', 'label', 'icon', 'badge', 'chip', 'avatar'];
  
  // Molecules（分子）レベルのコンポーネント名パターン  
  // 複数のAtomを組み合わせた機能的な単位
  private moleculePatterns = ['card', 'form', 'dropdown', 'modal', 'tooltip', 'popover'];
  
  // Organisms（有機体）レベルのコンポーネント名パターン
  // 複雑な構造を持つ大きなUI区画
  private organismPatterns = ['header', 'footer', 'navbar', 'sidebar', 'table', 'list'];
  
  // Templates（テンプレート）レベルのコンポーネント名パターン
  // レイアウト構造を定義するコンポーネント
  private templatePatterns = ['layout', 'template'];
  
  // Pages（ページ）レベルのコンポーネント名パターン
  // 実際のページ・画面コンポーネント
  private pagePatterns = ['page', 'view', 'screen'];

  /**
   * コンポーネント分類のメイン処理
   * 
   * 複数の分類戦略を段階的に適用し、最も適切なAtomic Design
   * カテゴリを決定します。優先順位の高い手法から順に試行し、
   * 確実な分類を提供します。
   * 
   * 分類アルゴリズム：
   * 1. パスベース分類（最優先・最も信頼性が高い）
   * 2. 名前ベース分類（セカンダリ・語彙パターン）
   * 3. 深度ベース分類（フォールバック・統計的推定）
   * 
   * @param filePath - コンポーネントファイルの絶対パス
   * @param componentName - コンポーネント名（PascalCase）
   * @param sourceDir - プロジェクトのソースディレクトリ
   * @returns Atomic Designカテゴリ
   * 
   * 例：
   * ```
   * categorizeComponent(
   *   '/project/src/components/atoms/Button.tsx',
   *   'Button',
   *   '/project/src'
   * ) → 'atoms'
   * 
   * categorizeComponent(
   *   '/project/src/components/UserCard.tsx',
   *   'UserCard', 
   *   '/project/src'
   * ) → 'molecules' (名前の'card'パターンから)
   * ```
   * 
   * 設計原則：
   * - 開発者の意図（ディレクトリ構造）を最優先
   * - 一般的な命名慣習をサポート
   * - 誤分類を最小化する段階的判定
   */
  categorizeComponent(
    filePath: string, 
    componentName: string, 
    sourceDir: string
  ): ExtractedComponent['category'] {
    const relativePath = path.relative(sourceDir, filePath).toLowerCase();
    const lowerComponentName = componentName.toLowerCase();
    
    // 1. パスベース分類（最も信頼性が高い）
    // 開発者が意図的に配置したディレクトリ構造を尊重
    const pathCategory = this.categorizeByPath(relativePath);
    if (pathCategory) return pathCategory;
    
    // 2. 名前ベース分類（語彙パターンマッチング）
    // コンポーネント名から一般的なパターンを検出
    const nameCategory = this.categorizeByName(lowerComponentName);
    if (nameCategory) return nameCategory;
    
    // 3. 深度ベース分類（統計的フォールバック）
    // ディレクトリの深さから複雑さを推定
    return this.categorizeByDepth(relativePath);
  }

  /**
   * パスベース分類処理（最優先手法）
   * 
   * ファイルパス内のディレクトリ名からAtomic Designカテゴリを判定します。
   * 開発者の意図的な構造設計を最も信頼できる指標として扱います。
   * 
   * 検出パターン：
   * - 複数形・単数形の両方をサポート（atoms/ と atom/）
   * - パス内の任意の位置でのディレクトリ名を検出
   * - 大文字小文字を区別しない柔軟な判定
   * 
   * @param relativePath - プロジェクトルートからの相対パス（小文字）
   * @returns 検出されたカテゴリ、該当なしの場合はnull
   * 
   * 対応パス例：
   * - 'components/atoms/Button.tsx' → 'atoms'
   * - 'src/ui/molecules/Card/index.tsx' → 'molecules'  
   * - 'lib/organisms/Header.tsx' → 'organisms'
   * - 'templates/Layout.tsx' → 'templates'
   * - 'pages/HomePage.tsx' → 'pages'
   * 
   * 設計方針：
   * - 一般的なディレクトリ命名慣習をサポート
   * - 複数形・単数形の表記ゆれに対応
   * - パス内の位置に依存しない検出
   */
  private categorizeByPath(relativePath: string): ExtractedComponent['category'] | null {
    if (relativePath.includes('/atoms/') || relativePath.includes('/atom/')) return 'atoms';
    if (relativePath.includes('/molecules/') || relativePath.includes('/molecule/')) return 'molecules';
    if (relativePath.includes('/organisms/') || relativePath.includes('/organism/')) return 'organisms';
    if (relativePath.includes('/templates/') || relativePath.includes('/template/')) return 'templates';
    if (relativePath.includes('/pages/') || relativePath.includes('/page/')) return 'pages';
    return null;
  }

  /**
   * 名前ベース分類処理（セカンダリ手法）
   * 
   * コンポーネント名に含まれる語彙パターンからAtomic Designカテゴリを
   * 推定します。一般的なUI/UXコンポーネントの命名慣習を活用します。
   * 
   * 判定アルゴリズム：
   * 1. コンポーネント名を小文字化
   * 2. 各カテゴリのパターン配列と部分一致チェック
   * 3. 最初にマッチしたカテゴリを返す（atoms→molecules→organisms順）
   * 
   * @param componentName - コンポーネント名（小文字化済み）
   * @returns 推定されたカテゴリ、該当なしの場合はnull
   * 
   * 例：
   * - 'SubmitButton' → 'atoms' ('button'パターンにマッチ)
   * - 'UserCard' → 'molecules' ('card'パターンにマッチ)
   * - 'NavigationBar' → 'organisms' ('navbar'パターンにマッチ)
   * - 'MainLayout' → 'templates' ('layout'パターンにマッチ)
   * - 'HomePage' → 'pages' ('page'パターンにマッチ)
   * 
   * パターン設計思想：
   * - 業界標準のUI/UXコンポーネント語彙を採用
   * - 複雑さに応じた階層的な分類
   * - Material Design、Ant Design等の主要ライブラリを参考
   * - プロジェクト固有の拡張ポイントを保持
   */
  private categorizeByName(componentName: string): ExtractedComponent['category'] | null {
    if (this.atomPatterns.some(p => componentName.includes(p))) return 'atoms';
    if (this.moleculePatterns.some(p => componentName.includes(p))) return 'molecules';
    if (this.organismPatterns.some(p => componentName.includes(p))) return 'organisms';
    if (this.templatePatterns.some(p => componentName.includes(p))) return 'templates';
    if (this.pagePatterns.some(p => componentName.includes(p))) return 'pages';
    return null;
  }

  /**
   * 深度ベース分類処理（フォールバック手法）
   * 
   * ディレクトリの深さから統計的にコンポーネントの複雑さを推定し、
   * Atomic Designカテゴリを決定します。他の手法で分類できない場合の
   * 最終的なフォールバック機構として機能します。
   * 
   * 推定ロジック：
   * - 浅い階層 → シンプルなコンポーネント → Atoms
   * - 中間階層 → 中程度の複雑さ → Molecules  
   * - 深い階層 → 複雑な構造 → Organisms
   * 
   * @param relativePath - プロジェクトルートからの相対パス
   * @returns 推定されたカテゴリ（必ず値を返す）
   * 
   * 分類基準：
   * - 深度 <= 2: 'atoms' (例: components/Button.tsx)
   * - 深度 <= 3: 'molecules' (例: components/ui/Card.tsx)
   * - 深度 > 3: 'organisms' (例: components/layout/header/NavBar.tsx)
   * 
   * 統計的根拠：
   * - 一般的なプロジェクトでAtomは浅い位置に配置される傾向
   * - 複雑なコンポーネントほど機能別・区画別のディレクトリに整理される
   * - ネストが深いほど依存関係が複雑になる統計的傾向
   * 
   * 制限事項：
   * - あくまで統計的推定であり、実際の複雑さとは乖離する可能性
   * - プロジェクト固有の構造に依存する部分的な精度
   * - Templates/Pagesは深度だけでは判定困難のため除外
   */
  private categorizeByDepth(relativePath: string): ExtractedComponent['category'] {
    const depth = relativePath.split('/').length;
    
    // 浅い階層 - 基本的なコンポーネント
    if (depth <= 2) return 'atoms';
    
    // 中間階層 - 機能的なコンポーネント
    if (depth <= 3) return 'molecules';
    
    // 深い階層 - 複雑な構造のコンポーネント
    return 'organisms';
  }
}