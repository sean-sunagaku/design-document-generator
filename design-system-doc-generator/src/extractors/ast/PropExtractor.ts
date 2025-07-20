import { PropInfo } from '../../types';

/**
 * PropExtractor - TypeScript Props抽出専用クラス
 * 
 * このクラスは、React/TypeScriptコンポーネントのAST（抽象構文木）から
 * コンポーネントのProps（プロパティ）情報を詳細に抽出・解析する専門エクストラクターです。
 * 
 * 主な責務：
 * 1. 関数コンポーネントのパラメータからProps情報を抽出
 * 2. デストラクチャリング（分割代入）パターンの解析
 * 3. Props の型推論（基本的な型情報）
 * 4. デフォルト値の検出と抽出
 * 5. 必須・オプションProps の判定
 * 
 * 対応するReactコンポーネントパターン：
 * - 関数コンポーネント: function Component(props) {}
 * - アロー関数コンポーネント: const Component = (props) => {}
 * - デストラクチャリング: const Component = ({ prop1, prop2 }) => {}
 * - デフォルト値: const Component = ({ prop = 'default' }) => {}
 * - TypeScript型注釈: const Component = ({ prop }: { prop: string }) => {}
 * 
 * アーキテクチャ上の位置：
 * このクラスはASTTraverserによって呼び出され、ComponentAnalyzerと
 * 連携してコンポーネントの完全な情報（構造+Props）を構築します。
 * 
 * 制限事項：
 * - 現在はJavaScript レベルの基本的な型推論のみサポート
 * - TypeScript型システムとの完全統合は将来の拡張ポイント
 * - 複雑な型（Union型、Generic型等）は 'any' として扱う
 */
export class PropExtractor {
  /**
   * Props抽出のメイン処理
   * 
   * コンポーネントのAST全体を走査し、関数コンポーネントの
   * パラメータからProps情報を抽出します。
   * 
   * 処理フロー：
   * 1. AST全体の再帰的走査
   * 2. 関数コンポーネントの特定
   * 3. パラメータからのProps情報抽出
   * 4. 型推論とデフォルト値解析
   * 
   * @param ast - TypeScript ASTのルートノード
   * @returns 抽出されたProps情報の配列
   * 
   * 例：
   * ```tsx
   * const Button = ({ 
   *   children, 
   *   variant = 'primary', 
   *   disabled = false 
   * }) => { ... }
   * ```
   * → [
   *   { name: 'children', type: 'any', required: true },
   *   { name: 'variant', type: 'string', required: false, defaultValue: 'primary' },
   *   { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' }
   * ]
   */
  extractProps(ast: any): PropInfo[] {
    const props: PropInfo[] = [];
    this.visit(ast, props);
    return props;
  }

  /**
   * AST再帰走査処理
   * 
   * AST全体を深度優先で走査し、関数コンポーネントを発見した際に
   * Props抽出処理を実行します。複雑にネストしたコンポーネント構造でも
   * 確実に全ての関数コンポーネントを発見できます。
   * 
   * 走査戦略：
   * 1. 現在のノードが関数コンポーネントかチェック
   * 2. 関数コンポーネントの場合はProps抽出実行
   * 3. 全ての子ノードを再帰的に走査
   * 4. 循環参照回避（parentプロパティをスキップ）
   * 
   * @param node - 現在処理中のASTノード
   * @param props - Props情報を蓄積する配列（参照渡し）
   * 
   * 対象となる関数タイプ：
   * - FunctionDeclaration: function Component() {}
   * - ArrowFunctionExpression: const Component = () => {}
   * - 変数宣言内のアロー関数
   * - ネストした関数定義
   */
  private visit(node: any, props: PropInfo[]): void {
    if (!node || typeof node !== 'object') return;

    // 関数コンポーネントからのProps抽出
    // React関数コンポーネントの典型的な定義パターンを検出
    if (node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
      this.extractPropsFromFunction(node, props);
    }

    // AST全体の再帰的走査
    // 'parent'プロパティは循環参照を引き起こすため除外
    for (const key in node) {
      if (key !== 'parent' && node[key]) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => this.visit(child, props));
        } else if (typeof node[key] === 'object') {
          this.visit(node[key], props);
        }
      }
    }
  }

  /**
   * 関数コンポーネントからのProps抽出処理
   * 
   * 関数コンポーネントの第一パラメータを解析し、デストラクチャリング
   * パターンからProps情報を詳細に抽出します。現代的なReactの
   * 関数コンポーネントの記述パターンに完全対応します。
   * 
   * 解析対象パターン：
   * 1. 基本のデストラクチャリング: ({ prop1, prop2 }) => {}
   * 2. デフォルト値付き: ({ prop = 'default' }) => {}
   * 3. ネストしたデストラクチャリング: ({ user: { name } }) => {}
   * 4. レストパラメータ: ({ prop, ...rest }) => {}
   * 
   * @param node - 関数ノード（FunctionDeclaration | ArrowFunctionExpression）
   * @param props - Props情報を蓄積する配列（参照渡し）
   * 
   * 抽出される情報：
   * - name: Propsの名前
   * - type: 推論された型（基本型のみ）
   * - required: 必須かどうか（デフォルト値の有無で判定）
   * - defaultValue: デフォルト値（存在する場合）
   * 
   * 例：
   * ```tsx
   * const Button = ({ 
   *   children,           // required: true, type: 'any'
   *   variant = 'primary', // required: false, type: 'string', defaultValue: 'primary'
   *   disabled = false     // required: false, type: 'boolean', defaultValue: 'false'
   * }) => { ... }
   * ```
   */
  private extractPropsFromFunction(node: any, props: PropInfo[]): void {
    const params = node.params[0];
    
    // オブジェクトパターン（デストラクチャリング）の確認
    // 例: ({ prop1, prop2 }) の形式
    if (params && params.type === 'ObjectPattern') {
      params.properties.forEach((prop: any) => {
        // プロパティ型の確認（通常のプロパティのみ処理）
        // RestElement（...rest）やSpreadElementは除外
        if (prop.type === 'Property' && prop.key.type === 'Identifier') {
          const propInfo: PropInfo = {
            name: prop.key.name,
            type: this.inferPropType(prop),
            // デフォルト値がある場合は任意のProps、ない場合は必須のProps
            required: !prop.value || prop.value.type !== 'AssignmentPattern',
            // AssignmentPatternの場合はデフォルト値を抽出
            defaultValue: prop.value?.type === 'AssignmentPattern' ? 
              this.getDefaultValue(prop.value.right) : undefined,
          };
          props.push(propInfo);
        }
      });
    }
  }

  /**
   * Props型推論処理
   * 
   * JavaScriptレベルでの基本的な型推論を実行します。
   * デフォルト値の型や構造から、Propsの型を推定します。
   * 
   * 推論ロジック：
   * 1. デフォルト値のリテラル型をチェック
   * 2. 配列・オブジェクト等の構造型を識別
   * 3. TypeScript型注釈は将来の拡張ポイント
   * 
   * @param prop - プロパティのASTノード
   * @returns 推論された型文字列
   * 
   * 対応する型推論パターン：
   * - 文字列リテラル: 'default' → 'string'
   * - 数値リテラル: 42 → 'number'
   * - ブールリテラル: true → 'boolean'
   * - 配列リテラル: [] → 'array'
   * - オブジェクトリテラル: {} → 'object'
   * - その他: 'any'
   * 
   * 将来拡張予定：
   * - TypeScript型システムとの統合
   * - Union型、Generic型のサポート
   * - interface/type定義からの型情報抽出
   * - JSDoc型注釈のサポート
   */
  private inferPropType(prop: any): string {
    // デフォルト値が設定されている場合の型推論
    if (prop.value?.type === 'AssignmentPattern') {
      const defaultValue = prop.value.right;
      
      // リテラル値からの型推論
      // 例: 'text' → string, 42 → number, true → boolean
      if (defaultValue.type === 'Literal') {
        return typeof defaultValue.value;
      } 
      // 配列リテラルの検出
      // 例: [] → array, [1, 2, 3] → array
      else if (defaultValue.type === 'ArrayExpression') {
        return 'array';
      } 
      // オブジェクトリテラルの検出
      // 例: {} → object, { key: 'value' } → object
      else if (defaultValue.type === 'ObjectExpression') {
        return 'object';
      }
    }
    
    // デフォルト値がない、または推論不可の場合
    // TypeScript型注釈の解析は将来の拡張で対応予定
    return 'any';
  }

  /**
   * デフォルト値の文字列表現抽出処理
   * 
   * Props のデフォルト値を適切な文字列表現に変換します。
   * ドキュメント生成時の可読性とコード例での使用を考慮した形式で出力します。
   * 
   * 変換パターン：
   * 1. リテラル値: 実際の値をそのまま文字列化
   * 2. 識別子: 変数名を文字列として保持
   * 3. 配列: 簡略表現 '[]' で表示
   * 4. オブジェクト: 簡略表現 '{}' で表示
   * 5. 複雑な式: undefinedを返して処理をスキップ
   * 
   * @param node - デフォルト値のASTノード
   * @returns デフォルト値の文字列表現、抽出不可の場合はundefined
   * 
   * 例：
   * - 'primary' → 'primary'
   * - 42 → '42'
   * - true → 'true'
   * - variable → 'variable'
   * - [] → '[]'
   * - {} → '{}'
   * - someFunction() → undefined（複雑な式は省略）
   * 
   * 設計思想：
   * - ドキュメントでの可読性を最優先
   * - コード例として使用可能な形式を維持
   * - 複雑な式は簡略化して表示の統一性を保つ
   */
  private getDefaultValue(node: any): string | undefined {
    // リテラル値（文字列、数値、ブール値等）
    // 例: 'text', 42, true, null
    if (node.type === 'Literal') {
      return String(node.value);
    } 
    // 識別子（変数名、定数名等）
    // 例: DEFAULT_VALUE, theme.colors.primary
    else if (node.type === 'Identifier') {
      return node.name;
    } 
    // 配列式: 空配列または配列リテラル
    // 例: [], [1, 2, 3] → 簡略表現として '[]'
    else if (node.type === 'ArrayExpression') {
      return '[]';
    } 
    // オブジェクト式: 空オブジェクトまたはオブジェクトリテラル
    // 例: {}, { key: 'value' } → 簡略表現として '{}'
    else if (node.type === 'ObjectExpression') {
      return '{}';
    }
    
    // その他の複雑な式（関数呼び出し、演算等）は
    // ドキュメントの簡潔性のため省略
    return undefined;
  }
}