import { ExtractedComponent, DesignTokens } from '../../types';

export class GuidelineGenerator {
  generateGuidelines(components: ExtractedComponent[], tokens: DesignTokens): string[] {
    const guidelines: string[] = [];

    // カラー使用ガイドライン
    guidelines.push(...this.generateColorGuidelines(tokens));

    // スペーシングガイドライン
    guidelines.push(...this.generateSpacingGuidelines(tokens));

    // レスポンシブデザインガイドライン
    guidelines.push(...this.generateResponsiveGuidelines(components));

    // ダークモードガイドライン
    guidelines.push(...this.generateDarkModeGuidelines(components));

    // コンポーネント構成ガイドライン
    guidelines.push(...this.generateComponentStructureGuidelines(components));

    // アクセシビリティガイドライン
    guidelines.push(...this.generateAccessibilityGuidelines(components));

    // パフォーマンスガイドライン
    guidelines.push(...this.generatePerformanceGuidelines(components));

    return guidelines;
  }

  private generateColorGuidelines(tokens: DesignTokens): string[] {
    const guidelines: string[] = [];
    const colorCount = Object.keys(tokens.colors).length;

    if (colorCount > 0) {
      guidelines.push(
        `カラーパレット: ${colorCount}色のカラートークンが定義されています。` +
        `プライマリカラーやセカンダリカラーを一貫して使用してください。`
      );

      // 主要カラーの分析
      const hasSemanticColors = Object.keys(tokens.colors).some(name => 
        ['primary', 'secondary', 'success', 'warning', 'error', 'info'].includes(name.toLowerCase())
      );
      
      if (hasSemanticColors) {
        guidelines.push(
          `セマンティックカラー: 意味のあるカラー名（primary, success, error等）を使用して、` +
          `カラーの意図を明確にしてください。`
        );
      }
    }

    return guidelines;
  }

  private generateSpacingGuidelines(tokens: DesignTokens): string[] {
    const guidelines: string[] = [];
    const spacingCount = Object.keys(tokens.spacing).length;

    if (spacingCount > 0) {
      guidelines.push(
        `スペーシング: ${spacingCount}種類のスペーシングトークンが利用可能です。` +
        `一貫した余白を保つため、定義されたスペーシング値を使用してください。`
      );

      // 一般的なスペーシング値の確認
      const hasStandardSpacing = Object.keys(tokens.spacing).some(name => 
        ['xs', 'sm', 'md', 'lg', 'xl'].includes(name.toLowerCase())
      );
      
      if (hasStandardSpacing) {
        guidelines.push(
          `スペーシングスケール: 小さい（xs）から大きい（xl）まで段階的なスペーシングを使用し、` +
          `視覚的な階層を作成してください。`
        );
      }
    }

    return guidelines;
  }

  private generateResponsiveGuidelines(components: ExtractedComponent[]): string[] {
    const guidelines: string[] = [];
    const responsiveComponents = components.filter(c => 
      c.tailwindClasses.some(cls => /^(sm|md|lg|xl):/.test(cls))
    );

    if (responsiveComponents.length > 0) {
      guidelines.push(
        `レスポンシブデザイン: ${responsiveComponents.length}個のコンポーネントが` +
        `レスポンシブ対応しています。モバイルファーストのアプローチを維持してください。`
      );

      // ブレークポイント使用の分析
      const breakpointUsage = new Map<string, number>();
      responsiveComponents.forEach(component => {
        component.tailwindClasses.forEach(cls => {
          const match = cls.match(/^(sm|md|lg|xl|2xl):/);
          if (match) {
            const breakpoint = match[1];
            breakpointUsage.set(breakpoint, (breakpointUsage.get(breakpoint) || 0) + 1);
          }
        });
      });

      if (breakpointUsage.size > 0) {
        const mostUsedBreakpoint = Array.from(breakpointUsage.entries())
          .sort(([,a], [,b]) => b - a)[0][0];
        guidelines.push(
          `ブレークポイント: ${mostUsedBreakpoint}が最も使用されているブレークポイントです。` +
          `一貫したブレークポイント使用を心がけてください。`
        );
      }
    }

    return guidelines;
  }

  private generateDarkModeGuidelines(components: ExtractedComponent[]): string[] {
    const guidelines: string[] = [];
    const darkModeComponents = components.filter(c => 
      c.tailwindClasses.some(cls => cls.startsWith('dark:'))
    );

    if (darkModeComponents.length > 0) {
      guidelines.push(
        `ダークモード: ${darkModeComponents.length}個のコンポーネントが` +
        `ダークモードに対応しています。新しいコンポーネントもダークモードを考慮してください。`
      );

      const darkModeRatio = darkModeComponents.length / components.length;
      if (darkModeRatio < 0.5) {
        guidelines.push(
          `ダークモード対応率: 現在${Math.round(darkModeRatio * 100)}%のコンポーネントが対応しています。` +
          `統一された体験のため、全コンポーネントでダークモード対応を検討してください。`
        );
      }
    }

    return guidelines;
  }

  private generateComponentStructureGuidelines(components: ExtractedComponent[]): string[] {
    const guidelines: string[] = [];
    
    const atomCount = components.filter(c => c.category === 'atoms').length;
    const moleculeCount = components.filter(c => c.category === 'molecules').length;
    const organismCount = components.filter(c => c.category === 'organisms').length;
    const templateCount = components.filter(c => c.category === 'templates').length;
    const pageCount = components.filter(c => c.category === 'pages').length;
    
    guidelines.push(
      `コンポーネント構成: Atoms(${atomCount}), Molecules(${moleculeCount}), ` +
      `Organisms(${organismCount}), Templates(${templateCount}), Pages(${pageCount})。` +
      `Atomic Designの原則に従ってコンポーネントを構築してください。`
    );

    // バランスの分析
    const totalComponents = components.length;
    const atomRatio = atomCount / totalComponents;
    
    if (atomRatio < 0.3) {
      guidelines.push(
        `Atomsコンポーネント: 基本的なUI要素（Atoms）の比率が低いです。` +
        `再利用可能な小さなコンポーネントを増やすことを検討してください。`
      );
    }

    if (organismCount > moleculeCount) {
      guidelines.push(
        `コンポーネント階層: Organismsが多い傾向があります。` +
        `複雑なコンポーネントは小さなMoleculesに分割できないか検討してください。`
      );
    }

    return guidelines;
  }

  private generateAccessibilityGuidelines(components: ExtractedComponent[]): string[] {
    const guidelines: string[] = [];

    // フォーカス可能な要素の確認
    const interactiveComponents = components.filter(c => 
      c.componentName.toLowerCase().includes('button') ||
      c.componentName.toLowerCase().includes('input') ||
      c.componentName.toLowerCase().includes('link') ||
      c.componentName.toLowerCase().includes('select')
    );

    if (interactiveComponents.length > 0) {
      guidelines.push(
        `アクセシビリティ: インタラクティブな要素には適切なfocus状態を提供し、` +
        `キーボードナビゲーションを考慮してください。`
      );

      // フォーカススタイルの確認
      const focusStyledComponents = interactiveComponents.filter(c =>
        c.tailwindClasses.some(cls => cls.startsWith('focus:'))
      );

      if (focusStyledComponents.length < interactiveComponents.length) {
        guidelines.push(
          `フォーカススタイル: 一部のインタラクティブコンポーネントにfocus状態が` +
          `定義されていません。全てのインタラクティブ要素にfocus状態を追加してください。`
        );
      }
    }

    return guidelines;
  }

  private generatePerformanceGuidelines(components: ExtractedComponent[]): string[] {
    const guidelines: string[] = [];

    // アニメーションの使用状況
    const animatedComponents = components.filter(c =>
      c.tailwindClasses.some(cls => cls.startsWith('animate-') || cls.startsWith('transition'))
    );

    if (animatedComponents.length > 0) {
      guidelines.push(
        `アニメーション: ${animatedComponents.length}個のコンポーネントでアニメーションを使用しています。` +
        `パフォーマンスを考慮し、必要な場合のみアニメーションを使用してください。`
      );
    }

    // 複雑なコンポーネントの特定
    const complexComponents = components.filter(c => 
      c.tailwindClasses.length > 20 || c.props.length > 10
    );

    if (complexComponents.length > 0) {
      guidelines.push(
        `コンポーネント複雑度: ${complexComponents.length}個のコンポーネントが複雑です。` +
        `パフォーマンスと保守性のため、コンポーネントの分割を検討してください。`
      );
    }

    return guidelines;
  }
}