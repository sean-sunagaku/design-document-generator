/**
 * TailwindClassExtractor - Tailwind CSSクラス抽出専用クラス
 * 
 * このクラスは、React/TypeScriptコンポーネントのASTノードから
 * Tailwind CSSクラスを精密に検出・抽出する専門エクストラクターです。
 * 
 * 主な責務:
 * - 包括的なTailwindパターンマッチング
 * - 複数のクラス指定形式への対応（文字列、テンプレートリテラル、関数呼び出し）
 * - クラスユーティリティ関数のサポート（clsx, classnames, cn, twMerge）
 * - カスタムクラスとTailwindクラスの区別
 * - 無効なクラス名のフィルタリング
 * 
 * 対応するTailwindカテゴリ:
 * - Spacing & Layout: p-, m-, w-, h-, flex, grid, position
 * - Colors & Backgrounds: bg-, text-, border-, ring-, shadow-
 * - Typography: font-, text-, leading-, tracking-, align-
 * - Borders & Effects: border-, rounded-, ring-, shadow-, opacity-, blur-
 * - Animations & Transitions: animate-, transition-, duration-, transform-
 * - States & Responsive: hover:, focus:, dark:, sm:, md:, lg:, xl:, 2xl:
 * - Interactive: cursor-, select-, resize-, appearance-
 * - Layout Utilities: float-, clear-, object-, overflow-, z-
 * 
 * 抽出対応形式:
 * - 静的文字列: className="bg-blue-500 text-white"
 * - テンプレートリテラル: className={`bg-${color}-500`}
 * - クラスユーティリティ: className={clsx('bg-red-500', isActive && 'ring-2')}
 * - オブジェクト構文: clsx({ 'bg-green-500': isSuccess })
 * - 配列構文: classnames(['bg-blue-500', 'text-white'])
 * 
 * パフォーマンス最適化:
 * - 正規表現ベースの高速マッチング
 * - Setを使用した重複除去
 * - ソート済み結果の返却
 * 
 * 使用例:
 * const extractor = new TailwindClassExtractor();
 * const classes = extractor.extractClasses(astNode);
 * // => ['bg-blue-500', 'text-white', 'hover:bg-blue-600']
 * 
 * 他クラスとの関係:
 * - TailwindExtractor: メインオーケストレーターがこのクラスを使用
 * - ASTTraverser: AST走査中のonClassNameコールバックで呼び出される
 * - ComponentDocumentGenerator: 抽出されたクラスをドキュメント化で使用
 */
export class TailwindClassExtractor {
  private tailwindPatterns: RegExp[];  // Tailwindクラス識別用正規表現パターン配列

  /**
   * TailwindClassExtractorの初期化
   * 
   * 包括的なTailwind CSSパターンをプリコンパイルし、
   * 高速なクラス識別を可能にします。
   */
  constructor() {
    // Tailwind CSSパターンの初期化（カテゴリ別に整理）
    this.tailwindPatterns = [
      // Spacing and Layout - 余白、サイズ、レイアウト関連
      /^(p|pl|pr|pt|pb|px|py|m|ml|mr|mt|mb|mx|my)-/,           // padding, margin
      /^(w|h|min-w|min-h|max-w|max-h)-/,                        // width, height
      /^(flex|grid|absolute|relative|fixed|sticky)/,            // position, display
      /^(block|inline|inline-block|inline-flex|table|grid|hidden)$/,
      /^(justify|items|content|self)-/,                         // flexbox/grid alignment
      /^(space|gap|col|row)-/,                                  // spacing, grid
      /^(inset|top|right|bottom|left)-/,                        // positioning
      
      // Colors and Backgrounds - 色、背景関連
      /^(bg|text|border|ring|shadow|fill|stroke)-/,             // 基本色指定
      /^(placeholder|caret|accent|decoration)-/,                 // 特殊色指定
      
      // Typography - タイポグラフィ関連
      /^(font|text|leading|tracking|align|decoration|whitespace|break|list)-/, // フォント、テキスト
      
      // Borders and Effects - 枠線、エフェクト関連
      /^(border|rounded|ring|shadow|outline)-/,                 // 枠線、影、アウトライン
      /^(opacity|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia|backdrop)-/, // フィルターエフェクト
      
      // Animations and Transitions - アニメーション関連
      /^(animate|transition|duration|delay|ease)-/,             // アニメーション、トランジション
      /^(transform|scale|rotate|translate|skew|origin)-/,        // CSS Transform
      
      // States and Responsive - 状態、レスポンシブ関連
      /^(hover|focus|active|disabled|dark|group-hover|group-focus|peer|visited|target|first|last|odd|even):/, // 擬似クラス
      /^(sm|md|lg|xl|2xl):/,                                    // ブレークポイント
      
      // Interactive - インタラクティブ関連
      /^(cursor|select|resize|appearance|pointer-events|user-select)-/, // ユーザー操作
      
      // Layout Utilities - その他レイアウト関連
      /^(float|clear|object|overflow|overscroll|scroll)-/,      // フロー、オーバーフロー
      /^(z)-/,                                                  // z-index
      
      // Special Cases - 単体で機能するクラス
      /^(flex|grid|table|block|inline|hidden|sr-only|not-sr-only|visible|invisible|static|fixed|absolute|relative|sticky|truncate|antialiased|subpixel-antialiased|italic|not-italic|uppercase|lowercase|capitalize|normal-case|underline|line-through|no-underline|rounded|rounded-full|border)$/,
    ];
  }

  /**
   * ASTノードからTailwindクラスを抽出するメインメソッド
   * 
   * 指定されたASTノードを解析し、含まれるTailwind CSSクラスを
   * 全て抽出してソート済みの重複なし配列で返します。
   * 
   * @param node 解析対象のASTノード
   * @returns 抽出されたTailwindクラスのソート済み配列
   */
  extractClasses(node: any): string[] {
    const classes = new Set<string>();  // 重複除去用Set
    this.processClassNode(node, classes);
    return Array.from(classes).sort();  // アルファベット順ソートで返却
  }

  /**
   * クラスノードのタイプ別処理
   * 
   * ASTノードのタイプを判定し、適切な抽出メソッドで処理します。
   * 複数のクラス指定形式に統一的に対応します。
   * 
   * @param node 処理対象のASTノード
   * @param classes 抽出されたクラスを格納するSet
   */
  private processClassNode(node: any, classes: Set<string>): void {
    // 静的文字列リテラル: className="bg-blue-500 text-white"
    if (node.type === 'Literal' && typeof node.value === 'string') {
      this.parseClassString(node.value, classes);
    }
    
    // テンプレートリテラル: className={`bg-${color}-500`}
    else if (node.type === 'TemplateLiteral') {
      // テンプレートの静的部分（quasis）からクラスを抽出
      node.quasis.forEach((quasi: any) => {
        this.parseClassString(quasi.value.raw, classes);
      });
    }
    
    // JSX式コンテナ内の関数呼び出し: {clsx('bg-red-500', isActive && 'ring-2')}
    else if (node.type === 'JSXExpressionContainer' && node.expression.type === 'CallExpression') {
      this.extractFromClassUtil(node.expression, classes);
    }
  }

  /**
   * クラスユーティリティ関数からクラスを抽出
   * 
   * clsx, classnames, cn, twMerge等のライブラリ関数呼び出しから
   * クラスを抽出します。複数の引数形式に対応しています。
   * 
   * 対応引数形式:
   * - 文字列: clsx('bg-red-500', 'text-white')
   * - オブジェクト: clsx({ 'bg-green-500': isSuccess })
   * - 配列: classnames(['bg-blue-500', 'text-white'])
   * 
   * @param node 関数呼び出しのASTノード
   * @param classes 抽出されたクラスを格納するSet
   */
  private extractFromClassUtil(node: any, classes: Set<string>): void {
    const calleeName = this.getCalleeName(node);
    
    // サポートされたクラスユーティリティ関数のチェック
    if (['clsx', 'classnames', 'cn', 'twMerge'].includes(calleeName)) {
      node.arguments.forEach((arg: any) => {
        // 文字列引数: 'bg-red-500'
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
          this.parseClassString(arg.value, classes);
        } 
        // オブジェクト引数: { 'bg-red-500': isError }
        else if (arg.type === 'ObjectExpression') {
          arg.properties.forEach((prop: any) => {
            if (prop.type === 'Property' && prop.key.type === 'Literal') {
              this.parseClassString(prop.key.value, classes);
            }
          });
        } 
        // 配列引数: ['bg-blue-500', 'text-white']
        else if (arg.type === 'ArrayExpression') {
          arg.elements.forEach((elem: any) => {
            if (elem?.type === 'Literal' && typeof elem.value === 'string') {
              this.parseClassString(elem.value, classes);
            }
          });
        }
      });
    }
  }

  /**
   * 関数呼び出しから関数名を抽出
   * 
   * 異なる関数呼び出し形式から統一的に関数名を取得します。
   * 
   * 対応形式:
   * - 直接呼び出し: clsx(...)
   * - メンバーアクセス: utils.clsx(...)
   * 
   * @param node 関数呼び出しのASTノード
   * @returns 関数名（取得できない場合は空文字列）
   */
  private getCalleeName(node: any): string {
    if (node.callee.type === 'Identifier') {
      // 直接呼び出し: clsx, classnames, cn, twMerge
      return node.callee.name;
    } else if (node.callee.type === 'MemberExpression' && 
               node.callee.property.type === 'Identifier') {
      // メンバーアクセス: utils.clsx, lib.classnames
      return node.callee.property.name;
    }
    return '';  // 識別不可な形式
  }

  /**
   * クラス文字列をパースしてTailwindクラスを抽出
   * 
   * スペース区切りのクラス文字列を個別のクラスに分割し、
   * 各クラスがTailwindクラスかどうかを判定して結果に追加します。
   * 
   * @param classString パース対象のクラス文字列
   * @param classes 抽出されたクラスを格納するSet
   */
  private parseClassString(classString: string, classes: Set<string>): void {
    // スペースで分割し、空文字列を除外
    const classList = classString.split(/\s+/).filter(Boolean);
    classList.forEach(cls => {
      if (this.isTailwindClass(cls)) {
        classes.add(cls);  // 重複を自動除外するSetに追加
      }
    });
  }

  /**
   * クラス名がTailwind CSSクラスかどうかを判定
   * 
   * 包括的なパターンマッチングとカスタムクラスのフィルタリングにより、
   * 正確なTailwindクラスを識別します。パフォーマンスを重視した
   * 正規表現ベースの高速マッチングを実装しています。
   * 
   * 判定フロー:
   * 1. 基本的な有効性チェック（空文字、不正な形式）
   * 2. カスタムクラスパターンの除外
   * 3. Tailwindパターンとのマッチング
   * 
   * 除外されるカスタムパターン:
   * - custom-* : カスタムプレフィックス
   * - *component* : コンポーネント関連クラス
   * - my-* (非Tailwind) : 独自のmy-プレフィックス
   * - word-word-word : 3単語ハイフン接続パターン
   * 
   * @param className 判定対象のクラス名
   * @returns Tailwindクラスの場合true
   */
  isTailwindClass(className: string): boolean {
    // 1. 基本的な有効性チェック
    if (!className || !className.trim()) {
      return false;
    }

    // 2. カスタムクラスパターンの除外
    const customPatterns = [
      /^custom-/,                        // custom-prefixパターン
      /component/,                       // componentを含むクラス
      /^my-(?!\d)/,                     // my-prefixではあるが数値ではない（my-1, my-2等はTailwindの正当なクラス）
      /^[a-z]+-[a-z]+-[a-z]+$/         // 3単語以上のハイフン接続（一般的でないパターン）
    ];

    if (customPatterns.some(pattern => pattern.test(className))) {
      return false;
    }

    // 3. 不正な形式のチェック（ハイフンで始まる・終わる）
    if (className.endsWith('-') || className.startsWith('-')) {
      return false;
    }

    // 4. Tailwindパターンとのマッチング
    // いずれかのパターンにマッチした場合はTailwindクラスと判定
    return this.tailwindPatterns.some(pattern => pattern.test(className));
  }
}