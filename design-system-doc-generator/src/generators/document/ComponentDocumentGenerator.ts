import { ExtractedComponent, ComponentDoc, PropDoc, PropInfo, CodeExample, GeneratorOptions } from '../../types';
import { generateComponentId } from '../../utils/hash';
import { CodeValidator, ValidationResult } from '../../utils/codeValidation';

export class ComponentDocumentGenerator {
  private codeValidator: CodeValidator;

  constructor() {
    this.codeValidator = new CodeValidator();
  }

  generateComponentDoc(
    component: ExtractedComponent,
    allComponents: ExtractedComponent[],
    options: GeneratorOptions
  ): ComponentDoc {
    return {
      id: generateComponentId(component.category, component.componentName),
      name: component.componentName,
      category: component.category,
      description: this.generateDescription(component),
      usage: this.generateUsageInstructions(component),
      props: component.props.map(prop => this.convertPropToDoc(prop, component)),
      styles: component.styleInfo || {
        type: 'tailwind',
        tailwindClasses: component.tailwindClasses,
        responsive: this.hasResponsiveClasses(component.tailwindClasses),
        darkMode: this.hasDarkModeClasses(component.tailwindClasses),
        animations: this.extractAnimations(component.tailwindClasses),
      },
      examples: options.includeExamples ? this.generateAndValidateExamples(component) : [],
      relatedComponents: this.findRelatedComponents(component, allComponents),
      jsxStructure: component.jsxStructure,
    };
  }

  private generateDescription(component: ExtractedComponent): string {
    const templates = {
      atoms: `基本的なUI要素「${component.componentName}」。`,
      molecules: `複数の要素を組み合わせた「${component.componentName}」コンポーネント。`,
      organisms: `複雑な機能を持つ「${component.componentName}」セクション。`,
      templates: `ページレイアウトを定義する「${component.componentName}」テンプレート。`,
      pages: `完全なページコンポーネント「${component.componentName}」。`,
    };

    let description = templates[component.category];

    // Tailwindクラスから特徴を抽出
    const features = [];
    
    if (component.tailwindClasses.some(cls => cls.includes('flex'))) {
      features.push('フレックスボックスレイアウトを使用');
    }
    if (component.tailwindClasses.some(cls => cls.includes('grid'))) {
      features.push('グリッドレイアウトを使用');
    }
    if (component.tailwindClasses.some(cls => cls.includes('animate'))) {
      features.push('アニメーション効果付き');
    }
    if (component.tailwindClasses.some(cls => cls.includes('hover:'))) {
      features.push('ホバー効果あり');
    }
    if (component.tailwindClasses.some(cls => cls.includes('dark:'))) {
      features.push('ダークモード対応');
    }
    if (component.tailwindClasses.some(cls => /^(sm|md|lg|xl):/.test(cls))) {
      features.push('レスポンシブ対応');
    }

    if (features.length > 0) {
      description += features.join('、') + '。';
    }

    return description;
  }

  private generateUsageInstructions(component: ExtractedComponent): string {
    const hasRequiredProps = component.props.some(p => p.required);
    const propsExample = component.props
      .filter(p => p.required || p.name === 'children')
      .map(p => `${p.name}={${this.getPropExample(p)}}`)
      .join(' ');

    if (hasRequiredProps) {
      return `<${component.componentName} ${propsExample} />`;
    } else {
      return `<${component.componentName} />`;
    }
  }

  private convertPropToDoc(prop: PropInfo, component: ExtractedComponent): PropDoc {
    return {
      ...prop,
      description: this.generatePropDescription(prop, component),
    };
  }

  private generatePropDescription(prop: PropInfo, component: ExtractedComponent): string {
    const descriptions: Record<string, string> = {
      children: 'コンポーネントの子要素',
      className: '追加のCSSクラス名',
      onClick: 'クリック時のイベントハンドラ',
      onChange: '値変更時のイベントハンドラ',
      onSubmit: 'フォーム送信時のイベントハンドラ',
      disabled: 'コンポーネントの無効化状態',
      loading: 'ローディング状態の表示',
      error: 'エラー状態の表示',
      value: 'コンポーネントの値',
      placeholder: 'プレースホルダーテキスト',
      label: 'ラベルテキスト',
      name: 'フォーム要素の名前',
      id: 'DOM要素のID',
      type: 'インプットタイプまたはバリアント',
      size: 'コンポーネントのサイズ',
      variant: 'コンポーネントのバリアント',
      color: 'カラーテーマ',
      title: 'タイトルテキスト',
      description: '説明テキスト',
      href: 'リンク先URL',
      src: '画像やメディアのソースURL',
      alt: '代替テキスト',
    };

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