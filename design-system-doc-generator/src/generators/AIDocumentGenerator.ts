import * as fs from 'fs';
import * as path from 'path';
import { 
  ExtractedComponent, 
  DesignTokens, 
  GeneratorOptions, 
  ProjectInfo,
  PropInfo 
} from '../types';
import { ensureDirectoryExists } from '../utils/fileUtils';
import { generateComponentId } from '../utils/hash';

export interface AIDocument {
  version: string;
  generated: string;
  project: ProjectInfo;
  tokens: DesignTokens;
  components: ComponentDoc[];
  patterns: DesignPattern[];
  guidelines: string[];
}

export interface ComponentDoc {
  id: string;
  name: string;
  category: string;
  description: string;
  usage: string;
  props: PropDoc[];
  styles: StyleInfo;
  examples: CodeExample[];
  relatedComponents: string[];
  jsxStructure?: any; // JSXElement type from types/index.ts
}

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface StyleInfo {
  tailwindClasses: string[];
  customStyles?: string;
  responsive: boolean;
  darkMode: boolean;
  animations: string[];
}

export interface CodeExample {
  title: string;
  code: string;
  description?: string;
}

export interface DesignPattern {
  name: string;
  description: string;
  components: string[];
  example: string;
}

export class AIDocumentGenerator {
  async generate(
    components: ExtractedComponent[],
    tokens: DesignTokens,
    options: GeneratorOptions
  ): Promise<AIDocument> {
    const document: AIDocument = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      project: await this.getProjectInfo(),
      tokens,
      components: [],
      patterns: [],
      guidelines: [],
    };

    // コンポーネントドキュメント生成
    for (const component of components) {
      const componentDoc = await this.generateComponentDoc(component, components, options);
      document.components.push(componentDoc);
    }

    // デザインパターンの検出
    document.patterns = this.detectPatterns(components);

    // ガイドライン生成
    document.guidelines = this.generateGuidelines(components, tokens);

    return document;
  }

  private async getProjectInfo(): Promise<ProjectInfo> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
      
      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    } catch {
      return {
        name: 'unknown',
        version: '0.0.0',
        framework: 'react',
        styling: 'tailwindcss',
      };
    }
  }

  private async generateComponentDoc(
    component: ExtractedComponent,
    allComponents: ExtractedComponent[],
    options: GeneratorOptions
  ): Promise<ComponentDoc> {
    return {
      id: generateComponentId(component.category, component.componentName),
      name: component.componentName,
      category: component.category,
      description: this.generateDescription(component),
      usage: this.generateUsageInstructions(component),
      props: component.props.map(prop => ({
        ...prop,
        description: this.generatePropDescription(prop, component),
      })),
      styles: {
        tailwindClasses: component.tailwindClasses,
        responsive: this.hasResponsiveClasses(component.tailwindClasses),
        darkMode: this.hasDarkModeClasses(component.tailwindClasses),
        animations: this.extractAnimations(component.tailwindClasses),
      },
      examples: options.includeExamples ? 
        await this.generateExamples(component) : [],
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

  private async generateExamples(component: ExtractedComponent): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];

    // Basic usage
    examples.push({
      title: '基本的な使用方法',
      code: this.generateBasicExample(component),
      description: '最もシンプルな使用例',
    });

    // With props
    if (component.props.length > 0) {
      examples.push({
        title: '全プロパティを使用した例',
        code: this.generateFullExample(component),
        description: '全ての利用可能なプロパティを含む例',
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

  private detectPatterns(components: ExtractedComponent[]): DesignPattern[] {
    const patterns: DesignPattern[] = [];

    // ボタンパターン
    const buttonComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('button') ||
      c.componentName.toLowerCase().includes('btn')
    );
    if (buttonComponents.length > 1) {
      patterns.push({
        name: 'ボタンシステム',
        description: 'プロジェクト全体で使用されるボタンコンポーネントのパターン。統一されたスタイルとインタラクションを提供。',
        components: buttonComponents.map(c => c.componentName),
        example: this.generatePatternExample('button', buttonComponents),
      });
    }

    // フォームパターン
    const formComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('form') ||
      c.componentName.toLowerCase().includes('input') ||
      c.componentName.toLowerCase().includes('field') ||
      c.componentName.toLowerCase().includes('textarea') ||
      c.componentName.toLowerCase().includes('select')
    );
    if (formComponents.length > 2) {
      patterns.push({
        name: 'フォームシステム',
        description: 'フォーム要素の一貫したデザインパターン。入力フィールド、バリデーション、レイアウトを統一。',
        components: formComponents.map(c => c.componentName),
        example: this.generatePatternExample('form', formComponents),
      });
    }

    // カードパターン
    const cardComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('card')
    );
    if (cardComponents.length > 0) {
      patterns.push({
        name: 'カードシステム',
        description: 'コンテンツを整理して表示するためのカードコンポーネントパターン。',
        components: cardComponents.map(c => c.componentName),
        example: this.generatePatternExample('card', cardComponents),
      });
    }

    // ナビゲーションパターン
    const navComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('nav') ||
      c.componentName.toLowerCase().includes('menu') ||
      c.componentName.toLowerCase().includes('header') ||
      c.componentName.toLowerCase().includes('sidebar')
    );
    if (navComponents.length > 1) {
      patterns.push({
        name: 'ナビゲーションシステム',
        description: 'アプリケーション内のナビゲーションを構成するコンポーネントパターン。',
        components: navComponents.map(c => c.componentName),
        example: this.generatePatternExample('navigation', navComponents),
      });
    }

    return patterns;
  }

  private generatePatternExample(
    patternType: string, 
    components: ExtractedComponent[]
  ): string {
    switch (patternType) {
      case 'button':
        return `// ボタンバリエーション
<PrimaryButton onClick={handleClick}>メインアクション</PrimaryButton>
<SecondaryButton onClick={handleClick}>サブアクション</SecondaryButton>
<IconButton icon={<SaveIcon />} onClick={handleSave} />`;

      case 'form':
        return `// フォーム構成例
<Form onSubmit={handleSubmit}>
  <FormField label="名前" name="name" required />
  <FormField label="メール" name="email" type="email" />
  <TextArea label="コメント" name="comment" rows={4} />
  <SubmitButton>送信</SubmitButton>
</Form>`;

      case 'card':
        return `// カード使用例
<Card>
  <CardHeader title="タイトル" />
  <CardBody>
    <p>カードのコンテンツ</p>
  </CardBody>
  <CardFooter>
    <Button>アクション</Button>
  </CardFooter>
</Card>`;

      case 'navigation':
        return `// ナビゲーション構成
<Header>
  <NavMenu items={menuItems} />
  <UserMenu user={currentUser} />
</Header>`;

      default:
        return '// パターン使用例';
    }
  }

  private generateGuidelines(
    components: ExtractedComponent[], 
    tokens: DesignTokens
  ): string[] {
    const guidelines: string[] = [];

    // カラー使用ガイドライン
    const colorCount = Object.keys(tokens.colors).length;
    if (colorCount > 0) {
      guidelines.push(
        `カラーパレット: ${colorCount}色のカラートークンが定義されています。` +
        `プライマリカラーやセカンダリカラーを一貫して使用してください。`
      );
    }

    // スペーシングガイドライン
    const spacingCount = Object.keys(tokens.spacing).length;
    if (spacingCount > 0) {
      guidelines.push(
        `スペーシング: ${spacingCount}種類のスペーシングトークンが利用可能です。` +
        `一貫した余白を保つため、定義されたスペーシング値を使用してください。`
      );
    }

    // レスポンシブデザイン
    const responsiveComponents = components.filter(c => 
      c.tailwindClasses.some(cls => /^(sm|md|lg|xl):/.test(cls))
    );
    if (responsiveComponents.length > 0) {
      guidelines.push(
        `レスポンシブデザイン: ${responsiveComponents.length}個のコンポーネントが` +
        `レスポンシブ対応しています。モバイルファーストのアプローチを維持してください。`
      );
    }

    // ダークモード
    const darkModeComponents = components.filter(c => 
      c.tailwindClasses.some(cls => cls.startsWith('dark:'))
    );
    if (darkModeComponents.length > 0) {
      guidelines.push(
        `ダークモード: ${darkModeComponents.length}個のコンポーネントが` +
        `ダークモードに対応しています。新しいコンポーネントもダークモードを考慮してください。`
      );
    }

    // コンポーネント階層
    const atomCount = components.filter(c => c.category === 'atoms').length;
    const moleculeCount = components.filter(c => c.category === 'molecules').length;
    const organismCount = components.filter(c => c.category === 'organisms').length;
    
    guidelines.push(
      `コンポーネント構成: Atoms(${atomCount}), Molecules(${moleculeCount}), ` +
      `Organisms(${organismCount})。Atomic Designの原則に従ってコンポーネントを構築してください。`
    );

    return guidelines;
  }

  async saveAsJSON(document: AIDocument, outputPath: string): Promise<void> {
    await ensureDirectoryExists(path.dirname(outputPath));
    const jsonContent = JSON.stringify(document, null, 2);
    await fs.promises.writeFile(outputPath, jsonContent, 'utf-8');
  }

  async saveAsMarkdown(document: AIDocument, outputPath: string): Promise<void> {
    await ensureDirectoryExists(path.dirname(outputPath));
    const markdown = this.generateMarkdown(document);
    await fs.promises.writeFile(outputPath, markdown, 'utf-8');
  }

  private generateMarkdown(document: AIDocument): string {
    let md = `# デザインシステムドキュメント

生成日時: ${new Date(document.generated).toLocaleString('ja-JP')}

## プロジェクト情報

- **名前**: ${document.project.name}
- **バージョン**: ${document.project.version}
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
`;

    // カラートークンの出力
    Object.entries(document.tokens.colors).slice(0, 20).forEach(([name, token]) => {
      md += `| ${name} | ${token.value} | ${token.rgb || '-'} | ${token.usage?.join(', ') || '-'} |\n`;
    });

    if (Object.keys(document.tokens.colors).length > 20) {
      md += `| ... | 他${Object.keys(document.tokens.colors).length - 20}色 | | |\n`;
    }

    md += `\n### スペーシング\n\n`;
    md += '| トークン | 値 |\n';
    md += '|----------|----|\n';
    Object.entries(document.tokens.spacing).slice(0, 15).forEach(([name, value]) => {
      md += `| ${name} | ${value} |\n`;
    });

    // タイポグラフィ
    if (Object.keys(document.tokens.typography.fontSize).length > 0) {
      md += `\n### タイポグラフィ\n\n`;
      md += '**フォントサイズ:**\n\n';
      md += '| サイズ | 値 |\n';
      md += '|-------|----|\n';
      Object.entries(document.tokens.typography.fontSize).forEach(([name, value]) => {
        md += `| ${name} | ${value} |\n`;
      });
    }

    // コンポーネントセクション
    md += `\n## コンポーネント一覧\n\n`;

    const categories = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    categories.forEach(category => {
      const componentsInCategory = document.components.filter(c => c.category === category);
      if (componentsInCategory.length > 0) {
        md += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
        
        componentsInCategory.forEach(comp => {
          md += `#### ${comp.name}\n\n`;
          md += `${comp.description}\n\n`;
          md += `**使用方法**: \`${comp.usage}\`\n\n`;
          
          if (comp.props.length > 0) {
            md += `**Props**:\n\n`;
            md += '| Prop | Type | Required | Description |\n';
            md += '|------|------|----------|-------------|\n';
            comp.props.forEach(prop => {
              md += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? '✓' : '-'} | ${prop.description} |\n`;
            });
            md += '\n';
          }
          
          md += `**スタイル情報**:\n`;
          md += `- レスポンシブ対応: ${comp.styles.responsive ? '✓' : '✗'}\n`;
          md += `- ダークモード対応: ${comp.styles.darkMode ? '✓' : '✗'}\n`;
          
          if (comp.styles.animations.length > 0) {
            md += `- アニメーション: ${comp.styles.animations.join(', ')}\n`;
          }
          
          if (comp.relatedComponents.length > 0) {
            md += `\n**関連コンポーネント**: ${comp.relatedComponents.join(', ')}\n`;
          }
          
          md += '\n---\n\n';
        });
      }
    });

    // デザインパターン
    if (document.patterns.length > 0) {
      md += `\n## デザインパターン\n\n`;
      document.patterns.forEach(pattern => {
        md += `### ${pattern.name}\n\n`;
        md += `${pattern.description}\n\n`;
        md += `**使用コンポーネント**: ${pattern.components.join(', ')}\n\n`;
        md += '```tsx\n';
        md += pattern.example;
        md += '\n```\n\n';
      });
    }

    // ガイドライン
    if (document.guidelines.length > 0) {
      md += `\n## ガイドライン\n\n`;
      document.guidelines.forEach((guideline, index) => {
        md += `${index + 1}. ${guideline}\n\n`;
      });
    }

    return md;
  }
}