import { AIDocument } from '../../types';

export class MarkdownFormatter {
  generateMarkdown(document: AIDocument): string {
    let md = this.generateHeader(document);
    md += this.generateTableOfContents();
    md += this.generateDesignTokens(document);
    md += this.generateComponents(document);
    md += this.generatePatterns(document);
    md += this.generateGuidelines(document);
    
    return md;
  }

  private generateHeader(document: AIDocument): string {
    return `# デザインシステムドキュメント

生成日時: ${new Date(document.generated).toLocaleString('ja-JP')}

## プロジェクト情報

- **名前**: ${document.project.name}
- **バージョン**: ${document.project.version}
- **フレームワーク**: React + TypeScript
- **スタイリング**: Tailwind CSS

`;
  }

  private generateTableOfContents(): string {
    return `## 目次

1. [デザイントークン](#デザイントークン)
2. [コンポーネント一覧](#コンポーネント一覧)
3. [デザインパターン](#デザインパターン)
4. [ガイドライン](#ガイドライン)

`;
  }

  private generateDesignTokens(document: AIDocument): string {
    let md = `## デザイントークン

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

    // フォントファミリー
    if (Object.keys(document.tokens.typography.fontFamily).length > 0) {
      md += `\n**フォントファミリー:**\n\n`;
      md += '| 名前 | 値 |\n';
      md += '|------|----|\n';
      Object.entries(document.tokens.typography.fontFamily).forEach(([name, value]) => {
        md += `| ${name} | ${value} |\n`;
      });
    }

    // ボーダー半径
    if (Object.keys(document.tokens.borderRadius).length > 0) {
      md += `\n### ボーダー半径\n\n`;
      md += '| トークン | 値 |\n';
      md += '|----------|----|\n';
      Object.entries(document.tokens.borderRadius).forEach(([name, value]) => {
        md += `| ${name} | ${value} |\n`;
      });
    }

    // シャドウ
    if (Object.keys(document.tokens.shadows).length > 0) {
      md += `\n### シャドウ\n\n`;
      md += '| トークン | 値 |\n';
      md += '|----------|----|\n';
      Object.entries(document.tokens.shadows).forEach(([name, value]) => {
        md += `| ${name} | ${value} |\n`;
      });
    }

    return md + '\n';
  }

  private generateComponents(document: AIDocument): string {
    let md = `## コンポーネント一覧\n\n`;

    const categories = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    const categoryNames = {
      atoms: 'Atoms',
      molecules: 'Molecules', 
      organisms: 'Organisms',
      templates: 'Templates',
      pages: 'Pages'
    };

    categories.forEach(category => {
      const componentsInCategory = document.components.filter(c => c.category === category);
      if (componentsInCategory.length > 0) {
        md += `### ${categoryNames[category as keyof typeof categoryNames]}\n\n`;
        
        componentsInCategory.forEach(comp => {
          md += `#### ${comp.name}\n\n`;
          md += `${comp.description}\n\n`;
          md += `**使用方法**: \`${comp.usage}\`\n\n`;
          
          // Props table
          if (comp.props.length > 0) {
            md += `**Props**:\n\n`;
            md += '| Prop | Type | Required | Default | Description |\n';
            md += '|------|------|----------|---------|-------------|\n';
            comp.props.forEach(prop => {
              const defaultValue = prop.defaultValue ? `\`${prop.defaultValue}\`` : '-';
              md += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? '✓' : '-'} | ${defaultValue} | ${prop.description} |\n`;
            });
            md += '\n';
          }
          
          // Style info
          md += `**スタイル情報**:\n`;
          md += `- レスポンシブ対応: ${comp.styles.responsive ? '✓' : '✗'}\n`;
          md += `- ダークモード対応: ${comp.styles.darkMode ? '✓' : '✗'}\n`;
          
          if (comp.styles.animations.length > 0) {
            md += `- アニメーション: ${comp.styles.animations.join(', ')}\n`;
          }

          // Tailwind classes
          if (comp.styles.tailwindClasses && comp.styles.tailwindClasses.length > 0) {
            md += `- 使用クラス: ${comp.styles.tailwindClasses.slice(0, 10).map(cls => `\`${cls}\``).join(', ')}`;
            if (comp.styles.tailwindClasses.length > 10) {
              md += ` +${comp.styles.tailwindClasses.length - 10}個`;
            }
            md += '\n';
          }
          
          // Examples
          if (comp.examples.length > 0) {
            md += `\n**使用例**:\n\n`;
            comp.examples.forEach(example => {
              md += `**${example.title}**\n\n`;
              if (example.description) {
                md += `${example.description}\n\n`;
              }
              md += '```tsx\n';
              md += example.code;
              md += '\n```\n\n';
            });
          }
          
          // Related components
          if (comp.relatedComponents.length > 0) {
            md += `**関連コンポーネント**: ${comp.relatedComponents.join(', ')}\n`;
          }
          
          md += '\n---\n\n';
        });
      }
    });

    return md;
  }

  private generatePatterns(document: AIDocument): string {
    if (document.patterns.length === 0) {
      return '';
    }

    let md = `## デザインパターン\n\n`;
    
    document.patterns.forEach(pattern => {
      md += `### ${pattern.name}\n\n`;
      md += `${pattern.description}\n\n`;
      md += `**使用コンポーネント**: ${pattern.components.join(', ')}\n\n`;
      
      if (pattern.examples.length > 0) {
        md += '**使用例**:\n\n';
        pattern.examples.forEach((example, index) => {
          md += '```tsx\n';
          md += example;
          md += '\n```\n\n';
        });
      }
    });

    return md;
  }

  private generateGuidelines(document: AIDocument): string {
    if (document.guidelines.length === 0) {
      return '';
    }

    let md = `## ガイドライン\n\n`;
    
    document.guidelines.forEach((guideline, index) => {
      md += `${index + 1}. ${guideline}\n\n`;
    });

    return md;
  }
}