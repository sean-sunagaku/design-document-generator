import { ExtractedComponent, ExtractorConfig, PropInfo, JSXElement, StyleInfo } from '../types';
import { generateHash } from '../utils/hash';
import { ComponentAnalyzer } from './ast/ComponentAnalyzer';
import { ASTTraverser } from './ast/ASTTraverser';
import { TailwindClassExtractor } from './ast/TailwindClassExtractor';
import { PropExtractor } from './ast/PropExtractor';
import { JSXStructureExtractor } from './ast/JSXStructureExtractor';
import { ComponentCategorizer } from './ast/ComponentCategorizer';
import { StyleExtractorFactory } from './StyleExtractorFactory';
import { ConfigManager } from '../config/ConfigManager';

/**
 * TailwindExtractor - メインオーケストレーター
 * 
 * このクラスは、React/TypeScriptコンポーネントからデザインシステム情報を抽出する
 * 中核的なオーケストレーターです。複数の専門化されたエクストラクターを組み合わせて
 * 包括的なコンポーネント分析を実行します。
 * 
 * 主な責務:
 * - AST解析によるコンポーネント情報の抽出
 * - Tailwind CSS / React Native StyleSheetの検出・抽出
 * - TypeScript Props情報の解析
 * - JSX構造の抽出とドキュメント化
 * - Atomic Designによるコンポーネント分類
 * - マルチプラットフォーム対応（Web, React Native）
 * 
 * アーキテクチャパターン:
 * - Composite Pattern: 複数のエクストラクターを組み合わせ
 * - Strategy Pattern: プラットフォーム・スタイルシステム毎の戦略選択
 * - Factory Pattern: StyleExtractorFactoryを通じた適切なエクストラクター生成
 * 
 * 使用例:
 * const extractor = new TailwindExtractor(config);
 * const component = await extractor.extractFromFile('./Button.tsx');
 * 
 * 他クラスとの関係:
 * - ComponentAnalyzer: ファイル解析とAST生成
 * - StyleExtractorFactory: プラットフォーム固有スタイル抽出
 * - ASTTraverser: AST走査とコールバック実行
 * - TailwindClassExtractor: Tailwindクラス抽出
 * - ComponentCategorizer: Atomic Design分類
 */

export class TailwindExtractor {
  private config: ExtractorConfig;                       // 抽出設定
  private componentAnalyzer: ComponentAnalyzer;          // ファイル・コンポーネント解析器
  private astTraverser: ASTTraverser;                    // AST走査器
  private tailwindExtractor: TailwindClassExtractor;     // Tailwindクラス抽出器
  private propExtractor: PropExtractor;                  // Props抽出器
  private jsxExtractor: JSXStructureExtractor;           // JSX構造抽出器
  private categorizer: ComponentCategorizer;             // コンポーネント分類器
  private styleExtractor: any;                           // プラットフォーム固有スタイル抽出器

  /**
   * TailwindExtractorの初期化
   * 
   * 依存する全てのエクストラクターを初期化し、ConfigManagerから
   * プラットフォーム・スタイルシステム設定を取得して適切な
   * StyleExtractorを生成します。
   * 
   * @param config 抽出設定
   */
  constructor(config: ExtractorConfig) {
    this.config = config;
    
    // 各専門エクストラクターの初期化
    this.componentAnalyzer = new ComponentAnalyzer();
    this.astTraverser = new ASTTraverser();
    this.tailwindExtractor = new TailwindClassExtractor();
    this.propExtractor = new PropExtractor();
    this.jsxExtractor = new JSXStructureExtractor();
    this.categorizer = new ComponentCategorizer();
    
    // ConfigManagerから現在のスタイルシステム設定を取得
    const configManager = ConfigManager.getInstance();
    const appConfig = configManager.getConfig();
    const styleSystem = appConfig.styleSystem || 'tailwind';
    
    // ファクトリーパターンでプラットフォーム固有のスタイル抽出器を生成
    this.styleExtractor = StyleExtractorFactory.createExtractor(styleSystem, config);
  }

  /**
   * ファイルからコンポーネント情報を抽出するメインメソッド
   * 
   * 指定されたファイルを解析し、包括的なコンポーネント情報を抽出します。
   * 複数のエクストラクターを協調させ、Reactコンポーネントの全側面を
   * 構造化されたデータとして返します。
   * 
   * 処理フロー:
   * 1. ファイル解析とAST生成（ComponentAnalyzer）
   * 2. AST走査による情報収集（ASTTraverser + 各エクストラクター）
   * 3. コンポーネント分類（ComponentCategorizer）
   * 4. スタイル情報統合（StyleExtractorFactory）
   * 5. 結果の構造化とハッシュ生成
   * 
   * @param filePath 解析対象ファイルのパス
   * @returns 抽出されたコンポーネント情報（コンポーネントでない場合はnull）
   */
  async extractFromFile(filePath: string): Promise<ExtractedComponent | null> {
    try {
      // 1. ファイル解析: コンポーネントファイルかどうかの判定とAST生成
      const { content, ast, componentName, isComponentFile } = 
        await this.componentAnalyzer.analyzeFile(filePath);

      // コンポーネントファイルでない場合は処理を中断
      if (!isComponentFile || !componentName || !ast) {
        return null;
      }

      // 2. データ収集用コンテナの初期化
      const classes = new Set<string>();              // Tailwindクラス収集
      const props: PropInfo[] = [];                   // Props情報収集
      const dependencies = new Set<string>();         // 依存関係収集
      let jsxStructure: JSXElement | undefined;       // JSX構造

      // 3. AST走査による統合的な情報抽出
      // コールバックベースのアーキテクチャで各エクストラクターを協調動作
      this.astTraverser.traverse(ast, {
        // Tailwindクラス発見時のコールバック
        onClassName: (node) => {
          const extractedClasses = this.tailwindExtractor.extractClasses(node);
          extractedClasses.forEach(cls => classes.add(cls));
        },
        // Props発見時のコールバック  
        onProp: (prop) => props.push(prop),
        // インポート発見時のコールバック
        onImport: (dep) => dependencies.add(dep),
        // JSXリターン文発見時のコールバック
        onJSXReturn: (element) => {
          if (!jsxStructure) {
            jsxStructure = element;
          }
        },
      });

      // 4. JSX構造の補完抽出（AST走査で見つからなかった場合）
      if (!jsxStructure) {
        jsxStructure = this.jsxExtractor.extractJSXStructure(ast) || undefined;
      }

      // 5. Atomic Designパターンによるコンポーネント分類
      // ファイルパスとコンポーネント名から自動的にカテゴリを判定
      const category = this.categorizer.categorizeComponent(
        filePath, 
        componentName, 
        this.config.sourceDir
      );

      // 6. プラットフォーム固有スタイル抽出
      // StyleExtractorFactoryで生成された適切なエクストラクターを使用
      const extractedStyles = this.extractStylesFromAST(ast);
      console.log(`Component ${componentName} extractedStyles:`, extractedStyles.length, extractedStyles);
      
      // 7. 統合スタイル情報の構築
      // Tailwindクラスとプラットフォーム固有スタイル（StyleSheet等）を統合
      const styleInfo: StyleInfo = this.buildStyleInfo(extractedStyles, Array.from(classes));
      console.log(`Component ${componentName} styleInfo:`, styleInfo);

      // 8. ExtractedComponentオブジェクトの構築と返却
      return {
        filePath,                                    // ファイルパス
        componentName,                               // コンポーネント名
        category,                                    // Atomic Designカテゴリ
        tailwindClasses: Array.from(classes).sort(), // ソート済みTailwindクラス
        props,                                       // Props情報
        dependencies: Array.from(dependencies),     // 依存関係
        hash: generateHash(content),                 // コンテンツハッシュ（変更検出用）
        jsxStructure,                               // JSX構造
        platform: 'web',                           // プラットフォーム（TODO: 動的設定対応）
        styleInfo,                                  // 統合スタイル情報
      };
    } catch (error) {
      console.error(`Failed to extract from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * ASTからプラットフォーム固有スタイルを抽出
   * 
   * AST全体を再帰的に走査し、設定されたStyleExtractorを使用して
   * プラットフォーム固有のスタイル情報（React Native StyleSheet等）を抽出します。
   * 
   * @param ast TypeScript ESTree AST
   * @returns 抽出されたスタイル情報の配列
   */
  private extractStylesFromAST(ast: any): any[] {
    const styles: any[] = [];
    
    // AST全体を再帰的に走査してスタイル情報を抽出
    const traverse = (node: any) => {
      if (!node || typeof node !== 'object') return;
      
      // 現在のノードからStyleExtractorを使用してスタイルを抽出
      const extractedStyles = this.styleExtractor.extractStyles(node);
      styles.push(...extractedStyles);
      
      // 子ノードの再帰的走査
      if (Array.isArray(node)) {
        node.forEach(traverse);
      } else {
        Object.values(node).forEach(value => {
          if (typeof value === 'object') {
            traverse(value);
          }
        });
      }
    };
    
    traverse(ast);
    return styles;
  }

  /**
   * レスポンシブクラスの検出
   * 
   * Tailwindのブレークポイントプレフィックス（sm:, md:, lg:, xl:, 2xl:）を
   * 使用したクラスが含まれているかを判定します。
   * 
   * @param classes Tailwindクラスの配列
   * @returns レスポンシブクラスが含まれている場合true
   */
  private hasResponsiveClasses(classes: string[]): boolean {
    return classes.some(cls => /^(sm:|md:|lg:|xl:|2xl:)/.test(cls));
  }

  /**
   * ダークモードクラスの検出
   * 
   * Tailwindのダークモードプレフィックス（dark:）を使用した
   * クラスが含まれているかを判定します。
   * 
   * @param classes Tailwindクラスの配列
   * @returns ダークモードクラスが含まれている場合true
   */
  private hasDarkModeClasses(classes: string[]): boolean {
    return classes.some(cls => cls.startsWith('dark:'));
  }

  /**
   * アニメーション関連クラスの抽出
   * 
   * Tailwindのアニメーション、トランジション関連のクラスを
   * フィルタリングして抽出します。
   * 
   * @param classes Tailwindクラスの配列
   * @returns アニメーション関連クラスの配列
   */
  private extractAnimations(classes: string[]): string[] {
    return classes.filter(cls => 
      cls.startsWith('animate-') || 
      cls.startsWith('transition-') ||
      cls.includes('duration-') ||
      cls.includes('ease-')
    );
  }

  /**
   * 統合スタイル情報の構築
   * 
   * プラットフォーム固有スタイル（StyleSheet等）とTailwindクラスを統合し、
   * 一貫したStyleInfoオブジェクトを構築します。プラットフォームの特性に応じて
   * 適切なスタイル情報形式を選択します。
   * 
   * 優先順位:
   * 1. React Native StyleSheet (React Nativeプラットフォーム時)
   * 2. Tailwind CSS classes (Webプラットフォーム時) 
   * 3. デフォルト空スタイル
   * 
   * @param extractedStyles プラットフォーム固有エクストラクターで抽出されたスタイル
   * @param tailwindClasses TailwindClassExtractorで抽出されたクラス
   * @returns 統合されたスタイル情報
   */
  private buildStyleInfo(extractedStyles: any[], tailwindClasses: string[]): StyleInfo {
    // React Native StyleSheetスタイルの検出と処理
    const hasStyleSheet = extractedStyles.some(style => 
      style.type === 'stylesheet' || style.source?.includes('StyleSheet')
    );
    
    if (hasStyleSheet) {
      // StyleSheetスタイルの統合と構造化
      const stylesheetStyles = extractedStyles
        .filter(style => style.type === 'stylesheet')
        .reduce((acc, style) => {
          if (style.value && typeof style.value === 'object') {
            Object.assign(acc, style.value);
          }
          return acc;
        }, {});
        
      return {
        type: 'stylesheet',
        styles: stylesheetStyles,
        imports: ['StyleSheet'],
        responsive: false,    // React NativeのStyleSheetは基本的に非レスポンシブ
        darkMode: false,     // ダークモードは別途実装が必要
        animations: []       // アニメーションは Animated API等で別途実装
      };
    }
    
    // Tailwind CSSクラスの処理（Webプラットフォーム）
    if (tailwindClasses.length > 0) {
      return {
        type: 'tailwind',
        tailwindClasses: tailwindClasses.sort(),  // アルファベット順ソート
        classes: tailwindClasses.sort(),
        styles: {},                               // Tailwindは外部CSS依存
        imports: [],                              // インライン指定なし
        responsive: this.hasResponsiveClasses(tailwindClasses),
        darkMode: this.hasDarkModeClasses(tailwindClasses),
        animations: this.extractAnimations(tailwindClasses)
      };
    }
    
    // フォールバック: スタイル情報が見つからない場合のデフォルト
    return {
      type: 'stylesheet',
      styles: {},
      imports: [],
      responsive: false,
      darkMode: false,
      animations: []
    };
  }
}