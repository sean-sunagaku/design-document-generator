import { ExtractedComponent, ComponentDoc, PropDoc, PropInfo, CodeExample, GeneratorOptions } from '../../types';
import { generateComponentId } from '../../utils/hash';
import { CodeValidator, ValidationResult } from '../../utils/codeValidation';

/**
 * ComponentDocumentGenerator - 個別コンポーネントドキュメント生成器
 * 
 * このクラスは、抽出された個別のコンポーネント情報から、包括的で詳細な
 * ドキュメントを生成する専門クラスです。Atomic Designの原則に基づいたコンポーネント分類、
 * TypeScript型情報、Tailwind CSSクラス、使用例、関連コンポーネントの分析等を
 * 統合して、AIが理解しやすい形式のComponentDocを作成します。
 * 
 * 主な責務:
 * - コンポーネントの目的と特徴を説明する記述の自動生成
 * - TypeScript Propsの詳細情報と使用例の提供
 * - Tailwind CSSクラスの解析と機能的特徴の抽出
 * - コード例の自動生成とバリデーション
 * - 関連コンポーネントの特定と分類
 * - JSX構造情報の保持とドキュメント化
 * 
 * 生成されるドキュメントの特徴:
 * - Atomic Designカテゴリに基づいた文脈的な説明
 * - Tailwindクラスからの機能的特徴の自動推定
 * - 実用的なコード例と即座使用可能なスニペット
 * - TypeScript型安全性を考慮したプロパティ例
 * - レスポンシブデザイン、ダークモード、アニメーション対応の明示
 * 
 * コード品質保証:
 * - CodeValidatorとの統合による生成コードのリアルタイム検証
 * - 無効なTailwindクラスの検出と警告
 * - TypeScript型アノテーションに基づいた適切な例値生成
 * - コンポーネント間の依存関係の精密な分析
 * 
 * 関連コンポーネント特定アルゴリズム:
 * 1. 同一カテゴリのコンポーネント
 * 2. 直接的な依存関係にあるコンポーネント
 * 3. 名前の似ているコンポーネント（バリアント等）
 * 
 * 使用例:
 * const generator = new ComponentDocumentGenerator();
 * const componentDoc = generator.generateComponentDoc(component, allComponents, options);
 * 
 * 他クラスとの関係:
 * - AIDocumentGenerator: このクラスを使用して個別コンポーネントドキュメントを生成
 * - CodeValidator: 生成されたコード例の品質検証
 * - TailwindExtractor: このクラスが生成したコンポーネント情報を受け取る
 * - MarkdownFormatter: このクラスが生成したComponentDocをMarkdown化
 */

export class ComponentDocumentGenerator {
  private codeValidator: CodeValidator;  // コード品質検証器

  /**
   * ComponentDocumentGeneratorの初期化
   * 
   * コード例の品質を保証するCodeValidatorを初期化し、
   * 信頼性の高いドキュメント生成の基盤を構築します。
   */
  constructor() {
    this.codeValidator = new CodeValidator();
  }

  /**
   * 個別コンポーネントの包括的ドキュメントを生成
   * 
   * 抽出されたコンポーネント情報を基に、AIが理解しやすい包括的なドキュメントを
   * 作成します。コンポーネントの特徴、使用方法、プロパティ、スタイル、
   * 関連コンポーネントなどの情報を統合して構造化します。
   * 
   * 生成プロセス:
   * 1. 一意のID生成（カテゴリ + コンポーネント名）
   * 2. Atomic Designカテゴリに基づいた説明文生成
   * 3. 基本的な使用方法の提示
   * 4. TypeScript Propsの詳細情報化
   * 5. スタイル情報の統合と特徴抽出
   * 6. コード例の生成と検証（オプション）
   * 7. 関連コンポーネントの特定
   * 8. JSX構造情報の保持
   * 
   * @param component ドキュメント化対象のコンポーネント
   * @param allComponents プロジェクト全体のコンポーネント一覧（関連分析用）
   * @param options ドキュメント生成オプション
   * @returns 包括的なコンポーネントドキュメント
   */
  generateComponentDoc(
    component: ExtractedComponent,
    allComponents: ExtractedComponent[],
    options: GeneratorOptions
  ): ComponentDoc {
    return {
      id: generateComponentId(component.category, component.componentName),      // 一意識別子
      name: component.componentName,                                              // コンポーネント名
      category: component.category,                                               // Atomic Designカテゴリ
      description: this.generateDescription(component),                           // 文脈的説明文
      usage: this.generateUsageInstructions(component),                           // 基本使用方法
      props: component.props.map(prop => this.convertPropToDoc(prop, component)), // 詳細化されたProps情報
      styles: component.styleInfo || {                                            // スタイル情報（既存または生成）
        type: 'tailwind',
        tailwindClasses: component.tailwindClasses,
        responsive: this.hasResponsiveClasses(component.tailwindClasses),
        darkMode: this.hasDarkModeClasses(component.tailwindClasses),
        animations: this.extractAnimations(component.tailwindClasses),
      },
      examples: options.includeExamples ? this.generateAndValidateExamples(component) : [], // 検証済みコード例
      relatedComponents: this.findRelatedComponents(component, allComponents),               // 関連コンポーネント
      jsxStructure: component.jsxStructure,                                                 // JSX構造情報
    };
  }

  /**
   * コンポーネントの文脈的説明文を自動生成
   * 
   * Atomic DesignカテゴリとTailwindクラスの特徴を組み合わせて、
   * コンポーネントの目的と機能を明確に説明する文章を生成します。
   * 
   * 生成プロセス:
   * 1. Atomic Designカテゴリに基づいたベース説明文を選択
   * 2. Tailwindクラスを解析して機能的特徴を抽出
   * 3. 特徴を自然な日本語で結合して完成
   * 
   * 抽出される特徴:
   * - レイアウト手法（Flexbox, Grid）
   * - インタラクティブ機能（ホバー効果）
   * - アニメーション効果
   * - ダークモード対応
   * - レスポンシブデザイン対応
   * 
   * @param component 説明文生成対象のコンポーネント
   * @returns 生成された説明文
   */
  private generateDescription(component: ExtractedComponent): string {
    // Atomic Designカテゴリ別のベーステンプレート
    const templates = {
      atoms: `基本的なUI要素「${component.componentName}」。`,                    // ボタン、インプット等
      molecules: `複数の要素を組み合わせた「${component.componentName}」コンポーネント。`,  // フォームフィールド等
      organisms: `複雑な機能を持つ「${component.componentName}」セクション。`,           // ヘッダー、フッター等
      templates: `ページレイアウトを定義する「${component.componentName}」テンプレート。`,      // ページ骨組み
      pages: `完全なページコンポーネント「${component.componentName}」。`,              // 実際のページ
    };

    let description = templates[component.category];

    // Tailwindクラスから機能的特徴を自動抽出
    const features = [];
    
    // レイアウト手法の検出
    if (component.tailwindClasses.some(cls => cls.includes('flex'))) {
      features.push('フレックスボックスレイアウトを使用');
    }
    if (component.tailwindClasses.some(cls => cls.includes('grid'))) {
      features.push('グリッドレイアウトを使用');
    }
    
    // インタラクティブ機能の検出
    if (component.tailwindClasses.some(cls => cls.includes('animate'))) {
      features.push('アニメーション効果付き');
    }
    if (component.tailwindClasses.some(cls => cls.includes('hover:'))) {
      features.push('ホバー効果あり');
    }
    
    // アダプティブ機能の検出
    if (component.tailwindClasses.some(cls => cls.includes('dark:'))) {
      features.push('ダークモード対応');
    }
    if (component.tailwindClasses.some(cls => /^(sm|md|lg|xl):/.test(cls))) {
      features.push('レスポンシブ対応');
    }

    // 特徴がある場合は説明文に追加
    if (features.length > 0) {
      description += features.join('、') + '。';
    }

    return description;
  }

  /**
   * コンポーネントの基本使用方法を生成
   * 
   * TypeScript Props情報を基に、必須プロパティと一般的なプロパティを含めた
   * 最小限の使用可能なコードスニペットを生成します。
   * 
   * 生成ルール:
   * - 必須プロパティは必ず含める
   * - childrenプロパティがある場合は含める（一般的なパターン）
   * - プロパティの型に基づいた適切な例値を生成
   * - 即座コピーアンドペーストで使用可能な形式
   * 
   * @param component 使用方法生成対象のコンポーネント
   * @returns 基本使用方法のJSXコード
   */
  private generateUsageInstructions(component: ExtractedComponent): string {
    const hasRequiredProps = component.props.some(p => p.required);
    
    // 必須プロパティと一般的なchildrenプロパティを抽出
    const propsExample = component.props
      .filter(p => p.required || p.name === 'children')
      .map(p => `${p.name}={${this.getPropExample(p)}}`)
      .join(' ');

    // 必須プロパティがある場合はそれらを含めた形式、ない場合はシンプルな形式
    if (hasRequiredProps) {
      return `<${component.componentName} ${propsExample} />`;
    } else {
      return `<${component.componentName} />`;
    }
  }

  /**
   * PropInfoをPropDocに変換（説明文を追加）
   * 
   * 元のTypeScript型情報に加えて、人間が理解しやすい説明文を
   * 自動生成して追加し、ドキュメント用に最適化します。
   * 
   * @param prop 元のTypeScriptプロパティ情報
   * @param component コンテキスト情報用のコンポーネント
   * @returns 説明文付きのプロパティドキュメント
   */
  private convertPropToDoc(prop: PropInfo, component: ExtractedComponent): PropDoc {
    return {
      ...prop,
      description: this.generatePropDescription(prop, component),
    };
  }

  /**
   * TypeScriptプロパティの説明文を自動生成
   * 
   * 一般的なReactコンポーネントのプロパティ名から、その目的と用途を
   * 推定して適切な日本語説明を生成します。カスタムプロパティの場合は
   * 基本的なフォーマットで返します。
   * 
   * 対応プロパティカテゴリ:
   * - コンテンツ関連: children, title, description, label
   * - スタイル関連: className, size, variant, color
   * - イベント関連: onClick, onChange, onSubmit
   * - 状態関連: disabled, loading, error, value
   * - フォーム関連: name, id, placeholder, type
   * - メディア関連: src, alt, href
   * 
   * @param prop 説明生成対象のプロパティ情報
   * @param component コンテキスト情報用コンポーネント（現在未使用、将来拡張用）
   * @returns 生成された説明文
   */
  private generatePropDescription(prop: PropInfo, component: ExtractedComponent): string {
    // 一般的なReactプロパティ名とその説明のマッピング
    const descriptions: Record<string, string> = {
      // コンテンツ関連
      children: 'コンポーネントの子要素',
      title: 'タイトルテキスト',
      description: '説明テキスト',
      label: 'ラベルテキスト',
      
      // スタイル関連
      className: '追加のCSSクラス名',
      size: 'コンポーネントのサイズ',
      variant: 'コンポーネントのバリアント',
      color: 'カラーテーマ',
      
      // イベント関連
      onClick: 'クリック時のイベントハンドラ',
      onChange: '値変更時のイベントハンドラ',
      onSubmit: 'フォーム送信時のイベントハンドラ',
      
      // 状態関連
      disabled: 'コンポーネントの無効化状態',
      loading: 'ローディング状態の表示',
      error: 'エラー状態の表示',
      value: 'コンポーネントの値',
      
      // フォーム関連
      name: 'フォーム要素の名前',
      id: 'DOM要素のID',
      placeholder: 'プレースホルダーテキスト',
      type: 'インプットタイプまたはバリアント',
      
      // メディア関連
      href: 'リンク先URL',
      src: '画像やメディアのソースURL',
      alt: '代替テキスト',
    };

    // マッピングされた説明がある場合はそれを使用、ない場合はフォールバック
    return descriptions[prop.name] || `${prop.name}プロパティ`;
  }

  private generateAndValidateExamples(component: ExtractedComponent): CodeExample[] {
    const examples: CodeExample[] = [];

    // Basic usage
    const basicExample = this.generateBasicExample(component);
    const basicValidation = this.codeValidator.validateExampleCode(basicExample, component.componentName);
    
    examples.push({
      title: '基本的な使用方法',
      code: basicExample,
      description: `最もシンプルな使用例${basicValidation.isValid ? ' ✅' : ' ⚠️ バリデーションエラーあり'}`,
      validation: basicValidation
    });

    // With props
    if (component.props.length > 0) {
      const fullExample = this.generateFullExample(component);
      const fullValidation = this.codeValidator.validateExampleCode(fullExample, component.componentName);
      
      examples.push({
        title: '全プロパティを使用した例',
        code: fullExample,
        description: `全ての利用可能なプロパティを含む例${fullValidation.isValid ? ' ✅' : ' ⚠️ バリデーションエラーあり'}`,
        validation: fullValidation
      });
    }

    // Tailwind classes validation
    if (component.tailwindClasses.length > 0) {
      const tailwindValidation = this.codeValidator.validateTailwindClasses(component.tailwindClasses);
      examples.push({
        title: 'Tailwindクラス検証',
        code: `// 使用されているTailwindクラス:\n// ${component.tailwindClasses.join(', ')}`,
        description: `Tailwindクラスの有効性チェック${tailwindValidation.isValid ? ' ✅' : ' ⚠️ 無効なクラスが含まれる可能性があります'}`,
        validation: tailwindValidation
      });
    }

    return examples;
  }

  private generateBasicExample(component: ExtractedComponent): string {
    const requiredProps = component.props.filter(p => p.required);
    
    if (requiredProps.length === 0) {
      return `import { ${component.componentName} } from './${component.componentName}';

function Example() {
  return <${component.componentName} />;
}`;
    }

    const propsCode = requiredProps
      .map(p => `    ${p.name}={${this.getPropExample(p)}}`)
      .join('\n');

    return `import { ${component.componentName} } from './${component.componentName}';

function Example() {
  return (
    <${component.componentName}
${propsCode}
    />
  );
}`;
  }

  private generateFullExample(component: ExtractedComponent): string {
    const propsCode = component.props
      .map(p => `    ${p.name}={${this.getPropExample(p)}}`)
      .join('\n');

    return `import { ${component.componentName} } from './${component.componentName}';

function Example() {
  return (
    <${component.componentName}
${propsCode}
    />
  );
}`;
  }

  private getPropExample(prop: PropInfo): string {
    switch (prop.type) {
      case 'string':
        return `"サンプルテキスト"`;
      case 'number':
        return '42';
      case 'boolean':
        return 'true';
      case '() => void':
      case 'function':
        return '() => {}';
      case 'ReactNode':
      case 'React.ReactNode':
        return '<div>コンテンツ</div>';
      default:
        return '{}';
    }
  }

  private findRelatedComponents(
    component: ExtractedComponent, 
    allComponents: ExtractedComponent[]
  ): string[] {
    const related: string[] = [];
    
    // Same category
    const sameCategory = allComponents
      .filter(c => c.category === component.category && c.componentName !== component.componentName)
      .map(c => c.componentName);
    
    // Components that this component depends on
    const dependencies = component.dependencies
      .map(dep => {
        const match = allComponents.find(c => dep.includes(c.componentName));
        return match?.componentName;
      })
      .filter(Boolean) as string[];
    
    // Components with similar names
    const similarNames = allComponents
      .filter(c => {
        const name1 = c.componentName.toLowerCase();
        const name2 = component.componentName.toLowerCase();
        return name1 !== name2 && 
               (name1.includes(name2) || name2.includes(name1));
      })
      .map(c => c.componentName);
    
    return [...new Set([...dependencies, ...similarNames, ...sameCategory])].slice(0, 5);
  }

  private hasResponsiveClasses(classes: string[]): boolean {
    return classes.some(cls => /^(sm|md|lg|xl|2xl):/.test(cls));
  }

  private hasDarkModeClasses(classes: string[]): boolean {
    return classes.some(cls => cls.startsWith('dark:'));
  }

  private extractAnimations(classes: string[]): string[] {
    return classes.filter(cls => 
      cls.startsWith('animate-') || 
      cls.startsWith('transition') ||
      cls.includes('duration-') ||
      cls.includes('ease-')
    );
  }
}