import { AIDocument } from '../../types';

/**
 * MarkdownFormatter - 構造化ドキュメントのMarkdown変換器
 * 
 * このクラスは、AIDocumentGeneratorが生成した構造化されたAIDocumentを、
 * 人間が読みやすく、GitHubやドキュメントサイトで表示可能なMarkdown形式に変換する
 * 専門フォーマッターです。日本語でのドキュメント作成に最適化されており、
 * テーブル、コードブロック、階層構造を活用した見やすいドキュメントを生成します。
 * 
 * 主な責務:
 * - 構造化AIDocumentの人間読み取り可能な形式への変換
 * - 階層的な目次とナビゲーション構造の生成
 * - Markdownテーブルを活用したデザイントークン一覧の整理
 * - コンポーネントドキュメントの体系的な整理
 * - コード例のシンタックスハイライト対応フォーマット
 * - GitHub Flavored Markdownとの互換性保証
 * 
 * 生成されるMarkdownの構造:
 * 1. ヘッダー部分（プロジェクト情報、生成日時）
 * 2. 目次（自動生成されたリンク）
 * 3. デザイントークン（カラー、スペーシング、タイポグラフィ等）
 * 4. コンポーネント一覧（Atomic Design階層別）
 * 5. デザインパターン（検出された再利用可能パターン）
 * 6. ガイドライン（ベストプラクティス）
 * 
 * Markdown特性への最適化:
 * - 日本語文字列でのアンカーリンク対応
 * - テーブルの列幅最適化
 * - コードブロックのTypeScript/TSXシンタックス指定
 * - 情報量が多い場合の適切な省略処理
 * - 絵文字とアイコンを活用した視覚的な情報伝達
 * 
 * 使用例:
 * const formatter = new MarkdownFormatter();
 * const markdown = formatter.generateMarkdown(aiDocument);
 * await fs.writeFile('design-system.md', markdown);
 * 
 * 他クラスとの関係:
 * - AIDocumentGenerator: このクラスでMarkdown形式での保存を実行
 * - ComponentDocumentGenerator: 生成されたコンポーネントドキュメントをMarkdown化
 * - PatternDetector/GuidelineGenerator: これらが生成した内容をMarkdown化
 */

export class MarkdownFormatter {
  /**
   * AIDocumentを包括的なMarkdownドキュメントに変換するメインメソッド
   * 
   * 構造化されたAIDocumentの全セクションを順次Markdown形式に変換し、
   * 一つの統合されたドキュメント文字列として組み合わせます。
   * 各セクションは独立して生成され、一貫したフォーマットで結合されます。
   * 
   * 生成順序:
   * 1. ヘッダー（プロジェクト情報、メタデータ）
   * 2. 目次（各セクションへの自動リンク）
   * 3. デザイントークン（システムの基本要素）
   * 4. コンポーネント（Atomic Design階層順）
   * 5. デザインパターン（再利用可能なパターン）
   * 6. ガイドライン（ベストプラクティス）
   * 
   * @param document 変換対象のAIDocument
   * @returns 完全なMarkdownドキュメント文字列
   */
  generateMarkdown(document: AIDocument): string {
    let md = this.generateHeader(document);          // プロジェクト基本情報
    md += this.generateTableOfContents();           // ナビゲーション目次
    md += this.generateDesignTokens(document);      // デザイントークン一覧
    md += this.generateComponents(document);         // コンポーネント詳細
    md += this.generatePatterns(document);           // デザインパターン
    md += this.generateGuidelines(document);         // ガイドライン
    
    return md;
  }

  /**
   * ドキュメントヘッダー部分を生成
   * 
   * プロジェクトの基本情報、生成メタデータ、技術スタックを
   * Markdownヘッダー形式で整理して表示します。
   * 
   * @param document ヘッダー情報の源となるAIDocument
   * @returns ヘッダー部分のMarkdown文字列
   */
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

  /**
   * 目次セクションを生成
   * 
   * ドキュメント内の主要セクションへの自動リンクを含む目次を生成します。
   * 日本語アンカーリンクでGitHub Markdownとの互換性を保ちます。
   * 
   * @returns 目次部分のMarkdown文字列
   */
  private generateTableOfContents(): string {
    return `## 目次

1. [デザイントークン](#デザイントークン)
2. [コンポーネント一覧](#コンポーネント一覧)
3. [デザインパターン](#デザインパターン)
4. [ガイドライン](#ガイドライン)

`;
  }

  /**
   * デザイントークンセクションを生成
   * 
   * プロジェクトで使用されているデザイントークン（カラー、スペーシング、
   * タイポグラフィ、ボーダー半径、シャドウ）を整理されたMarkdownテーブルで表示します。
   * 情報量が多い場合は適切に省略し、可読性を保ちます。
   * 
   * @param document トークン情報を含むAIDocument
   * @returns デザイントークン部分のMarkdown文字列
   */
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

  /**
   * コンポーネント一覧セクションを生成
   * 
   * Atomic Design階層（Atoms → Molecules → Organisms → Templates → Pages）
   * に従ってコンポーネントを整理し、各コンポーネントの詳細情報を
   * 体系的なMarkdown形式で表示します。
   * 
   * 各コンポーネントに含まれる情報:
   * - 基本説明とカテゴリ
   * - 使用方法とコード例
   * - Props詳細（テーブル形式）
   * - スタイル情報（レスポンシブ、ダークモード、アニメーション）
   * - 使用しているTailwindクラス
   * - 実用的なコード例
   * - 関連コンポーネント
   * 
   * @param document コンポーネント情報を含むAIDocument
   * @returns コンポーネント一覧部分のMarkdown文字列
   */
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

  /**
   * デザインパターンセクションを生成
   * 
   * PatternDetectorが検出した再利用可能なデザインパターンを
   * ドキュメント化し、実用的なコード例と組み合わせて表示します。
   * パターンが存在しない場合は空文字列を返します。
   * 
   * 各パターンに含まれる情報:
   * - パターン名と説明
   * - 使用しているコンポーネント一覧
   * - 実装例のコードブロック
   * 
   * @param document パターン情報を含むAIDocument
   * @returns デザインパターン部分のMarkdown文字列（パターンがない場合は空文字列）
   */
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
          md += '```tsx\n';  // TypeScriptシンタックスハイライト
          md += example;
          md += '\n```\n\n';
        });
      }
    });

    return md;
  }

  /**
   * ガイドラインセクションを生成
   * 
   * GuidelineGeneratorが生成したベストプラクティスガイドラインを
   * 番号付きリスト形式で整理して表示します。
   * ガイドラインが存在しない場合は空文字列を返します。
   * 
   * @param document ガイドライン情報を含むAIDocument
   * @returns ガイドライン部分のMarkdown文字列（ガイドラインがない場合は空文字列）
   */
  private generateGuidelines(document: AIDocument): string {
    if (document.guidelines.length === 0) {
      return '';
    }

    let md = `## ガイドライン\n\n`;
    
    // 各ガイドラインを番号付きリスト形式で整理
    document.guidelines.forEach((guideline, index) => {
      md += `${index + 1}. ${guideline}\n\n`;
    });

    return md;
  }
}