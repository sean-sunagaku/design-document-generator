import { JSXElement } from '../../types';
import { TailwindClassExtractor } from './TailwindClassExtractor';

/**
 * JSXStructureExtractor - JSX構造解析専用クラス
 * 
 * このクラスは、React/TypeScriptコンポーネントのAST（抽象構文木）から
 * JSX要素の構造を詳細に抽出・解析する専門エクストラクターです。
 * 
 * 主な責務：
 * 1. JSX要素の階層構造の抽出
 * 2. JSX属性（Props）の解析
 * 3. className属性からのTailwindクラスの特定
 * 4. 子要素の再帰的な解析
 * 5. 複雑なJSX式（条件分岐、論理演算子等）の処理
 * 
 * 処理対象のJSXパターン：
 * - 基本的なJSX要素: <div>content</div>
 * - JSXフラグメント: <>content</>
 * - 条件付きレンダリング: {condition ? <A /> : <B />}
 * - 論理演算子: {condition && <Component />}
 * - 式コンテナ: {expression}
 * - スプレッド属性: {...props}
 * - ネストした要素の階層構造
 * 
 * アーキテクチャ上の位置：
 * このクラスはASTTraverserによって呼び出され、他のエクストラクター
 * （TailwindClassExtractor）と連携してJSX構造とスタイル情報を
 * 統合的に抽出します。
 */
export class JSXStructureExtractor {
  private tailwindExtractor: TailwindClassExtractor;

  /**
   * JSXStructureExtractorのコンストラクタ
   * 
   * TailwindClassExtractorのインスタンスを初期化し、
   * className属性の解析でTailwindクラスの判定を行えるようにします。
   */
  constructor() {
    this.tailwindExtractor = new TailwindClassExtractor();
  }

  /**
   * JSX構造の抽出メイン処理
   * 
   * ReactコンポーネントのAST全体から、return文を探し出し、
   * 返されるJSX要素の構造を解析して構造化データとして抽出します。
   * 
   * 処理フロー：
   * 1. AST内のreturn文を検索
   * 2. return文の引数がJSX要素かどうか確認
   * 3. JSXノードの詳細構造を再帰的に解析
   * 
   * @param ast - TypeScript ASTのルートノード
   * @returns 抽出されたJSX構造、見つからない場合はnull
   * 
   * 例：
   * ```tsx
   * function Button() {
   *   return <button className="bg-blue-500">Click</button>;
   * }
   * ```
   * → { type: 'button', props: {}, className: 'bg-blue-500', children: ['Click'] }
   */
  extractJSXStructure(ast: any): JSXElement | null {
    const returnStatement = this.findReturnStatement(ast);
    if (!returnStatement || !returnStatement.argument) {
      return null;
    }

    return this.processJSXNode(returnStatement.argument);
  }

  /**
   * AST内のreturn文検索処理
   * 
   * AST全体を再帰的に走査し、JSX要素を返すreturn文を特定します。
   * 複雑なコンポーネント（ネストした関数、条件分岐等）でも
   * 確実にJSXを返すreturn文を発見できます。
   * 
   * 検索戦略：
   * 1. 現在のノードがReturnStatementかチェック
   * 2. return文の引数がJSX要素かチェック
   * 3. 子ノードを再帰的に検索（深度優先探索）
   * 4. 親ノードへの循環参照を回避
   * 
   * @param node - 検索対象のASTノード
   * @returns JSXを返すreturn文のノード、見つからない場合はnull
   * 
   * 対応パターン：
   * - function Component() { return <div />; }
   * - const Component = () => { return <div />; };
   * - 条件分岐内のreturn文
   * - ネストした関数内のreturn文
   */
  private findReturnStatement(node: any): any {
    if (!node || typeof node !== 'object') return null;

    if (node.type === 'ReturnStatement' && this.isJSXElement(node.argument)) {
      return node;
    }

    // AST全体を再帰的に検索
    // 'parent'プロパティは循環参照になるため除外
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            const result = this.findReturnStatement(child);
            if (result) return result;
          }
        } else if (typeof node[key] === 'object') {
          const result = this.findReturnStatement(node[key]);
          if (result) return result;
        }
      }
    }

    return null;
  }

  /**
   * JSXノードの詳細処理メイン関数
   * 
   * 様々なタイプのJSXノードを適切に処理し、統一された
   * JSXElement構造体として変換します。React/JSXの複雑な
   * 構文パターンを包括的にサポートします。
   * 
   * 処理対象ノードタイプ：
   * - JSXExpressionContainer: {expression}
   * - ConditionalExpression: condition ? A : B
   * - LogicalExpression: condition && Component
   * - JSXFragment: <>...</>
   * - JSXElement: <tag>...</tag>
   * 
   * @param node - 処理対象のJSXノード
   * @returns 構造化されたJSXElement、処理不可の場合はnull
   */
  private processJSXNode(node: any): JSXElement | null {
    if (!node) return null;

    // JSX式コンテナの処理: {expression}
    // 例: {condition && <Component />}
    if (node.type === 'JSXExpressionContainer') {
      return this.processJSXNode(node.expression);
    }

    // 条件式の処理: condition ? consequent : alternate
    // 例: {isVisible ? <Component /> : null}
    // 通常、consequent（true時の値）がメインコンポーネント
    if (node.type === 'ConditionalExpression') {
      return this.processJSXNode(node.consequent);
    }

    // 論理式の処理: left && right
    // 例: {condition && <Component />}
    // right側がレンダリング対象のコンポーネント
    if (node.type === 'LogicalExpression') {
      return this.processJSXNode(node.right);
    }

    // JSXフラグメント処理: <>...</>
    // 複数の子要素をラップするコンテナ
    if (node.type === 'JSXFragment') {
      return {
        type: 'Fragment',
        props: {},
        children: this.extractJSXChildren(node.children),
      };
    }

    // JSX要素処理: <tag attr="value">...</tag>
    // 最も一般的なJSX要素の詳細解析
    if (node.type === 'JSXElement') {
      const element: JSXElement = {
        type: this.getJSXElementType(node.openingElement),
        props: {},
        children: [],
      };

      // 属性の抽出（className、その他のprops）
      const { props, className, tailwindClasses } = this.extractJSXProps(node.openingElement.attributes);
      element.props = props;
      if (className) {
        element.className = className;
        element.tailwindClasses = tailwindClasses;
      }

      // 子要素の再帰的解析
      if (node.children && node.children.length > 0) {
        element.children = this.extractJSXChildren(node.children);
      }

      return element;
    }

    return null;
  }

  /**
   * JSX要素のタイプ名抽出処理
   * 
   * JSX要素の開始タグから要素名を抽出します。
   * 単純な要素名とメンバーアクセス形式の両方に対応します。
   * 
   * 対応パターン：
   * 1. JSXIdentifier: <Button /> → "Button"
   * 2. JSXMemberExpression: <React.Fragment /> → "React.Fragment"
   * 3. ネストしたメンバー: <UI.Button.Primary /> → "UI.Button.Primary"
   * 
   * @param openingElement - JSX開始タグのASTノード
   * @returns 要素のタイプ名（文字列）
   * 
   * 例：
   * - <div> → "div"
   * - <Button> → "Button"
   * - <React.Fragment> → "React.Fragment"
   * - <MaterialUI.Button.Contained> → "MaterialUI.Button.Contained"
   */
  private getJSXElementType(openingElement: any): string {
    // 単純な識別子の場合（最も一般的）
    if (openingElement.name.type === 'JSXIdentifier') {
      return openingElement.name.name;
    } 
    // メンバーアクセス式の場合（React.Fragment、UI.Button等）
    else if (openingElement.name.type === 'JSXMemberExpression') {
      const parts = [];
      let current = openingElement.name;
      
      // ネストしたメンバーアクセスを再帰的に解析
      while (current.type === 'JSXMemberExpression') {
        parts.unshift(current.property.name);
        current = current.object;
      }
      
      // 最上位の識別子を追加
      if (current.type === 'JSXIdentifier') {
        parts.unshift(current.name);
      }
      
      return parts.join('.');
    }
    
    return 'Unknown';
  }

  /**
   * JSX属性（Props）の詳細抽出処理
   * 
   * JSX要素の全属性を解析し、Props情報を構造化データとして抽出します。
   * 特にclassName属性については、Tailwindクラスの特定まで行います。
   * 
   * 処理対象：
   * 1. 通常の属性: <div prop="value" />
   * 2. className属性: <div className="bg-blue-500 text-white" />
   * 3. 式の属性: <div prop={expression} />
   * 4. スプレッド属性: <div {...props} />
   * 5. ブール属性: <input disabled />
   * 
   * @param attributes - JSX属性のASTノード配列
   * @returns 抽出されたProps情報とTailwindクラス
   * 
   * 戻り値の構造：
   * - props: 通常のProps（className以外）
   * - className: className属性の値
   * - tailwindClasses: className内のTailwindクラス配列
   */
  private extractJSXProps(attributes: any[]): { 
    props: Record<string, any>, 
    className?: string, 
    tailwindClasses?: string[] 
  } {
    const props: Record<string, any> = {};
    let className: string | undefined;
    let tailwindClasses: string[] = [];

    if (!attributes) return { props };

    attributes.forEach((attr: any) => {
      // 通常の属性処理: prop="value" や prop={expression}
      if (attr.type === 'JSXAttribute') {
        const propName = attr.name.name;
        
        // className属性の特別処理
        if (propName === 'className') {
          const classValue = this.extractAttributeValue(attr.value);
          if (typeof classValue === 'string') {
            className = classValue;
            // スペース区切りでクラスを分離し、Tailwindクラスのみフィルタ
            tailwindClasses = classValue.split(/\s+/)
              .filter(cls => this.tailwindExtractor.isTailwindClass(cls));
          }
        } else {
          // その他の属性
          props[propName] = this.extractAttributeValue(attr.value);
        }
      } 
      // スプレッド属性処理: {...props}
      else if (attr.type === 'JSXSpreadAttribute') {
        props['...spread'] = true;
      }
    });

    return { props, className, tailwindClasses };
  }

  /**
   * JSX属性値の抽出処理
   * 
   * JSX属性の値を様々な形式から適切に抽出します。
   * リテラル値、式、識別子など多様なパターンに対応します。
   * 
   * 処理パターン：
   * 1. ブール属性: <input disabled /> → true
   * 2. 文字列リテラル: prop="text" → "text"
   * 3. 数値リテラル: count={42} → 42
   * 4. 変数参照: value={variable} → "{variable}"
   * 5. 複雑な式: onClick={() => {}} → "{expression}"
   * 
   * @param value - JSX属性値のASTノード
   * @returns 抽出された属性値
   * 
   * 設計思想：
   * - 静的に解析可能な値は実際の値を返す
   * - 動的な値は文字列表現で構造を保持
   * - ドキュメント生成時の可読性を重視
   */
  private extractAttributeValue(value: any): any {
    // 属性値が省略された場合（ブール属性）
    // 例: <input disabled /> → disabled={true}
    if (!value) return true;
    
    // 文字列・数値等のリテラル値
    // 例: prop="text", count="42"
    if (value.type === 'Literal') {
      return value.value;
    } 
    // JSX式コンテナ: {expression}
    else if (value.type === 'JSXExpressionContainer') {
      // 式内のリテラル値
      // 例: count={42}, flag={true}
      if (value.expression.type === 'Literal') {
        return value.expression.value;
      } 
      // 変数参照
      // 例: value={variable} → "{variable}"
      else if (value.expression.type === 'Identifier') {
        return `{${value.expression.name}}`;
      } 
      // その他の複雑な式
      // 例: onClick={() => {}}, style={{...}} → "{expression}"
      else {
        return '{expression}';
      }
    }
    
    return null;
  }

  /**
   * JSX子要素の再帰的抽出処理
   * 
   * JSX要素内の子要素を再帰的に解析し、テキストノードと
   * 子コンポーネントの混在する構造を適切に処理します。
   * 
   * 処理対象の子要素タイプ：
   * 1. JSXText: プレーンテキスト
   * 2. JSXElement: 子コンポーネント
   * 3. JSXFragment: フラグメント
   * 4. JSXExpressionContainer: 式による動的コンテンツ
   * 
   * @param children - JSX子要素のASTノード配列
   * @returns 処理された子要素配列（テキストまたはJSXElement）
   * 
   * 例：
   * ```tsx
   * <div>
   *   Hello {name}!
   *   <Button>Click</Button>
   *   {items.map(item => <Item key={item.id} />)}
   * </div>
   * ```
   * → ["Hello", "{...}", JSXElement(Button), "{...}"]
   * 
   * フィルタリング：
   * - 空文字列のテキストノードは除外
   * - nullを返す処理できない要素は除外
   * - 意味のあるコンテンツのみ保持
   */
  private extractJSXChildren(children: any[]): (JSXElement | string)[] {
    if (!children) return [];

    return children
      .map((child: any) => {
        // テキストノード処理
        // 例: <div>Hello World</div> の "Hello World"
        if (child.type === 'JSXText') {
          const text = child.value.trim();
          return text || null; // 空文字列は除外
        } 
        // JSX要素・フラグメント処理（再帰）
        // 例: <Button>、<>...</>
        else if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
          return this.processJSXNode(child);
        } 
        // 式コンテナ処理
        // 例: {variable}、{items.map(...)}
        else if (child.type === 'JSXExpressionContainer') {
          return '{...}'; // 動的コンテンツのプレースホルダー
        }
        
        return null;
      })
      .filter((child): child is JSXElement | string => child !== null);
  }

  /**
   * JSX要素判定ユーティリティ
   * 
   * 指定されたASTノードがJSX要素（またはJSXを含む式）かどうかを
   * 再帰的に判定します。複雑なJSX式パターンも正確に検出します。
   * 
   * 判定対象パターン：
   * 1. 直接のJSX要素: <div>, <Button>
   * 2. JSXフラグメント: <>, <React.Fragment>
   * 3. 式コンテナ内のJSX: {<Component />}
   * 4. 条件式のJSX: {condition ? <A /> : <B />}
   * 5. 論理式のJSX: {condition && <Component />}
   * 
   * @param node - 判定対象のASTノード
   * @returns JSX要素または JSXを含む式の場合 true
   * 
   * 使用場面：
   * - return文の検索時にJSXを返すかの判定
   * - 式の中にJSXが含まれるかの判定
   * - 動的レンダリングパターンの検出
   * 
   * 再帰処理：
   * 複雑にネストした式（三項演算子の中の論理演算子等）も
   * 再帰的に解析してJSXの存在を確実に検出します。
   */
  private isJSXElement(node: any): boolean {
    return node && (
      // 基本的なJSX要素
      node.type === 'JSXElement' || 
      // JSXフラグメント: <>...</>
      node.type === 'JSXFragment' ||
      // 式コンテナ内のJSX: {<Component />}
      (node.type === 'JSXExpressionContainer' && this.isJSXElement(node.expression)) ||
      // 条件式: condition ? <A /> : <B />
      // consequent（true時）またはalternate（false時）のいずれかがJSX
      (node.type === 'ConditionalExpression' && 
        (this.isJSXElement(node.consequent) || this.isJSXElement(node.alternate))) ||
      // 論理式: condition && <Component />
      // right側（演算子の右側）がJSX
      (node.type === 'LogicalExpression' && this.isJSXElement(node.right))
    );
  }
}