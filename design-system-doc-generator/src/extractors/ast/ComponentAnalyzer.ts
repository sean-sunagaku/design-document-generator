import * as fs from 'fs';
import * as path from 'path';
const tsEslint = require('@typescript-eslint/typescript-estree');
const { parseAndGenerateServices } = tsEslint;

/**
 * ComponentAnalyzer - React/TypeScriptコンポーネント解析クラス
 * 
 * このクラスは、TypeScriptファイルがReactコンポーネントかどうかを判定し、
 * AST（抽象構文木）を生成してコンポーネント名を抽出する役割を担います。
 * 
 * 主な責務:
 * - ファイル形式の検証（.tsx, .jsx, .ts, .js）
 * - Reactコンポーネントパターンの検出
 * - TypeScript ESTreeを使用したAST生成
 * - エクスポートされたコンポーネント名の抽出
 * - 複数のエクスポート形式への対応
 * 
 * 検出パターン:
 * - JSX記法の使用: /<[a-zA-Z][a-zA-Z0-9]*/
 * - Reactインポート: import ... from 'react'
 * - エクスポート宣言: export default/export const/export function
 * 
 * AST生成:
 * - @typescript-eslint/typescript-estreeを使用
 * - JSX対応、位置情報付きでパース
 * - TypeScript固有の構文もサポート
 * 
 * 使用例:
 * const analyzer = new ComponentAnalyzer();
 * const result = await analyzer.analyzeFile('./Button.tsx');
 * if (result.isComponentFile) {
 *   console.log('Component:', result.componentName);
 * }
 * 
 * 他クラスとの関係:
 * - TailwindExtractor: メインオーケストレーターがこのクラスでファイル解析を開始
 * - ASTTraverser: 生成されたASTを走査するために使用される
 */

export class ComponentAnalyzer {
  /**
   * ファイルを解析してコンポーネント情報を取得
   * 
   * 指定されたファイルパスのファイルを読み込み、Reactコンポーネントかどうかを判定し、
   * AST生成とコンポーネント名抽出を行います。
   * 
   * 処理フロー:
   * 1. ファイル内容の読み込み
   * 2. Reactコンポーネントファイルかどうかの判定
   * 3. TypeScript ESTreeによるAST生成
   * 4. エクスポート宣言からのコンポーネント名抽出
   * 
   * @param filePath 解析対象ファイルのパス
   * @returns 解析結果オブジェクト
   */
  async analyzeFile(filePath: string): Promise<{
    content: string;           // ファイルの生内容
    ast: any;                 // 生成されたAST（コンポーネントでない場合はnull）
    componentName: string | null;  // 抽出されたコンポーネント名
    isComponentFile: boolean;      // Reactコンポーネントファイルかどうか
  }> {
    // 1. ファイル内容の読み込み
    const content = await fs.promises.readFile(filePath, 'utf-8');
    
    // 2. Reactコンポーネントファイルかどうかの事前判定
    // AST生成前にパターンマッチングで高速スクリーニング
    const isComponentFile = this.isComponentFile(content, filePath);
    if (!isComponentFile) {
      // コンポーネントでない場合は早期リターン（AST生成コストを避ける）
      return { content, ast: null, componentName: null, isComponentFile: false };
    }

    // 3. TypeScript ESTreeによるAST生成
    // JSX、位置情報、範囲情報を含む完全なASTを生成
    const { ast } = parseAndGenerateServices(content, {
      filePath,        // TypeScript設定の解決に使用
      jsx: true,       // JSX構文の解析を有効化
      loc: true,       // 行・列位置情報を含める
      range: true,     // 文字位置範囲情報を含める
    });

    // 4. ASTからコンポーネント名を抽出
    const componentName = this.extractComponentName(ast, filePath);

    return { content, ast, componentName, isComponentFile };
  }

  /**
   * Reactコンポーネントファイルかどうかを判定
   * 
   * ファイル拡張子とコンテンツの正規表現パターンマッチングにより、
   * 高速にReactコンポーネントファイルかどうかを判定します。
   * AST生成前の事前スクリーニングとして機能し、処理効率を向上させます。
   * 
   * 判定条件（すべて満たす必要がある）:
   * 1. 有効な拡張子（.tsx, .jsx, .ts, .js）
   * 2. JSX記法の使用
   * 3. Reactのインポート
   * 4. エクスポート宣言
   * 
   * @param content ファイルの内容
   * @param filePath ファイルパス
   * @returns Reactコンポーネントファイルの場合true
   */
  private isComponentFile(content: string, filePath: string): boolean {
    // 1. ファイル拡張子の検証
    const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];
    if (!validExtensions.some(ext => filePath.endsWith(ext))) {
      return false;
    }

    // 2. Reactコンポーネントパターンの検証
    const hasJSX = /<[a-zA-Z][a-zA-Z0-9]*/.test(content);                    // JSX要素の検出
    const hasReactImport = /import\s+.*\s+from\s+['"]react['"]/.test(content); // Reactインポートの検出
    const hasExport = /export\s+(default\s+)?(function|const|class|[A-Z]\w*)/.test(content); // エクスポート宣言の検出
    
    // すべての条件を満たす場合のみReactコンポーネントと判定
    return hasJSX && hasReactImport && hasExport;
  }

  /**
   * ASTからコンポーネント名を抽出
   * 
   * TypeScript ASTを解析して、エクスポートされたコンポーネント名を抽出します。
   * 複数のエクスポート形式に対応し、適切な名前解決を行います。
   * 
   * 対応するエクスポート形式:
   * - export default function ComponentName() {}
   * - export default ComponentName
   * - export const ComponentName = () => {}
   * - const ComponentName = () => {}; export default ComponentName;
   * 
   * 処理フロー:
   * 1. 変数宣言の収集（名前解決のため）
   * 2. エクスポート宣言の走査と名前抽出
   * 3. フォールバック：ファイル名からの推定
   * 
   * @param ast TypeScript ESTree AST
   * @param filePath ファイルパス（フォールバック用）
   * @returns 抽出されたコンポーネント名（見つからない場合はファイル名ベース）
   */
  private extractComponentName(ast: any, filePath: string): string | null {
    let componentName: string | null = null;
    const variableDeclarations = new Map<string, string>();

    // 第1パス: 変数宣言の収集
    // export default VariableName のような参照型エクスポートの名前解決に使用
    for (const node of ast.body) {
      if (node.type === 'VariableDeclaration') {
        for (const declaration of node.declarations) {
          if (declaration.id?.type === 'Identifier') {
            variableDeclarations.set(declaration.id.name, declaration.id.name);
          }
        }
      }
    }

    // 第2パス: エクスポート宣言の検索
    for (const node of ast.body) {
      if (node.type === 'ExportDefaultDeclaration') {
        // export default ... 形式
        componentName = this.getNameFromDeclaration(node.declaration, variableDeclarations);
      } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
        // export const/function ... 形式
        componentName = this.getNameFromDeclaration(node.declaration, variableDeclarations);
      }
      
      // 最初に見つかったコンポーネント名を使用
      if (componentName) break;
    }

    // フォールバック: ファイル名からコンポーネント名を推定
    if (!componentName) {
      const basename = path.basename(filePath, path.extname(filePath));
      componentName = basename.replace(/\..*$/, ''); // index.tsx → index
    }

    return componentName;
  }

  /**
   * 宣言ノードから名前を抽出
   * 
   * TypeScript ASTの宣言ノードから、実際のコンポーネント名を抽出します。
   * 複数の宣言形式を統一的に処理し、参照型の名前解決も行います。
   * 
   * 対応する宣言形式:
   * - FunctionDeclaration: function ComponentName() {}
   * - Identifier: ComponentName（変数参照）
   * - VariableDeclaration: const ComponentName = ...
   * 
   * @param declaration AST宣言ノード
   * @param variableDeclarations 変数宣言のマップ（参照解決用）
   * @returns 抽出された名前
   */
  private getNameFromDeclaration(declaration: any, variableDeclarations?: Map<string, string>): string | null {
    if (declaration.type === 'FunctionDeclaration' && declaration.id) {
      // 関数宣言: function ComponentName() {}
      return declaration.id.name;
    } else if (declaration.type === 'Identifier') {
      // 識別子参照: export default ComponentName
      // 変数宣言として定義されているかチェック
      if (variableDeclarations && variableDeclarations.has(declaration.name)) {
        return declaration.name;
      }
      return declaration.name;
    } else if (declaration.type === 'VariableDeclaration') {
      // 変数宣言: const/let/var ComponentName = ...
      const firstDeclarator = declaration.declarations[0];
      if (firstDeclarator && firstDeclarator.id.type === 'Identifier') {
        return firstDeclarator.id.name;
      }
    }
    return null;
  }
}